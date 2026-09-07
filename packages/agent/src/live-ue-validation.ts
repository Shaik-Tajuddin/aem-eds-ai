// ============================================================
// Live Universal Editor instrumentation validation (Playwright)
// Feature-flagged: ENABLE_LIVE_UE=true
// Never claims UE PASS without DOM evidence.
// ============================================================

import type { SystemEvidence } from '@aeds/shared';

export interface LiveUeValidationResult {
  evidence: SystemEvidence;
  editableCount: number;
  attributesFound: string[];
  error?: string;
}

/**
 * Navigates to a preview URL and inspects data-aue-* instrumentation.
 * Does not complete full UE chrome SSO authoring; validates page authorability markers.
 */
export async function validateLiveUeInstrumentation(url: string): Promise<LiveUeValidationResult> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      const statusCode = response?.status() ?? 0;

      const attrs = await page.evaluate(() => {
        // Runs in browser context — typed loosely for Node DTS builds
        const doc = (globalThis as any).document as {
          querySelectorAll: (s: string) => Iterable<{ attributes: Iterable<{ name: string }> }>;
          querySelector: (s: string) => unknown;
        };
        const nodes = Array.from(
          doc.querySelectorAll(
            '[data-aue-resource], [data-aue-type], [data-aue-prop], [data-aue-label]',
          ),
        );
        const found = new Set<string>();
        for (const el of nodes) {
          for (const a of Array.from(el.attributes)) {
            if (a.name.startsWith('data-aue-')) found.add(a.name);
          }
        }
        return {
          editableCount: nodes.length,
          attributes: Array.from(found).sort(),
          hasMain: Boolean(doc.querySelector('main')),
        };
      });

      const passed = attrs.editableCount > 0 && statusCode < 400;
      const evidence: SystemEvidence = {
        id: `ev_ue_${Date.now()}`,
        kind: 'other',
        status: passed ? 'PASS' : 'FAIL',
        summary: passed
          ? `Live UE instrumentation: ${attrs.editableCount} editable node(s); attrs=[${attrs.attributes.join(', ')}]`
          : `Live UE instrumentation FAIL: editable=${attrs.editableCount} HTTP=${statusCode} on ${url}`,
        metrics: {
          editableCount: attrs.editableCount,
          statusCode,
          hasMain: attrs.hasMain,
        },
        producedAt: new Date().toISOString(),
        mode: 'live',
      };

      return {
        evidence,
        editableCount: attrs.editableCount,
        attributesFound: attrs.attributes,
      };
    } finally {
      await page.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      evidence: {
        id: `ev_ue_${Date.now()}`,
        kind: 'other',
        status: 'UNAVAILABLE',
        summary: `Live UE validation unavailable: ${message}`,
        producedAt: new Date().toISOString(),
        mode: 'unavailable',
      },
      editableCount: 0,
      attributesFound: [],
      error: message,
    };
  }
}
