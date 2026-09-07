// ============================================================
// @aeds/aem — AEM Content MCP page content → EDS component export
// Uses Adobe MCP (search-aem-pages / get-aem-page-content) when tokenized;
// normalizes MCP trees into the same component nodes used for LLM prompts.
// ============================================================

import { resolveAemAccessToken } from './ims-auth.js';
import {
  pageUrlToContentPath,
  toAuthorJcrBase,
  type JcrComponentNode,
  type JcrPageExport,
} from './jcr-export.js';

export interface McpGridHints {
  default?: number;
  tablet?: number;
  phone?: number;
}

export interface McpPageNode {
  id?: string;
  componentType?: string;
  properties?: Record<string, unknown>;
  items?: McpPageNode[];
  'capi-key'?: string;
  'capi-index'?: number;
  [key: string]: unknown;
}

const DEFAULT_MCP_URL =
  process.env.AEM_MCP_URL?.trim() ||
  'https://mcp.adobeaemcloud.com/adobe/mcp/content-readonly';

/** Page shells / layout — skip as prompt components; keep walking children. */
function isSkippedLayoutComponentType(componentType: string): boolean {
  if (!componentType) return true;
  if (componentType === 'cq:responsive' || componentType.startsWith('cq:')) return true;
  return (
    /\/components\/page$/i.test(componentType) ||
    /\/components\/container$/i.test(componentType) ||
    /components\/page(\/|$)/i.test(componentType) ||
    /components\/container(\/|$)/i.test(componentType) ||
    /wcm\/foundation\/components\/responsivegrid$/i.test(componentType) ||
    /wcm\/foundation\/components\/parsys$/i.test(componentType) ||
    /core\/wcm\/components\/page\//i.test(componentType) ||
    /core\/wcm\/components\/container\//i.test(componentType)
  );
}

const RESOURCE_TO_BLOCK: Array<{ match: RegExp; block: string }> = [
  { match: /experiencefragment|xfpage|teaser|card|list/i, block: 'cards' },
  { match: /hero|banner|pagetitle|title/i, block: 'hero' },
  { match: /column|layout|responsivegrid|container/i, block: 'columns' },
  { match: /quote|blockquote/i, block: 'quote' },
  { match: /accordion/i, block: 'accordion' },
  { match: /tabs?/i, block: 'tabs' },
  { match: /carousel|slider/i, block: 'carousel' },
  { match: /embed|video/i, block: 'embed' },
  { match: /image|picture/i, block: 'hero' },
  { match: /text|richtext/i, block: 'columns' },
];

function suggestedBlockFromComponentType(componentType: string): string {
  for (const rule of RESOURCE_TO_BLOCK) {
    if (rule.match.test(componentType)) return rule.block;
  }
  const leaf = componentType.split('/').pop() || 'block';
  return leaf.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'block';
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function sanitizeProps(props: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!props) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('jcr:') && k !== 'jcr:title' && k !== 'jcr:description' && k !== 'jcr:uuid') {
      continue;
    }
    if (
      [
        'jcr:created',
        'jcr:createdBy',
        'jcr:lastModified',
        'jcr:lastModifiedBy',
        'cq:lastModified',
        'cq:lastModifiedBy',
        'cq:lastReplicated',
        'cq:lastReplicatedBy',
        'cq:lastReplicationAction',
        'cq:isDelivered',
        'jcr:mixinTypes',
        'jcr:versionHistory',
        'jcr:predecessors',
        'jcr:baseVersion',
        'jcr:isCheckedOut',
        'jcr:primaryType',
      ].includes(k)
    ) {
      continue;
    }
    if (isPlainObject(v) || Array.isArray(v)) continue;
    if (typeof v === 'string' && v.length > 4000) {
      out[k] = `${v.slice(0, 4000)}…`;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function extractGrid(items: McpPageNode[] | undefined): McpGridHints | undefined {
  if (!items?.length) return undefined;
  const responsive = items.find((n) => n.id === 'cq:responsive' || !n.componentType);
  const breakpoints = responsive?.items || items.filter((n) => ['default', 'tablet', 'phone'].includes(String(n.id)));
  if (!breakpoints?.length) return undefined;
  const grid: McpGridHints = {};
  for (const bp of breakpoints) {
    const id = String(bp.id || '');
    const width = Number(bp.properties?.['width']);
    if (!Number.isFinite(width)) continue;
    if (id === 'default') grid.default = width;
    if (id === 'tablet') grid.tablet = width;
    if (id === 'phone') grid.phone = width;
  }
  return Object.keys(grid).length > 0 ? grid : undefined;
}

/** Flatten MCP get-aem-page-content tree into prompt-ready component nodes. */
export function flattenMcpPageContent(
  root: McpPageNode,
  pagePath: string,
): { components: JcrComponentNode[]; title?: string; template?: string } {
  const components: JcrComponentNode[] = [];

  const walkRoot = (node: McpPageNode, path: string, depth: number) => {
    if (depth > 30) return;
    const componentType = String(node.componentType || '');
    const id = String(node.id || 'node');
    const childNodes = Array.isArray(node.items) ? node.items : [];

    if (componentType && !isSkippedLayoutComponentType(componentType)) {
      const grid = extractGrid(childNodes);
      const childComponents: JcrComponentNode[] = [];
      for (const child of childNodes) {
        if (!child?.componentType) continue;
        if (isSkippedLayoutComponentType(String(child.componentType))) continue;
        childComponents.push({
          path: `${path}/${child.id}`,
          name: String(child.id || 'child'),
          resourceType: String(child.componentType),
          suggestedBlock: suggestedBlockFromComponentType(String(child.componentType)),
          properties: sanitizeProps(child.properties),
          children: [],
        });
      }
      components.push({
        path,
        name: id,
        resourceType: componentType,
        suggestedBlock: suggestedBlockFromComponentType(componentType),
        properties: {
          ...sanitizeProps(node.properties),
          ...(grid ? { _grid: grid } : {}),
        },
        children: childComponents.slice(0, 12),
      });
    }

    for (const child of childNodes) {
      if (!child || typeof child !== 'object') continue;
      if (child.id === 'cq:responsive') continue;
      walkRoot(child, `${path}/${child.id || 'item'}`, depth + 1);
    }
  };

  walkRoot(root, `${pagePath}/jcr:content`, 0);

  const seen = new Set<string>();
  const unique = components.filter((c) => {
    if (seen.has(c.path)) return false;
    seen.add(c.path);
    return true;
  });

  const title =
    (typeof root.properties?.['jcr:title'] === 'string' && root.properties['jcr:title']) ||
    undefined;
  const template =
    (typeof root.properties?.['cq:template'] === 'string' && root.properties['cq:template']) ||
    undefined;

  return { components: unique, title, template };
}

/** Compact MCP-shaped JSON for LLM prompts (matches design doc). */
export function formatMcpComponentsForPrompt(
  components: JcrComponentNode[],
  maxChars = 6000,
): string {
  const payload = components.map((c) => {
    const props = { ...c.properties };
    const grid = props['_grid'];
    delete props['_grid'];
    return {
      id: c.name,
      componentType: c.resourceType,
      properties: props,
      ...(grid ? { grid } : {}),
    };
  });
  const json = JSON.stringify(payload, null, 2);
  if (json.length <= maxChars) return json;
  return `${json.slice(0, maxChars)}\n/* …truncated… */`;
}

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

/**
 * Call an Adobe AEM MCP tool via Streamable HTTP / JSON-RPC tools/call.
 * Requires a user OAuth token from Cursor/Claude MCP login (`AEM_MCP_ACCESS_TOKEN`).
 * Service-account IMS tokens often fail — caller should fall back to JCR.
 */
export async function callAemMcpTool<T = unknown>(input: {
  toolName: string;
  arguments: Record<string, unknown>;
  mcpUrl?: string;
  accessToken?: string;
  timeoutMs?: number;
}): Promise<{ ok: boolean; result?: T; error?: string; rawText?: string }> {
  const auth = await resolveMcpToken(input.accessToken);
  if (!auth.token) {
    return { ok: false, error: 'No AEM MCP access token (set AEM_MCP_ACCESS_TOKEN after Cursor MCP login)' };
  }

  const url = (input.mcpUrl || DEFAULT_MCP_URL).replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 45000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'User-Agent': 'AI-EDS-Developer/0.1 (aem-mcp)',
      },
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
      };
    }

    // Prefer JSON body; some MCP transports return SSE lines
    let payload: unknown = null;
    try {
      payload = JSON.parse(text);
    } catch {
      const dataLine = text
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l.startsWith('data:'));
      if (dataLine) {
        try {
          payload = JSON.parse(dataLine.replace(/^data:\s*/, ''));
        } catch {
          return { ok: false, error: 'MCP response was not JSON', rawText: text.slice(0, 2000) };
        }
      } else {
        return { ok: false, error: 'MCP response was not JSON', rawText: text.slice(0, 2000) };
      }
    }

    const rpc = payload as {
      error?: { message?: string };
      result?: {
        content?: Array<{ type?: string; text?: string }>;
        isError?: boolean;
        structuredContent?: unknown;
      };
    };

    if (rpc.error?.message) {
      return { ok: false, error: rpc.error.message, rawText: text.slice(0, 2000) };
    }

    const result = rpc.result;
    if (result?.isError) {
      const errText = result.content?.map((c) => c.text).filter(Boolean).join('\n') || 'MCP tool error';
      return { ok: false, error: errText, rawText: text.slice(0, 2000) };
    }

    // Prefer structuredContent; else parse text content (often "Page Content:\nETag: …\n{json}")
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
        // fall through — return raw text for caller
      }
    }

    if (textBlob.trim()) {
      return { ok: true, result: textBlob as T };
    }

    return { ok: false, error: 'Empty MCP tool result', rawText: text.slice(0, 2000) };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

function parseSearchHits(raw: unknown): Array<{
  pageId?: string;
  authorPath?: string;
  path?: string;
  sourceType?: string;
  title?: string;
}> {
  if (Array.isArray(raw)) return raw as ReturnType<typeof parseSearchHits>;
  if (isPlainObject(raw)) {
    const items = raw['items'] || raw['results'] || raw['pages'] || raw['data'];
    if (Array.isArray(items)) return items as ReturnType<typeof parseSearchHits>;
  }
  if (typeof raw === 'string') {
    try {
      return parseSearchHits(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  return [];
}

function normalizePath(p: string): string {
  return p.replace(/\.html$/i, '').replace(/\/$/, '').toLowerCase();
}

/**
 * Resolve MCP pageId for a /content/… URL via search-aem-pages, preferring classic AEM (not AEM_EDGE).
 */
export async function resolveMcpPageId(input: {
  authorUrl: string;
  contentPath: string;
  accessToken?: string;
  mcpUrl?: string;
}): Promise<{ pageId?: string; notes: string[] }> {
  const notes: string[] = [];
  const leaf = input.contentPath.split('/').filter(Boolean).pop() || input.contentPath;
  const search = await callAemMcpTool({
    toolName: 'search-aem-pages',
    arguments: {
      authorUrl: input.authorUrl.replace(/\/$/, ''),
      q: leaf,
      limit: 20,
    },
    accessToken: input.accessToken,
    mcpUrl: input.mcpUrl,
  });

  if (!search.ok) {
    notes.push(`MCP search-aem-pages failed: ${search.error}`);
    return { notes };
  }

  const hits = parseSearchHits(search.result);
  notes.push(`MCP search returned ${hits.length} hit(s) for q="${leaf}"`);

  const target = normalizePath(input.contentPath);
  const scored = hits
    .map((h) => {
      const path = normalizePath(String(h.authorPath || h.path || ''));
      const sourceType = String(h.sourceType || '');
      let score = 0;
      if (path === target) score += 100;
      else if (path.endsWith(target) || target.endsWith(path)) score += 50;
      if (/^AEM$/i.test(sourceType)) score += 20; // prefer classic Sites over AEM_EDGE
      if (/AEM_EDGE/i.test(sourceType)) score -= 10;
      return { ...h, score, path };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (best?.pageId && best.score > 0) {
    notes.push(`MCP pageId ${best.pageId} for ${best.path || input.contentPath} (${best.sourceType || 'unknown'})`);
    return { pageId: String(best.pageId), notes };
  }

  notes.push(`No MCP page match for ${input.contentPath}`);
  return { notes };
}

function parsePageContentRoot(raw: unknown): McpPageNode | null {
  if (isPlainObject(raw) && (raw['componentType'] || raw['id'] || raw['items'])) {
    return raw as McpPageNode;
  }
  if (typeof raw === 'string') {
    const start = raw.indexOf('{');
    if (start >= 0) {
      try {
        return parsePageContentRoot(JSON.parse(raw.slice(start)));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Fetch page structure via Adobe Content MCP and flatten for EDS LLM prompts.
 */
export async function exportPageMcpComponents(input: {
  pageUrl: string;
  authorUrl?: string;
  pageId?: string;
  accessToken?: string;
  mcpUrl?: string;
}): Promise<JcrPageExport & { source: 'mcp' }> {
  const notes: string[] = [];
  const contentPath = pageUrlToContentPath(input.pageUrl);
  if (!contentPath) {
    return {
      source: 'mcp',
      pagePath: '',
      fetchedFrom: input.pageUrl,
      components: [],
      rawNodeCount: 0,
      notes: [`Not a /content/… page URL: ${input.pageUrl}`],
      ok: false,
    };
  }

  const authorBase = toAuthorJcrBase(input.pageUrl, input.authorUrl);
  if (!authorBase || !/author-/i.test(authorBase)) {
    notes.push(`MCP needs an AEM author host; derived base=${authorBase || '(empty)'}`);
  }

  let pageId = input.pageId?.trim();
  if (!pageId) {
    const resolved = await resolveMcpPageId({
      authorUrl: authorBase,
      contentPath,
      accessToken: input.accessToken,
      mcpUrl: input.mcpUrl,
    });
    notes.push(...resolved.notes);
    pageId = resolved.pageId;
  }

  if (!pageId) {
    return {
      source: 'mcp',
      pagePath: contentPath,
      fetchedFrom: input.pageUrl,
      components: [],
      rawNodeCount: 0,
      notes,
      ok: false,
    };
  }

  const content = await callAemMcpTool({
    toolName: 'get-aem-page-content',
    arguments: {
      authorUrl: authorBase.replace(/\/$/, ''),
      pageId,
    },
    accessToken: input.accessToken,
    mcpUrl: input.mcpUrl,
  });

  if (!content.ok) {
    notes.push(`MCP get-aem-page-content failed: ${content.error}`);
    return {
      source: 'mcp',
      pagePath: contentPath,
      fetchedFrom: `mcp:${pageId}`,
      components: [],
      rawNodeCount: 0,
      notes,
      ok: false,
    };
  }

  const root = parsePageContentRoot(content.result);
  if (!root) {
    notes.push('MCP page content could not be parsed as a component tree');
    return {
      source: 'mcp',
      pagePath: contentPath,
      fetchedFrom: `mcp:${pageId}`,
      components: [],
      rawNodeCount: 0,
      notes,
      ok: false,
    };
  }

  const flat = flattenMcpPageContent(root, contentPath);
  notes.push(`MCP extracted ${flat.components.length} component node(s) (page/container skipped)`);

  return {
    source: 'mcp',
    pagePath: contentPath,
    fetchedFrom: `mcp:${pageId}`,
    title: flat.title,
    template: flat.template,
    components: flat.components,
    rawNodeCount: flat.components.length,
    notes,
    ok: flat.components.length > 0,
  };
}
