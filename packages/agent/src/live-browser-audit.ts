// ============================================================
// @aeds/agent — Live browser audit helper (via ToolRegistry)
// Produces SYSTEM EVIDENCE; never fabricates PASS on failure
// ============================================================

import type { PageAuditResult, ViewportName } from '@aeds/browser';
import type { RunExecutionContext } from './agents/base.js';
import type { SystemEvidence } from '@aeds/shared';
import { executeTool } from './execute-tool.js';
import { buildPreviewPageUrl } from './reference-capture.js';

export interface LiveBrowserAuditResult {
  ok: boolean;
  mode: 'live' | 'skipped' | 'failed';
  audits: PageAuditResult[];
  evidence: SystemEvidence[];
  error?: string;
  /** URL that was actually audited */
  auditUrl?: string;
  /**
   * False when the page is missing / empty / lacks expected blocks —
   * callers should treat a11y as advisory only.
   */
  contentReady?: boolean;
}

function shouldRunLiveBrowser(context: RunExecutionContext): boolean {
  if (process.env.VITEST || process.env.NODE_ENV === 'test') return false;
  if (process.env.ENABLE_LIVE_BROWSER === 'false') return false;
  // Do not audit a speculative aem.live URL before the work branch was actually published
  if (!context.previewPublished && process.env.LIVE_BROWSER_ALLOW_UNPUBLISHED !== 'true') {
    return false;
  }
  if (process.env.ENABLE_LIVE_BROWSER === 'true') {
    return Boolean(context.previewUrl || context.sourceUrl);
  }
  const url = context.previewUrl || context.sourceUrl;
  return Boolean(url && /^https?:\/\//i.test(url));
}

/** Resolve the best Playwright target: path-aware preview page, not just branch root. */
export function resolveLiveAuditUrl(context: RunExecutionContext): string {
  if (context.previewAuditUrl && /^https?:\/\//i.test(context.previewAuditUrl)) {
    return context.previewAuditUrl;
  }
  const origin = context.previewUrl;
  if (origin && /^https?:\/\//i.test(origin)) {
    return buildPreviewPageUrl(origin, context.sourceUrl);
  }
  return (context.sourceUrl || origin || '').trim();
}

/**
 * True when the audited page looks like it carries the run's generated block content.
 * Code-only preview deploys often 404 the source path or serve a boilerplate homepage.
 */
export function isPreviewContentReady(
  audits: PageAuditResult[],
  detectedBlocks?: string[],
): boolean {
  if (audits.length === 0) return false;

  const anyOkStatus = audits.some((a) => !a.statusCode || (a.statusCode >= 200 && a.statusCode < 400));
  if (!anyOkStatus) return false;

  const expected = (detectedBlocks || []).filter(
    (b) => !['header', 'footer', 'page-metadata', 'metadata', 'nav', 'navigation'].includes(b),
  );

  for (const audit of audits) {
    const rawBlocks = audit.domSummary?.detectedBlocks || [];
    const blocks = rawBlocks.map((b) =>
      (typeof b === 'string' ? b : (b as { name?: string }).name || '').toLowerCase(),
    );
    if (expected.length > 0 && expected.some((b) => blocks.includes(b.toLowerCase()))) {
      return true;
    }
    if ((audit.domSummary?.blocksCount || 0) > 0 && blocks.some(Boolean)) {
      return true;
    }
  }

  // 200 OK but no Franklin blocks detected → homepage/shell without authored content
  return false;
}

type AuditToolData = {
  url: string;
  statusCode?: number;
  title?: string;
  loadTimeMs: number;
  a11yViolations: Array<{
    id: string;
    impact?: string;
    description: string;
    helpUrl?: string;
    nodes?: number;
  }>;
  a11yMode?: 'axe' | 'heuristic';
  consoleLogs: Array<{ type: string; text: string }>;
  networkErrors: Array<{ url: string; method?: string; status?: number; errorText?: string }>;
  screenshotBase64?: string;
  domSummary?: PageAuditResult['domSummary'];
  performanceMetrics?: PageAuditResult['performanceMetrics'];
};

function toPageAudit(data: AuditToolData, viewport: ViewportName): PageAuditResult {
  return {
    url: data.url,
    statusCode: data.statusCode ?? 0,
    title: data.title || '',
    loadTimeMs: data.loadTimeMs,
    viewport,
    a11yViolations: (data.a11yViolations || []).map((v) => ({
      id: v.id,
      impact: (v.impact as 'critical' | 'serious' | 'moderate' | 'minor') || 'serious',
      description: v.description,
      helpUrl: v.helpUrl || '',
      nodes: typeof v.nodes === 'number' ? v.nodes : 0,
    })),
    a11yMode: data.a11yMode || 'heuristic',
    consoleLogs: (data.consoleLogs || []).map((l) => ({
      type: (l.type as any) || 'log',
      text: l.text,
      timestamp: new Date().toISOString(),
    })),
    networkErrors: (data.networkErrors || []).map((e) => ({
      url: e.url,
      method: e.method || 'GET',
      status: e.status,
      errorText: e.errorText,
      timestamp: new Date().toISOString(),
    })),
    screenshotBase64: data.screenshotBase64,
    domSummary: data.domSummary || {
      sectionsCount: 0,
      blocksCount: 0,
      detectedBlocks: [],
      hasMain: false,
      hasHeader: false,
      hasFooter: false,
    },
    performanceMetrics: data.performanceMetrics,
  };
}

export async function runLiveBrowserAudit(
  context: RunExecutionContext,
  viewports: ViewportName[] = ['desktop'],
): Promise<LiveBrowserAuditResult> {
  if (!shouldRunLiveBrowser(context)) {
    context.previewContentReady = false;
    return {
      ok: true,
      mode: 'skipped',
      audits: [],
      evidence: [
        {
          id: `ev_browser_${Date.now()}`,
          kind: 'browser',
          status: 'SKIPPED',
          summary:
            context.previewPublished === false
              ? 'Live Playwright SKIPPED — work branch not published for preview yet. Not claimed as PASS.'
              : 'Live Playwright SKIPPED (unit test env, unpublished preview, or ENABLE_LIVE_BROWSER=false). Not claimed as PASS.',
          producedAt: new Date().toISOString(),
          mode: 'unavailable',
        },
      ],
      contentReady: false,
    };
  }

  const url = resolveLiveAuditUrl(context);
  context.previewAuditUrl = url;
  const audits: PageAuditResult[] = [];
  const evidence: SystemEvidence[] = [];

  try {
    for (const vp of viewports) {
      const toolResult = await executeTool(context, 'browser.auditPage', {
        url,
        viewport: vp,
      });

      if (!toolResult.success || !toolResult.data) {
        throw new Error(toolResult.error || `browser.auditPage failed for ${vp}`);
      }

      const audit = toPageAudit(toolResult.data as AuditToolData, vp);
      audits.push(audit);

      if (audit.screenshotBase64) {
        context.browserScreenshots = context.browserScreenshots || {};
        context.browserScreenshots[vp] = audit.screenshotBase64;
      }

      context.liveBrowserAudit = {
        ...(context.liveBrowserAudit || {}),
        [vp]: {
          a11yViolations: audit.a11yViolations.length,
          a11yMode: audit.a11yMode || 'heuristic',
          consoleErrors: audit.consoleLogs.filter((l) => l.type === 'error').length,
          networkErrors: audit.networkErrors.length,
          lcp: audit.performanceMetrics?.lcp,
          loadTimeMs: audit.loadTimeMs,
        },
      };
    }

    const contentReady = isPreviewContentReady(audits, context.detectedBlocks);
    context.previewContentReady = contentReady;

    const consoleErrors = audits.reduce(
      (n, a) => n + a.consoleLogs.filter((l) => l.type === 'error').length,
      0,
    );
    const networkErrors = audits.reduce((n, a) => n + a.networkErrors.length, 0);
    const a11yCount = audits.reduce((n, a) => n + a.a11yViolations.length, 0);
    const a11yMode = audits.some((a) => a.a11yMode === 'axe') ? 'axe' : 'heuristic';
    // Console/network only hard-fail when the authored preview page actually loaded
    const ok = !contentReady || (consoleErrors === 0 && networkErrors === 0);

    evidence.push({
      id: `ev_browser_${Date.now()}`,
      kind: 'browser',
      status: !contentReady ? 'SKIPPED' : ok ? 'PASS' : 'FAIL',
      summary: !contentReady
        ? `Live Playwright advisory only @ ${url} — preview page missing authored block content (console=${consoleErrors} network=${networkErrors} a11y=${a11yCount}). Not gating.`
        : `Live Playwright audit @ ${url} (${viewports.join(', ')}) consoleErrors=${consoleErrors} networkErrors=${networkErrors} a11y=${a11yCount} (${a11yMode})`,
      metrics: { consoleErrors, networkErrors, a11yCount, viewportCount: viewports.length },
      producedAt: new Date().toISOString(),
      mode: 'live',
    });

    return { ok, mode: 'live', audits, evidence, auditUrl: url, contentReady };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    context.previewContentReady = false;
    evidence.push({
      id: `ev_browser_${Date.now()}`,
      kind: 'browser',
      status: 'UNAVAILABLE',
      summary: `Live Playwright failed @ ${url}: ${message}`,
      producedAt: new Date().toISOString(),
      mode: 'unavailable',
    });
    return { ok: false, mode: 'failed', audits, evidence, error: message, auditUrl: url, contentReady: false };
  }
}
