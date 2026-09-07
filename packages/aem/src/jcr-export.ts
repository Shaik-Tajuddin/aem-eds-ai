// ============================================================
// @aeds/aem — JCR page / component export for EDS conversion
// Prefer structured component nodes over scraped HTML in LLM prompts
// ============================================================

import { resolveAemAccessToken } from './ims-auth.js';

export interface JcrComponentNode {
  /** Absolute JCR path */
  path: string;
  /** Node name */
  name: string;
  /** sling:resourceType */
  resourceType: string;
  /** Suggested EDS block id derived from resourceType */
  suggestedBlock: string;
  /** Authorable properties (secrets & binary refs stripped) */
  properties: Record<string, unknown>;
  /** Nested component children (shallow) */
  children: JcrComponentNode[];
}

export interface JcrPageExport {
  pagePath: string;
  fetchedFrom: string;
  title?: string;
  template?: string;
  components: JcrComponentNode[];
  rawNodeCount: number;
  notes: string[];
  ok: boolean;
}

const SKIP_KEYS = new Set([
  'jcr:primaryType',
  'jcr:mixinTypes',
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
]);

const RESOURCE_TO_BLOCK: Array<{ match: RegExp; block: string }> = [
  // Experience fragments → cards (contributor tiles, etc.) — before text/title rules
  { match: /experiencefragment|xfpage/i, block: 'cards' },
  { match: /teaser|card|list/i, block: 'cards' },
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

/** Page shells / layout containers — skip as prompt components; keep walking children. */
function isSkippedLayoutResourceType(resourceType: string): boolean {
  if (!resourceType) return true;
  return (
    /\/components\/page$/i.test(resourceType) ||
    /\/components\/container$/i.test(resourceType) ||
    /components\/page(\/|$)/i.test(resourceType) ||
    /components\/container(\/|$)/i.test(resourceType) ||
    /wcm\/foundation\/components\/responsivegrid$/i.test(resourceType) ||
    /wcm\/foundation\/components\/parsys$/i.test(resourceType) ||
    /core\/wcm\/components\/page\//i.test(resourceType) ||
    /core\/wcm\/components\/container\//i.test(resourceType)
  );
}

function suggestedBlockFromResourceType(resourceType: string): string {
  for (const rule of RESOURCE_TO_BLOCK) {
    if (rule.match.test(resourceType)) return rule.block;
  }
  const leaf = resourceType.split('/').pop() || 'block';
  return leaf.toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'block';
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function sanitizeProps(node: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (SKIP_KEYS.has(k)) continue;
    if (k.startsWith('jcr:') && k !== 'jcr:title' && k !== 'jcr:description') continue;
    if (isPlainObject(v) || Array.isArray(v)) continue; // children walked separately
    if (typeof v === 'string' && v.length > 4000) {
      out[k] = `${v.slice(0, 4000)}…`;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function walkComponents(
  node: Record<string, unknown>,
  path: string,
  out: JcrComponentNode[],
  depth = 0,
): void {
  if (depth > 24) return;
  const resourceType = String(node['sling:resourceType'] || '');
  const name = path.split('/').filter(Boolean).pop() || 'node';

  const childComponents: JcrComponentNode[] = [];
  for (const [key, val] of Object.entries(node)) {
    if (!isPlainObject(val)) continue;
    if (key.startsWith('jcr:') || key.startsWith('cq:') || key.startsWith('sling:')) continue;
    walkComponents(val, `${path}/${key}`, childComponents, depth + 1);
  }

  // Keep real components only — skip page/container/layout shells and flatten children
  if (resourceType && !isSkippedLayoutResourceType(resourceType)) {
    out.push({
      path,
      name,
      resourceType,
      suggestedBlock: suggestedBlockFromResourceType(resourceType),
      properties: sanitizeProps(node),
      children: childComponents.slice(0, 12),
    });
  } else {
    // Flatten layout containers — promote children
    out.push(...childComponents);
  }
}

/** Map a page URL (author/publish/plain.html) to a JCR content path. */
export function pageUrlToContentPath(pageUrl: string): string | null {
  try {
    const u = new URL(pageUrl);
    let path = u.pathname;
    path = path.replace(/\.plain\.html$/i, '');
    path = path.replace(/\.html$/i, '');
    path = path.replace(/\.(infinity|model|-?\d+)\.json$/i, '');
    if (!path.startsWith('/content/')) return null;
    return path.replace(/\/$/, '') || null;
  } catch {
    return null;
  }
}

/** Prefer author host for JCR reads when given a publish URL. */
export function toAuthorJcrBase(pageUrl: string, authorBase?: string): string {
  try {
    const u = new URL(pageUrl);
    const m = u.hostname.match(/^(?:author|publish)-(p\d+-e\d+)\.adobeaemcloud\.com$/i);
    if (authorBase?.trim()) return authorBase.replace(/\/$/, '');
    if (m) return `https://author-${m[1]}.adobeaemcloud.com`;
    return `${u.protocol}//${u.host}`;
  } catch {
    return (authorBase || '').replace(/\/$/, '');
  }
}

async function fetchJson(
  url: string,
  bearerToken?: string,
  timeoutMs = 25000,
): Promise<{ ok: boolean; status: number; json: unknown; url: string; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'AI-EDS-Developer/0.1 (jcr-export)',
    };
    if (bearerToken?.trim()) {
      const t = bearerToken.trim().replace(/^Bearer\s+/i, '');
      headers.Authorization = `Bearer ${t}`;
    }
    const res = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: false, status: res.status, json: null, url, error: text.slice(0, 200) };
    }
    return { ok: res.ok, status: res.status, json, url: res.url || url };
  } catch (err: unknown) {
    return {
      ok: false,
      status: 0,
      json: null,
      url,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a page's JCR tree and extract component nodes for LLM prompts.
 * Tries author `.infinity.json` then `.-1.json`, then publish equivalents.
 */
export async function exportPageJcrComponents(input: {
  pageUrl: string;
  authorUrl?: string;
  bearerToken?: string;
}): Promise<JcrPageExport> {
  const notes: string[] = [];
  const contentPath = pageUrlToContentPath(input.pageUrl);
  if (!contentPath) {
    return {
      pagePath: '',
      fetchedFrom: input.pageUrl,
      components: [],
      rawNodeCount: 0,
      notes: [`Not a /content/… page URL: ${input.pageUrl}`],
      ok: false,
    };
  }

  let token = input.bearerToken?.trim().replace(/^Bearer\s+/i, '');
  if (!token) {
    try {
      const ims = await resolveAemAccessToken();
      token = ims?.accessToken;
      if (token) notes.push(`JCR auth via ${ims?.source || 'ims'}`);
    } catch (err: unknown) {
      notes.push(`IMS token for JCR failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const authorBase = toAuthorJcrBase(input.pageUrl, input.authorUrl);
  const publishBase = authorBase.replace('://author-', '://publish-');

  const candidates = [
    `${authorBase}${contentPath}.infinity.json`,
    `${authorBase}${contentPath}.-1.json`,
    `${authorBase}${contentPath}.model.json`,
    `${publishBase}${contentPath}.model.json`,
    `${publishBase}${contentPath}.infinity.json`,
  ];

  let tree: Record<string, unknown> | null = null;
  let fetchedFrom = '';

  for (const url of candidates) {
    const useToken = /adobeaemcloud\.com/i.test(url) ? token : undefined;
    const attempt = await fetchJson(url, useToken);
    if (!attempt.ok || !isPlainObject(attempt.json)) {
      notes.push(`JCR fetch HTTP ${attempt.status}: ${url}${attempt.error ? ` (${attempt.error})` : ''}`);
      continue;
    }
    tree = attempt.json;
    fetchedFrom = attempt.url;
    notes.push(`JCR tree loaded from ${url}`);
    break;
  }

  if (!tree) {
    return {
      pagePath: contentPath,
      fetchedFrom: input.pageUrl,
      components: [],
      rawNodeCount: 0,
      notes,
      ok: false,
    };
  }

  // Prefer jcr:content subtree when present
  const root =
    isPlainObject(tree['jcr:content']) ? (tree['jcr:content'] as Record<string, unknown>) : tree;
  const components: JcrComponentNode[] = [];
  walkComponents(root, `${contentPath}/jcr:content`, components, 0);

  // Deduplicate by path
  const seen = new Set<string>();
  const unique = components.filter((c) => {
    if (seen.has(c.path)) return false;
    seen.add(c.path);
    return true;
  });

  const title =
    (typeof root['jcr:title'] === 'string' && root['jcr:title']) ||
    (typeof root['pageTitle'] === 'string' && root['pageTitle']) ||
    undefined;
  const template = typeof root['cq:template'] === 'string' ? root['cq:template'] : undefined;

  notes.push(`Extracted ${unique.length} component node(s) from JCR`);

  return {
    pagePath: contentPath,
    fetchedFrom,
    title,
    template,
    components: unique,
    rawNodeCount: unique.length,
    notes,
    ok: unique.length > 0,
  };
}

/** Components that map to a target EDS block name. */
export function componentsForBlock(
  components: JcrComponentNode[],
  blockName: string,
): JcrComponentNode[] {
  const key = blockName.toLowerCase();
  const matched = components.filter((c) => c.suggestedBlock === key);
  if (matched.length > 0) return matched.slice(0, 8);
  // Fallback: fuzzy match resourceType / name
  return components
    .filter((c) => c.resourceType.toLowerCase().includes(key) || c.name.toLowerCase().includes(key))
    .slice(0, 8);
}

/** Compact JSON for LLM prompts (legacy JCR shape). */
export function formatComponentsForPrompt(components: JcrComponentNode[], maxChars = 6000): string {
  const payload = components.map((c) => {
    const props = { ...c.properties };
    const grid = props['_grid'];
    delete props['_grid'];
    return {
      id: c.name,
      componentType: c.resourceType,
      path: c.path,
      suggestedBlock: c.suggestedBlock,
      properties: props,
      ...(grid ? { grid } : {}),
      childCount: c.children.length,
      children: c.children.slice(0, 4).map((ch) => ({
        id: ch.name,
        componentType: ch.resourceType,
        properties: ch.properties,
      })),
    };
  });
  const json = JSON.stringify(payload, null, 2);
  if (json.length <= maxChars) return json;
  return `${json.slice(0, maxChars)}\n/* …truncated… */`;
}
