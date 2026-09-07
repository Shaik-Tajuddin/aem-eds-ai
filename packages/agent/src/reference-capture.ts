// ============================================================
// @aeds/agent — Reference page capture
// Fetches source URL HTML/CSS/JS signals for resemblance generation
// ============================================================

import { resolveAemAccessToken, exportPageJcrComponents, exportPageMcpComponents, type JcrPageExport } from '@aeds/aem';

export interface ReferenceSnapshot {
  sourceUrl: string;
  fetchedAt: string;
  finalUrl: string;
  title: string;
  htmlExcerpt: string;
  cssExcerpt: string;
  jsExcerpt: string;
  detectedBlocks: string[];
  /** Structured AEM components from MCP and/or JCR (preferred LLM source of truth) */
  jcr?: JcrPageExport;
  /** Which structured source won: mcp | jcr */
  contentSource?: 'mcp' | 'jcr' | 'html';
  notes: string[];
  ok: boolean;
}

export interface ReferenceCaptureOptions {
  /** Optional Adobe/AEM bearer token for author hosts */
  bearerToken?: string;
  /** AEM author base URL (for MCP + JCR) */
  authorUrl?: string;
  /** Optional MCP pageId when already known */
  aemPageId?: string;
  repoOwner?: string;
  repoName?: string;
  /** Branch used for aem.live candidate (defaults to main) */
  workBranch?: string;
}

const MAX_HTML = 60_000;
const MAX_CSS = 40_000;
const MAX_JS = 20_000;

function truncate(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max)}\n/* …truncated… */`;
}

function stripNoise(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (m) => m) // keep styles separately
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m?.[1]?.replace(/\s+/g, ' ').trim() || '';
}

function extractInlineStyles(html: string): string {
  const chunks: string[] = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    if (match[1]) chunks.push(match[1].trim());
  }
  return chunks.join('\n\n');
}

function extractInlineScripts(html: string): string {
  const chunks: string[] = [];
  const re = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const body = match[1]?.trim();
    if (body && body.length > 20) chunks.push(body);
  }
  return chunks.join('\n\n');
}

function extractStylesheetHrefs(html: string, baseUrl: string): string[] {
  const hrefs: string[] = [];
  const re = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const tag = match[0];
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) {
      try {
        hrefs.push(new URL(href, baseUrl).toString());
      } catch {
        // ignore bad URLs
      }
    }
  }
  return hrefs.slice(0, 8);
}

function extractScriptSrcs(html: string, baseUrl: string): string[] {
  const srcs: string[] = [];
  const re = /<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const src = match[1];
    if (!src) continue;
    try {
      srcs.push(new URL(src, baseUrl).toString());
    } catch {
      // ignore
    }
  }
  return srcs.slice(0, 6);
}

function detectBlocksFromHtml(html: string): string[] {
  const found = new Set<string>();
  const known = [
    'hero',
    'cards',
    'columns',
    'teaser',
    'banner',
    'quote',
    'accordion',
    'tabs',
    'carousel',
    'embed',
    'fragment',
  ];

  const classRe = /class=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = classRe.exec(html)) !== null) {
    const classes = match[1].toLowerCase().split(/\s+/);
    for (const cls of classes) {
      if (known.includes(cls)) found.add(cls);
      if (cls === 'card') found.add('cards');
      if (cls === 'column') found.add('columns');
    }
  }

  const dataRe = /data-(?:block-name|aue-model)=["']([a-z0-9-]+)["']/gi;
  while ((match = dataRe.exec(html)) !== null) {
    const name = match[1]?.toLowerCase();
    // Skip chrome / metadata models — not convert-to-EDS UI blocks
    if (
      name &&
      !['section', 'page', 'page-metadata', 'metadata', 'header', 'footer', 'nav', 'navigation'].includes(
        name,
      )
    ) {
      found.add(name);
    }
  }

  return Array.from(found);
}

function looksLikeLoginWall(title: string, finalUrl: string, html: string): boolean {
  return (
    /sign\s*in|login|ims-na1|adobeid/i.test(title) ||
    /ims-na1\.adobelogin\.com/i.test(finalUrl) ||
    /adobeid-na1|adobelogin\.com|Sign In/i.test(html.slice(0, 4000))
  );
}

/** Map /content/<site>/foo/bar.html → /foo/bar for aem.live */
function contentPathToLivePath(pathname: string): string | null {
  const m = pathname.match(/^\/content\/[^/]+(\/.+?)(?:\.html)?\/?$/i);
  if (!m?.[1]) return null;
  return m[1].replace(/\/$/, '') || '/';
}

/**
 * Build alternate public URLs when an Adobe author URL is auth-walled.
 * Publish / .plain.html variants are listed first (preferred for EDS conversion).
 */
export function buildReferenceFallbackUrls(
  sourceUrl: string,
  options: ReferenceCaptureOptions = {},
): string[] {
  const out: string[] = [];
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    return out;
  }

  const host = parsed.hostname.toLowerCase();
  const authorMatch = host.match(/^author-(p\d+-e\d+)\.adobeaemcloud\.com$/i);
  if (authorMatch) {
    const envId = authorMatch[1];
    // Prefer .plain.html (content without chrome) then full publish HTML
    if (parsed.pathname.endsWith('.html') && !parsed.pathname.endsWith('.plain.html')) {
      out.push(
        `https://publish-${envId}.adobeaemcloud.com${parsed.pathname.replace(/\.html$/i, '.plain.html')}${parsed.search}`,
      );
    }
    out.push(`https://publish-${envId}.adobeaemcloud.com${parsed.pathname}${parsed.search}`);
  }

  const livePath = contentPathToLivePath(parsed.pathname);
  const owner = options.repoOwner?.trim();
  const repo = options.repoName?.trim();
  if (livePath && owner && repo) {
    const branches = Array.from(
      new Set(
        [options.workBranch, 'main', 'dev', 'master']
          .map((b) => (b || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-'))
          .filter(Boolean),
      ),
    );
    for (const branch of branches) {
      out.push(`https://${branch}--${repo}--${owner}.aem.live${livePath}`);
      out.push(`https://${branch}--${repo}--${owner}.hlx.page${livePath}`);
    }
  }

  // Dedupe while preserving order; never re-include the original
  const seen = new Set<string>([sourceUrl]);
  return out.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

/** True when URL points at AEM Cloud author. */
export function isAemAuthorUrl(url: string): boolean {
  try {
    return /^author-p\d+-e\d+\.adobeaemcloud\.com$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Join author host + JCR path into a page URL (destination authoring page). */
export function buildAuthoringPageUrl(authorUrl?: string | null, authoringPath?: string | null): string | null {
  const host = (authorUrl || '').trim().replace(/\/$/, '');
  let path = (authoringPath || '').trim();
  if (!host || !path) return null;
  if (!path.startsWith('/')) path = `/${path}`;
  if (!/\.html?$/i.test(path)) path = `${path}.html`;
  try {
    return new URL(path, `${host}/`).toString();
  } catch {
    return `${host}${path}`;
  }
}

function normalizeUrlKey(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    let path = u.pathname.replace(/\/$/, '');
    path = path.replace(/\.plain\.html$/i, '.html');
    u.pathname = path;
    return u.toString().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/**
 * Pick the URL that should be used as the *reference* page for capture/LLM.
 * Never prefer the AEM authoring destination over a stored project source URL.
 */
export function resolveReferenceSourceUrl(input: {
  requestedUrl?: string | null;
  projectSourceUrl?: string | null;
  authorUrl?: string | null;
  authoringPath?: string | null;
}): { url: string; reason: string } | null {
  const requested = (input.requestedUrl || '').trim();
  const projectSource = (input.projectSourceUrl || '').trim();
  const authoringPage = buildAuthoringPageUrl(input.authorUrl, input.authoringPath);

  const isAuthoringDestination = (url: string) => {
    if (!url) return false;
    if (authoringPage && normalizeUrlKey(url) === normalizeUrlKey(authoringPage)) return true;
    if (isAemAuthorUrl(url) && authoringPage) {
      try {
        const a = new URL(url);
        const b = new URL(authoringPage);
        return normalizeUrlKey(a.pathname) === normalizeUrlKey(b.pathname);
      } catch {
        return false;
      }
    }
    return false;
  };

  const projectIsGoodRef = Boolean(projectSource && !isAuthoringDestination(projectSource));
  const requestedIsDestination = Boolean(requested && isAuthoringDestination(requested));
  const requestedIsAuthor = Boolean(requested && isAemAuthorUrl(requested));

  // Project has a real reference, but the run passed the authoring page (or any author URL
  // while project source is public) → use project Source URL.
  if (
    projectIsGoodRef &&
    (!requested || requestedIsDestination || (requestedIsAuthor && !isAemAuthorUrl(projectSource)))
  ) {
    return {
      url: projectSource,
      reason: 'Using project Source URL (reference), not AEM authoring destination',
    };
  }

  if (requested && !requestedIsDestination) {
    return { url: requested, reason: 'Using run Source URL as reference' };
  }

  if (projectSource) {
    return { url: projectSource, reason: 'Falling back to project Source URL' };
  }

  if (requested) {
    return {
      url: requested,
      reason: 'No separate project reference found — using requested URL (may be author)',
    };
  }

  return null;
}

/**
 * Ordered fetch candidates: public publish first, author last.
 */
export function buildReferenceFetchCandidates(
  sourceUrl: string,
  options: ReferenceCaptureOptions = {},
): string[] {
  const fallbacks = buildReferenceFallbackUrls(sourceUrl, options);
  if (isAemAuthorUrl(sourceUrl)) {
    // Do not hit author first — it is the destination, not the preferred reference
    return [...fallbacks, sourceUrl];
  }
  return [sourceUrl, ...fallbacks];
}

function authHeaders(bearerToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'AI-EDS-Developer/0.1 (reference-capture)',
    Accept: 'text/html,text/css,application/javascript,*/*',
  };
  if (bearerToken?.trim()) {
    headers.Authorization = `Bearer ${bearerToken.trim()}`;
  }
  return headers;
}

async function fetchText(
  url: string,
  timeoutMs = 20000,
  bearerToken?: string,
): Promise<{ ok: boolean; url: string; text: string; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: authHeaders(bearerToken),
    });
    const text = await res.text();
    return { ok: res.ok, url: res.url || url, text, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, url, text: message, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function resolveBearerToken(explicit?: string): Promise<{
  token?: string;
  source?: string;
  error?: string;
}> {
  if (explicit?.trim()) {
    return { token: explicit.trim(), source: 'explicit' };
  }
  const fromEnv = process.env['AEM_BEARER_TOKEN']?.trim();
  if (fromEnv) {
    return { token: fromEnv, source: 'AEM_BEARER_TOKEN' };
  }
  try {
    const ims = await resolveAemAccessToken();
    if (ims?.accessToken) {
      return { token: ims.accessToken, source: ims.source };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
  return {};
}

/**
 * Captures HTML/CSS/JS excerpts from a reference URL so implement agents
 * can generate resembling EDS block files.
 */
export async function captureReferencePage(
  sourceUrl: string,
  options: ReferenceCaptureOptions = {},
): Promise<ReferenceSnapshot> {
  const notes: string[] = [];
  const fetchedAt = new Date().toISOString();
  const auth = await resolveBearerToken(options.bearerToken);
  const bearerToken = auth.token;

  if (!sourceUrl || !/^https?:\/\//i.test(sourceUrl)) {
    return {
      sourceUrl,
      fetchedAt,
      finalUrl: sourceUrl,
      title: '',
      htmlExcerpt: '',
      cssExcerpt: '',
      jsExcerpt: '',
      detectedBlocks: [],
      notes: ['No valid http(s) sourceUrl provided'],
      ok: false,
    };
  }

  const isAuthorHost = /author-p\d+-e\d+\.adobeaemcloud\.com/i.test(sourceUrl);
  if (auth.error) {
    notes.push(`AEM IMS token exchange failed: ${auth.error}`);
  } else if (bearerToken && auth.source) {
    notes.push(`Authenticated reference fetch using ${auth.source}`);
  } else if (isAuthorHost && !bearerToken) {
    notes.push(
      'Adobe author URL detected without usable AEM credentials — trying public publish / aem.live fallbacks.',
    );
  }

  const candidates = buildReferenceFetchCandidates(sourceUrl, options);
  let page: Awaited<ReturnType<typeof fetchText>> | null = null;
  let usedUrl = sourceUrl;

  for (const candidate of candidates) {
    // Only send bearer to Adobe Cloud hosts (avoid leaking token to aem.live)
    const useToken =
      bearerToken && /adobeaemcloud\.com$/i.test(new URL(candidate).hostname)
        ? bearerToken
        : undefined;
    const attempt = await fetchText(candidate, 20000, useToken);
    if (!attempt.ok) {
      notes.push(`Fetch failed HTTP ${attempt.status}: ${candidate}`);
      continue;
    }
    if (looksLikeLoginWall(extractTitle(attempt.text), attempt.url, attempt.text)) {
      notes.push(`Login wall at ${candidate} — skipping`);
      continue;
    }
    page = attempt;
    usedUrl = candidate;
    if (candidate !== sourceUrl) {
      notes.push(
        isAemAuthorUrl(sourceUrl)
          ? `Preferred public reference over author URL: ${candidate}`
          : `Using public fallback instead of author URL: ${candidate}`,
      );
    }
    break;
  }

  if (!page) {
    notes.push(
      'Could not capture reference HTML. Use a public preview/live URL (e.g. https://main--repo--owner.aem.live/...), or set AEM_BEARER_TOKEN for author access.',
    );
    return {
      sourceUrl,
      fetchedAt,
      finalUrl: usedUrl,
      title: '',
      htmlExcerpt: '',
      cssExcerpt: '',
      jsExcerpt: '',
      detectedBlocks: [],
      notes,
      ok: false,
    };
  }

  const html = page.text;
  const title = extractTitle(html);

  let css = extractInlineStyles(html);
  const stylesheetHrefs = extractStylesheetHrefs(html, page.url);
  for (const href of stylesheetHrefs) {
    const cssToken =
      bearerToken && /adobeaemcloud\.com$/i.test(new URL(href).hostname) ? bearerToken : undefined;
    const cssRes = await fetchText(href, 12000, cssToken);
    if (cssRes.ok && cssRes.text) {
      css += `\n\n/* from ${href} */\n${cssRes.text}`;
    } else {
      notes.push(`Stylesheet fetch failed: ${href}`);
    }
  }

  let js = extractInlineScripts(html);
  const scriptSrcs = extractScriptSrcs(html, page.url).filter(
    (u) => /blocks\/|scripts\/|decorate/i.test(u),
  );
  for (const src of scriptSrcs.slice(0, 4)) {
    const jsToken =
      bearerToken && /adobeaemcloud\.com$/i.test(new URL(src).hostname) ? bearerToken : undefined;
    const jsRes = await fetchText(src, 12000, jsToken);
    if (jsRes.ok && jsRes.text) {
      js += `\n\n/* from ${src} */\n${jsRes.text}`;
    }
  }

  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const mainHtml = bodyMatch?.[1] || html;
  const cleaned = stripNoise(mainHtml).replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  let detectedBlocks = detectBlocksFromHtml(html);

  // Prefer Adobe Content MCP page structure, then JCR .infinity.json
  let jcr: JcrPageExport | undefined;
  let contentSource: ReferenceSnapshot['contentSource'] = 'html';

  const structuredPageUrl = sourceUrl; // prefer original reference (author path) for MCP/JCR
  const authorUrl =
    options.authorUrl?.trim() ||
    process.env.AEM_AUTHOR_URL?.trim() ||
    undefined;

  try {
    const mcpExport = await exportPageMcpComponents({
      pageUrl: structuredPageUrl,
      authorUrl,
      pageId: options.aemPageId,
      accessToken: process.env.AEM_MCP_ACCESS_TOKEN || bearerToken,
    });
    for (const n of mcpExport.notes) notes.push(n);
    if (mcpExport.ok) {
      jcr = mcpExport;
      contentSource = 'mcp';
      const fromMcp = Array.from(
        new Set(
          mcpExport.components
            .map((c) => c.suggestedBlock)
            .filter((b) => !['header', 'footer', 'page-metadata', 'metadata', 'nav'].includes(b)),
        ),
      );
      if (fromMcp.length > 0) {
        detectedBlocks = fromMcp;
        notes.push(`Block candidates from MCP components: ${fromMcp.join(', ')}`);
      }
    }
  } catch (err: unknown) {
    notes.push(`MCP export skipped: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!jcr?.ok) {
    try {
      const jcrExport = await exportPageJcrComponents({
        pageUrl: structuredPageUrl || usedUrl,
        authorUrl,
        bearerToken,
      });
      for (const n of jcrExport.notes) notes.push(n);
      if (jcrExport.ok) {
        jcr = jcrExport;
        contentSource = 'jcr';
        const fromJcr = Array.from(
          new Set(
            jcrExport.components
              .map((c) => c.suggestedBlock)
              .filter((b) => !['header', 'footer', 'page-metadata', 'metadata', 'nav'].includes(b)),
          ),
        );
        if (fromJcr.length > 0) {
          detectedBlocks = fromJcr;
          notes.push(`Block candidates from JCR components: ${fromJcr.join(', ')}`);
        }
      }
    } catch (err: unknown) {
      notes.push(`JCR export skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (detectedBlocks.length === 0) {
    notes.push('No Franklin-like block class names detected; defaulting later to hero/columns/cards.');
  } else if (!jcr?.ok) {
    notes.push(`Detected block candidates: ${detectedBlocks.join(', ')}`);
  }

  return {
    sourceUrl,
    fetchedAt,
    finalUrl: page.url,
    title: jcr?.title || title,
    htmlExcerpt: truncate(cleaned, MAX_HTML),
    cssExcerpt: truncate(css, MAX_CSS),
    jsExcerpt: truncate(js, MAX_JS),
    detectedBlocks,
    jcr,
    contentSource,
    notes,
    ok: true,
  };
}
