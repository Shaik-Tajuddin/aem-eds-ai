// ============================================================
// @aeds/aem — Session-aware Adobe AEM Cloud MCP client (write-capable)
// Uses Streamable HTTP JSON-RPC with initialize + mcp-session-id.
// Token: AEM_MCP_ACCESS_TOKEN (user OAuth from Cursor aem-cloud login).
// ============================================================

import { resolveAemAccessToken } from './ims-auth.js';

export const AEM_CLOUD_MCP_WRITE_URL =
  process.env.AEM_MCP_WRITE_URL?.trim() ||
  process.env.AEM_MCP_URL?.trim() ||
  'https://mcp.adobeaemcloud.com/adobe/mcp/aem';

async function resolveMcpToken(explicit?: string): Promise<{ token?: string; source?: string }> {
  if (explicit?.trim()) {
    return { token: explicit.trim().replace(/^Bearer\s+/i, ''), source: 'explicit' };
  }
  const mcpTok = process.env.AEM_MCP_ACCESS_TOKEN?.trim();
  if (mcpTok) {
    return { token: mcpTok.replace(/^Bearer\s+/i, ''), source: 'AEM_MCP_ACCESS_TOKEN' };
  }
  const bearer = process.env.AEM_BEARER_TOKEN?.trim();
  if (bearer) {
    return { token: bearer.replace(/^Bearer\s+/i, ''), source: 'AEM_BEARER_TOKEN' };
  }
  try {
    const ims = await resolveAemAccessToken();
    if (ims?.accessToken) {
      return { token: ims.accessToken, source: ims.source };
    }
  } catch {
    // fall through
  }
  return {};
}

function parseRpcPayload(text: string): {
  error?: { message?: string };
  result?: {
    content?: Array<{ type?: string; text?: string }>;
    isError?: boolean;
    structuredContent?: unknown;
  };
} | null {
  try {
    return JSON.parse(text);
  } catch {
    const dataLine = text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('data:'));
    if (!dataLine) return null;
    try {
      return JSON.parse(dataLine.replace(/^data:\s*/, ''));
    } catch {
      return null;
    }
  }
}

function extractToolResult<T>(rpc: NonNullable<ReturnType<typeof parseRpcPayload>>): {
  ok: boolean;
  result?: T;
  error?: string;
  rawText?: string;
} {
  if (rpc.error?.message) {
    return { ok: false, error: rpc.error.message };
  }
  const result = rpc.result;
  if (result?.isError) {
    const errText = result.content?.map((c) => c.text).filter(Boolean).join('\n') || 'MCP tool error';
    return { ok: false, error: errText };
  }
  if (result?.structuredContent !== undefined) {
    return { ok: true, result: result.structuredContent as T };
  }
  const textBlob = result?.content?.map((c) => c.text || '').join('\n') || '';
  const jsonStart = textBlob.indexOf('{');
  const jsonArrStart = textBlob.indexOf('[');
  let sliceFrom = -1;
  if (jsonStart >= 0 && (jsonArrStart < 0 || jsonStart < jsonArrStart)) sliceFrom = jsonStart;
  else if (jsonArrStart >= 0) sliceFrom = jsonArrStart;
  if (sliceFrom >= 0) {
    try {
      return { ok: true, result: JSON.parse(textBlob.slice(sliceFrom)) as T };
    } catch {
      // fall through
    }
  }
  if (textBlob.trim()) {
    return { ok: true, result: textBlob as T };
  }
  return { ok: false, error: 'Empty MCP tool result' };
}

/**
 * Call an Adobe AEM Cloud MCP tool with session handshake (required for read-api / write-api).
 */
export async function callAemCloudMcpSessionTool<T = unknown>(input: {
  toolName: string;
  arguments: Record<string, unknown>;
  mcpUrl?: string;
  accessToken?: string;
  timeoutMs?: number;
}): Promise<{ ok: boolean; result?: T; error?: string; rawText?: string; tokenSource?: string }> {
  const auth = await resolveMcpToken(input.accessToken);
  if (!auth.token) {
    return {
      ok: false,
      error: 'No AEM MCP access token (set AEM_MCP_ACCESS_TOKEN after Cursor aem-cloud OAuth login)',
    };
  }

  const url = (input.mcpUrl || AEM_CLOUD_MCP_WRITE_URL).replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 90000);
  const baseHeaders: Record<string, string> = {
    Authorization: `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    'User-Agent': 'AI-EDS-Developer/0.1 (aem-cloud-mcp)',
  };

  try {
    const initRes = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      signal: controller.signal,
      headers: baseHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'ai-eds-developer', version: '0.1.0' },
        },
      }),
    });

    const initText = await initRes.text();
    if (!initRes.ok) {
      return {
        ok: false,
        error: `MCP initialize HTTP ${initRes.status}: ${initText.slice(0, 300)}`,
        rawText: initText.slice(0, 2000),
        tokenSource: auth.source,
      };
    }

    const sessionId = initRes.headers.get('mcp-session-id');
    if (!sessionId) {
      return {
        ok: false,
        error: 'MCP initialize did not return mcp-session-id header',
        rawText: initText.slice(0, 2000),
        tokenSource: auth.source,
      };
    }

    const sessionHeaders = { ...baseHeaders, 'mcp-session-id': sessionId };

    await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      signal: controller.signal,
      headers: sessionHeaders,
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    });

    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      signal: controller.signal,
      headers: sessionHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: input.toolName,
          arguments: input.arguments,
        },
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        error: `MCP HTTP ${res.status}: ${text.slice(0, 300)}`,
        rawText: text.slice(0, 2000),
        tokenSource: auth.source,
      };
    }

    const rpc = parseRpcPayload(text);
    if (!rpc) {
      return { ok: false, error: 'MCP response was not JSON', rawText: text.slice(0, 2000), tokenSource: auth.source };
    }

    const extracted = extractToolResult<T>(rpc);
    return { ...extracted, rawText: text.slice(0, 2000), tokenSource: auth.source };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      tokenSource: auth.source,
    };
  } finally {
    clearTimeout(timer);
  }
}
