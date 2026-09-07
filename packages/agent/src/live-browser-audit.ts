// ============================================================
// @aeds/agent — Live browser audit helper (in-process Playwright)
// Produces SYSTEM EVIDENCE; never fabricates PASS on failure
// ============================================================

import { BrowserController, type PageAuditResult, type ViewportName } from '@aeds/browser';
import type { RunExecutionContext } from './agents/base.js';
import type { SystemEvidence } from '@aeds/shared';

export interface LiveBrowserAuditResult {
  ok: boolean;
  mode: 'live' | 'skipped' | 'failed';
  audits: PageAuditResult[];
  evidence: SystemEvidence[];
  error?: string;
}

function shouldRunLiveBrowser(context: RunExecutionContext): boolean {
  if (process.env.VITEST || process.env.NODE_ENV === 'test') return false;
  if (process.env.ENABLE_LIVE_BROWSER === 'false') return false;
  if (process.env.ENABLE_LIVE_BROWSER === 'true') return Boolean(context.previewUrl || context.sourceUrl);
  // Default: run when a concrete http(s) preview/source URL is present outside tests
  const url = context.previewUrl || context.sourceUrl;
  return Boolean(url && /^https?:\/\//i.test(url));
}

export async function runLiveBrowserAudit(
  context: RunExecutionContext,
  viewports: ViewportName[] = ['desktop'],
): Promise<LiveBrowserAuditResult> {
  if (!shouldRunLiveBrowser(context)) {
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
            'Live Playwright SKIPPED (unit test env or no preview URL / ENABLE_LIVE_BROWSER=false). Not claimed as PASS.',
          producedAt: new Date().toISOString(),
          mode: 'unavailable',
        },
      ],
    };
  }

  const url = (context.previewUrl || context.sourceUrl)!;
  const controller = new BrowserController({ headless: process.env.PLAYWRIGHT_HEADLESS !== 'false' });
  const audits: PageAuditResult[] = [];
  const evidence: SystemEvidence[] = [];

  try {
    for (const vp of viewports) {
      const audit = await controller.auditPage(url, vp);
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

    const consoleErrors = audits.reduce(
      (n, a) => n + a.consoleLogs.filter((l) => l.type === 'error').length,
      0,
    );
    const networkErrors = audits.reduce((n, a) => n + a.networkErrors.length, 0);
    const a11yCount = audits.reduce((n, a) => n + a.a11yViolations.length, 0);
    const a11yMode = audits.some((a) => a.a11yMode === 'axe') ? 'axe' : 'heuristic';
    const ok = consoleErrors === 0 && networkErrors === 0;

    evidence.push({
      id: `ev_browser_${Date.now()}`,
      kind: 'browser',
      status: ok ? 'PASS' : 'FAIL',
      summary: `Live Playwright audit (${viewports.join(', ')}) consoleErrors=${consoleErrors} networkErrors=${networkErrors} a11y=${a11yCount} (${a11yMode})`,
      metrics: { consoleErrors, networkErrors, a11yCount, viewportCount: viewports.length },
      producedAt: new Date().toISOString(),
      mode: 'live',
    });

    return { ok, mode: 'live', audits, evidence };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    evidence.push({
      id: `ev_browser_${Date.now()}`,
      kind: 'browser',
      status: 'UNAVAILABLE',
      summary: `Live Playwright failed: ${message}`,
      producedAt: new Date().toISOString(),
      mode: 'unavailable',
    });
    return { ok: false, mode: 'failed', audits, evidence, error: message };
  } finally {
    await controller.close().catch(() => {});
  }
}
