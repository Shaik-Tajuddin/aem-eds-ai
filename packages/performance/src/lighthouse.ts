import type { PerformanceAuditResult } from './types.js';

export interface LighthouseRunOptions {
  url: string;
  chromePath?: string;
  formFactor?: 'mobile' | 'desktop';
}

/**
 * Attempts a live Lighthouse run via dynamic import.
 * Never fabricates scores — returns mode=unavailable when lighthouse/chrome are not installed.
 */
export async function runLighthouseAudit(options: LighthouseRunOptions): Promise<PerformanceAuditResult> {
  if (process.env.ENABLE_LIGHTHOUSE !== 'true') {
    return {
      mode: 'unavailable',
      passed: false,
      summary: 'Lighthouse disabled (set ENABLE_LIGHTHOUSE=true to enable live audits)',
      metrics: {},
      actionable: ['Enable ENABLE_LIGHTHOUSE=true and install the lighthouse package + Chrome'],
    };
  }

  try {
    // Dynamic import so the platform boots without lighthouse installed
    const lighthouseMod = await import('lighthouse').catch(() => null);
    const chromeLauncher = await import('chrome-launcher').catch(() => null);

    if (!lighthouseMod || !chromeLauncher) {
      return {
        mode: 'unavailable',
        passed: false,
        summary: 'Lighthouse unavailable: lighthouse/chrome-launcher packages not installed',
        metrics: {},
        actionable: [
          'npm install lighthouse chrome-launcher --workspace=@aeds/performance',
          'Ensure Chrome/Chromium is available on PATH',
        ],
      };
    }

    const lighthouse = (lighthouseMod as any).default || lighthouseMod;
    const launch = (chromeLauncher as any).launch || (chromeLauncher as any).default?.launch;
    if (typeof lighthouse !== 'function' || typeof launch !== 'function') {
      return {
        mode: 'unavailable',
        passed: false,
        summary: 'Lighthouse unavailable: unexpected module shape',
        metrics: {},
        actionable: ['Pin compatible lighthouse + chrome-launcher versions'],
      };
    }

    const chrome = await launch({
      chromePath: options.chromePath,
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
    });

    try {
      const result = await lighthouse(options.url, {
        port: chrome.port,
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: options.formFactor || 'mobile',
      });

      const categories = result?.lhr?.categories || {};
      const perf = Math.round((categories.performance?.score ?? 0) * 100);
      const a11y = Math.round((categories.accessibility?.score ?? 0) * 100);
      const bp = Math.round((categories['best-practices']?.score ?? 0) * 100);
      const seo = Math.round((categories.seo?.score ?? 0) * 100);
      const audits = result?.lhr?.audits || {};
      const lcpMs = Number(audits['largest-contentful-paint']?.numericValue || 0);
      const minScore = Number(process.env.QG_PERFORMANCE_THRESHOLD || 90);
      const passed = perf >= minScore;

      return {
        mode: 'lighthouse',
        passed,
        summary: `Lighthouse performance=${perf} a11y=${a11y} best-practices=${bp} seo=${seo} LCP=${Math.round(lcpMs)}ms`,
        metrics: { performance: perf, accessibility: a11y, bestPractices: bp, seo, lcpMs },
        actionable: passed
          ? []
          : [
              `Improve Lighthouse performance score from ${perf} to ≥ ${minScore}`,
              lcpMs > 2500 ? `Reduce LCP from ${Math.round(lcpMs)}ms to ≤ 2500ms` : '',
            ].filter(Boolean),
      };
    } finally {
      await chrome.kill().catch(() => {});
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      mode: 'unavailable',
      passed: false,
      summary: `Lighthouse failed: ${message}`,
      metrics: {},
      actionable: ['Fix Chrome/Lighthouse installation or disable ENABLE_LIGHTHOUSE'],
    };
  }
}
