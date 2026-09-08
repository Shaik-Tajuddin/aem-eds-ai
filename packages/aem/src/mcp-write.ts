// ============================================================
// @aeds/aem — AEM Cloud MCP read-api / write-api page authoring
// Experimental pages API via sandboxed aem.get / aem.put / aem.patch
// ============================================================

import { callAemCloudMcpSessionTool } from './mcp-session.js';

export const EXPERIMENTAL_PAGES_PREFIX =
  process.env.AEM_EXPERIMENTAL_PAGES_PREFIX?.trim() ||
  '/adobe/experimental/aspm-expires-20251231/pages';

export interface McpPageContentResult {
  status?: number;
  etag?: string;
  body?: unknown;
  [key: string]: unknown;
}

/** Normalize authoring path or full author/UE URL → `/content/...` path (no .html). */
export function toAuthorContentPath(input: string): string {
  const raw = (input || '').trim();
  if (!raw) return '';

  let path = raw;
  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      // UE canvas often puts the content path in the hash: /ui#/aem/.../content/...
      path = `${u.pathname}${u.hash || ''}${u.search || ''}`;
    }
  } catch {
    // keep raw
  }

  // UE canvas: .../universal-editor/canvas/{host}/content/...
  const canvasIdx = path.indexOf('/content/');
  if (canvasIdx >= 0) {
    path = path.slice(canvasIdx);
  }

  path = path.split('?')[0] || path;
  path = path.replace(/\.html$/i, '').replace(/\/$/, '');
  if (!path.startsWith('/content/')) {
    if (path.startsWith('content/')) path = `/${path}`;
  }
  return path;
}

function escapeForSandbox(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function unwrapToolPayload(raw: unknown): McpPageContentResult {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as McpPageContentResult;
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as McpPageContentResult;
    } catch {
      return { body: raw };
    }
  }
  return { body: raw };
}

/**
 * Resolve experimental pageId from author content path.
 */
export async function resolveExperimentalPageId(input: {
  aemUrl: string;
  authorPath: string;
  accessToken?: string;
  mcpUrl?: string;
}): Promise<{ ok: boolean; pageId?: string; error?: string; raw?: unknown }> {
  const authorPath = toAuthorContentPath(input.authorPath);
  if (!authorPath) {
    return { ok: false, error: 'authorPath is required' };
  }
  const aemUrl = input.aemUrl.replace(/\/$/, '');
  const pathEsc = escapeForSandbox(authorPath);
  const prefix = EXPERIMENTAL_PAGES_PREFIX;

  const call = await callAemCloudMcpSessionTool({
    toolName: 'read-api',
    mcpUrl: input.mcpUrl,
    accessToken: input.accessToken,
    arguments: {
      aemUrl,
      code: `
        const r = await aem.get('${prefix}?authorPath=${pathEsc}');
        return { status: r.status, etag: r.etag, body: r.body };
      `,
    },
  });

  if (!call.ok) {
    return { ok: false, error: call.error, raw: call.rawText };
  }

  const payload = unwrapToolPayload(call.result);
  const body = payload.body;
  let pageId: string | undefined;

  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b.pageId === 'string') pageId = b.pageId;
    else if (typeof b.id === 'string') pageId = b.id;
    else if (Array.isArray(b.items) && b.items[0] && typeof b.items[0] === 'object') {
      const first = b.items[0] as Record<string, unknown>;
      if (typeof first.pageId === 'string') pageId = first.pageId;
      else if (typeof first.id === 'string') pageId = first.id;
    } else if (Array.isArray(b.results) && b.results[0] && typeof b.results[0] === 'object') {
      const first = b.results[0] as Record<string, unknown>;
      if (typeof first.pageId === 'string') pageId = first.pageId;
      else if (typeof first.id === 'string') pageId = first.id;
    }
  }

  if (!pageId) {
    return {
      ok: false,
      error: `Could not resolve pageId for ${authorPath}`,
      raw: payload,
    };
  }

  return { ok: true, pageId, raw: payload };
}

/**
 * GET experimental page content + ETag via read-api.
 */
export async function getExperimentalPageContent(input: {
  aemUrl: string;
  pageId: string;
  accessToken?: string;
  mcpUrl?: string;
}): Promise<{ ok: boolean; etag?: string; body?: unknown; status?: number; error?: string; raw?: unknown }> {
  const aemUrl = input.aemUrl.replace(/\/$/, '');
  const pageId = escapeForSandbox(input.pageId);
  const prefix = EXPERIMENTAL_PAGES_PREFIX;

  const call = await callAemCloudMcpSessionTool({
    toolName: 'read-api',
    mcpUrl: input.mcpUrl,
    accessToken: input.accessToken,
    arguments: {
      aemUrl,
      code: `
        const r = await aem.get('${prefix}/${pageId}/content');
        return { status: r.status, etag: r.etag, body: r.body };
      `,
    },
  });

  if (!call.ok) {
    return { ok: false, error: call.error, raw: call.rawText };
  }

  const payload = unwrapToolPayload(call.result);
  return {
    ok: true,
    etag: typeof payload.etag === 'string' ? payload.etag : undefined,
    body: payload.body,
    status: typeof payload.status === 'number' ? payload.status : undefined,
    raw: payload,
  };
}

/**
 * PUT experimental page content via write-api (requires If-Match ETag).
 */
export async function putExperimentalPageContent(input: {
  aemUrl: string;
  pageId: string;
  content: unknown;
  etag: string;
  accessToken?: string;
  mcpUrl?: string;
}): Promise<{ ok: boolean; etag?: string; body?: unknown; status?: number; error?: string; raw?: unknown }> {
  const aemUrl = input.aemUrl.replace(/\/$/, '');
  const pageId = escapeForSandbox(input.pageId);
  const etag = escapeForSandbox(input.etag);
  const prefix = EXPERIMENTAL_PAGES_PREFIX;
  const treeJson = JSON.stringify(input.content);

  const call = await callAemCloudMcpSessionTool({
    toolName: 'write-api',
    mcpUrl: input.mcpUrl,
    accessToken: input.accessToken,
    timeoutMs: 120000,
    arguments: {
      aemUrl,
      code: `
        const tree = ${treeJson};
        const r = await aem.put('${prefix}/${pageId}/content', tree, '${etag}');
        return { status: r.status, etag: r.etag, body: r.body };
      `,
    },
  });

  if (!call.ok) {
    return { ok: false, error: call.error, raw: call.rawText };
  }

  const payload = unwrapToolPayload(call.result);
  return {
    ok: true,
    etag: typeof payload.etag === 'string' ? payload.etag : undefined,
    body: payload.body,
    status: typeof payload.status === 'number' ? payload.status : undefined,
    raw: payload,
  };
}

/**
 * PATCH experimental page content via write-api JSON Patch.
 */
export async function patchExperimentalPageContent(input: {
  aemUrl: string;
  pageId: string;
  patch: unknown;
  etag: string;
  accessToken?: string;
  mcpUrl?: string;
}): Promise<{ ok: boolean; etag?: string; body?: unknown; status?: number; error?: string; raw?: unknown }> {
  const aemUrl = input.aemUrl.replace(/\/$/, '');
  const pageId = escapeForSandbox(input.pageId);
  const etag = escapeForSandbox(input.etag);
  const prefix = EXPERIMENTAL_PAGES_PREFIX;
  const patchJson = JSON.stringify(input.patch);

  const call = await callAemCloudMcpSessionTool({
    toolName: 'write-api',
    mcpUrl: input.mcpUrl,
    accessToken: input.accessToken,
    timeoutMs: 120000,
    arguments: {
      aemUrl,
      code: `
        const ops = ${patchJson};
        const r = await aem.patch('${prefix}/${pageId}/content', ops, '${etag}');
        return { status: r.status, etag: r.etag, body: r.body };
      `,
    },
  });

  if (!call.ok) {
    return { ok: false, error: call.error, raw: call.rawText };
  }

  const payload = unwrapToolPayload(call.result);
  return {
    ok: true,
    etag: typeof payload.etag === 'string' ? payload.etag : undefined,
    body: payload.body,
    status: typeof payload.status === 'number' ? payload.status : undefined,
    raw: payload,
  };
}

/**
 * Fetch rendered HTML (or any path) via read-api aem.get for verification.
 */
export async function getAuthorHtmlViaMcp(input: {
  aemUrl: string;
  pathOrUrl: string;
  accessToken?: string;
  mcpUrl?: string;
}): Promise<{ ok: boolean; status?: number; html?: string; error?: string }> {
  const aemUrl = input.aemUrl.replace(/\/$/, '');
  let path = input.pathOrUrl.trim();
  if (/^https?:\/\//i.test(path)) {
    try {
      const u = new URL(path);
      path = u.pathname + u.search;
    } catch {
      // keep
    }
  }
  const pathEsc = escapeForSandbox(path);

  const call = await callAemCloudMcpSessionTool({
    toolName: 'read-api',
    mcpUrl: input.mcpUrl,
    accessToken: input.accessToken,
    arguments: {
      aemUrl,
      code: `
        const r = await aem.get('${pathEsc}');
        return { status: r.status, body: r.body };
      `,
    },
  });

  if (!call.ok) {
    return { ok: false, error: call.error };
  }

  const payload = unwrapToolPayload(call.result);
  const html = typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body ?? '');
  return {
    ok: true,
    status: typeof payload.status === 'number' ? payload.status : undefined,
    html,
  };
}
