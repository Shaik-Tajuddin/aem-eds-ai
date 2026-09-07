// ============================================================
// Live UE authoring cycle (edit → save → reopen) — evidence only
// Requires ENABLE_LIVE_UE=true and UE_STORAGE_STATE_PATH (Playwright storageState).
// Never invents PASS without chrome evidence.
// ============================================================

import { access } from 'node:fs/promises';
import type { SystemEvidence } from '@aeds/shared';

export interface LiveUeAuthoringResult {
  evidence: SystemEvidence;
  phases: {
    open: 'PASS' | 'FAIL' | 'SKIPPED' | 'UNAVAILABLE';
    edit: 'PASS' | 'FAIL' | 'SKIPPED' | 'UNAVAILABLE';
    save: 'PASS' | 'FAIL' | 'SKIPPED' | 'UNAVAILABLE';
    reopen: 'PASS' | 'FAIL' | 'SKIPPED' | 'UNAVAILABLE';
    reopenContent?: 'PASS' | 'FAIL' | 'SKIPPED' | 'UNAVAILABLE';
  };
  error?: string;
}

function unavailable(
  summary: string,
  phases: LiveUeAuthoringResult['phases'],
  error?: string,
): LiveUeAuthoringResult {
  return {
    evidence: {
      id: `ev_ue_auth_${Date.now()}`,
      kind: 'other',
      status: 'UNAVAILABLE',
      summary,
      producedAt: new Date().toISOString(),
      mode: 'unavailable',
      metrics: { ...phases },
    },
    phases,
    error,
  };
}

/**
 * Attempts a minimal Universal Editor chrome authoring cycle when a Playwright
 * storage state (authenticated session) is available.
 *
 * Without UE_STORAGE_STATE_PATH / UE_EDITOR_URL → UNAVAILABLE (not PASS).
 */
export async function validateLiveUeAuthoringCycle(options?: {
  editorUrl?: string;
  storageStatePath?: string;
  fieldSelector?: string;
  saveSelector?: string;
  chromeSelector?: string;
  loginHints?: string[];
  contentPageUrl?: string;
  authorUrl?: string;
  aemPageId?: string;
}): Promise<LiveUeAuthoringResult> {
  const skippedPhases: LiveUeAuthoringResult['phases'] = {
    open: 'UNAVAILABLE',
    edit: 'UNAVAILABLE',
    save: 'UNAVAILABLE',
    reopen: 'UNAVAILABLE',
  };

  const storageStatePath =
    options?.storageStatePath || process.env.UE_STORAGE_STATE_PATH || '';
  const editorUrl =
    options?.editorUrl ||
    process.env.UE_EDITOR_URL ||
    '';

  const fieldSelector =
    options?.fieldSelector ||
    process.env.UE_FIELD_SELECTOR ||
    '[data-aue-prop], [contenteditable="true"], [data-aue-type="text"]';
  const saveSelector =
    options?.saveSelector ||
    process.env.UE_SAVE_SELECTOR ||
    'button:has-text("Save"), [aria-label*="Save" i], [data-testid*="save" i], button:has-text("Publish")';
  const chromeSelector =
    options?.chromeSelector ||
    process.env.UE_CHROME_SELECTOR ||
    '[class*="universal-editor"], [data-testid*="ue"], coral-shell, .editor-GlobalBar';
  const loginHints =
    options?.loginHints ||
    (process.env.UE_LOGIN_HINTS || 'sign in,adobe id,log in')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

  if (!storageStatePath) {
    return unavailable(
      'UE chrome authoring UNAVAILABLE — set UE_STORAGE_STATE_PATH to a Playwright storageState JSON (SSO session)',
      skippedPhases,
    );
  }

  if (!editorUrl || !/^https?:\/\//i.test(editorUrl)) {
    return unavailable(
      'UE chrome authoring UNAVAILABLE — set UE_EDITOR_URL to the Universal Editor chrome URL',
      skippedPhases,
    );
  }

  try {
    await access(storageStatePath);
  } catch {
    return unavailable(
      `UE chrome authoring UNAVAILABLE — storage state file not found: ${storageStatePath}`,
      skippedPhases,
      `Missing file: ${storageStatePath}`,
    );
  }

  const phases: LiveUeAuthoringResult['phases'] = {
    open: 'FAIL',
    edit: 'SKIPPED',
    save: 'SKIPPED',
    reopen: 'SKIPPED',
  };

  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: process.env.PLAYWRIGHT_HEADLESS !== 'false' });
    const context = await browser.newContext({ storageState: storageStatePath });
    const page = await context.newPage();

    try {
      const response = await page.goto(editorUrl, {
        waitUntil: 'domcontentloaded',
        timeout: Number(process.env.PLAYWRIGHT_TIMEOUT_MS || 45_000),
      });
      const statusCode = response?.status() ?? 0;
      if (statusCode >= 400) {
        phases.open = 'FAIL';
        return {
          evidence: {
            id: `ev_ue_auth_${Date.now()}`,
            kind: 'other',
            status: 'FAIL',
            summary: `UE chrome open FAIL — HTTP ${statusCode} on ${editorUrl}`,
            producedAt: new Date().toISOString(),
            mode: 'live',
            metrics: { ...phases, statusCode },
          },
          phases,
        };
      }

      // Detect UE / AEM authoring chrome markers (tenant-overridable via UE_CHROME_SELECTOR)
      const chrome = await page.evaluate(
        ({ chromeSel, hints }: { chromeSel: string; hints: string[] }) => {
          const doc = (globalThis as any).document as {
            querySelector: (s: string) => unknown;
            querySelectorAll: (s: string) => { length: number };
            body?: { innerText?: string };
          };
          const hasAue =
            doc.querySelectorAll('[data-aue-resource], [data-aue-type], [data-aue-prop]').length > 0;
          let hasUeShell = false;
          try {
            hasUeShell = Boolean(doc.querySelector(chromeSel));
          } catch {
            hasUeShell = Boolean(
              doc.querySelector(
                '[class*="universal-editor"], [data-testid*="ue"], coral-shell, .editor-GlobalBar',
              ),
            );
          }
          const text = (doc.body?.innerText || '').toLowerCase();
          const looksLikeLogin = hints.some((h) => text.includes(h));
          return { hasAue, hasUeShell, looksLikeLogin };
        },
        { chromeSel: chromeSelector, hints: loginHints },
      );

      if (chrome.looksLikeLogin && !chrome.hasAue && !chrome.hasUeShell) {
        phases.open = 'FAIL';
        return {
          evidence: {
            id: `ev_ue_auth_${Date.now()}`,
            kind: 'other',
            status: 'FAIL',
            summary:
              'UE chrome open FAIL — session appears unauthenticated (login page). Refresh UE_STORAGE_STATE_PATH.',
            producedAt: new Date().toISOString(),
            mode: 'live',
            metrics: { ...phases, ...chrome },
          },
          phases,
        };
      }

      phases.open = chrome.hasAue || chrome.hasUeShell ? 'PASS' : 'FAIL';
      if (phases.open !== 'PASS') {
        return {
          evidence: {
            id: `ev_ue_auth_${Date.now()}`,
            kind: 'other',
            status: 'FAIL',
            summary:
              'UE chrome open FAIL — no Universal Editor / data-aue markers after authenticated navigation',
            producedAt: new Date().toISOString(),
            mode: 'live',
            metrics: { ...phases, ...chrome },
          },
          phases,
        };
      }

      // Edit: try tenant-configured or default authorable field selectors
      const field = page.locator(fieldSelector).first();
      const fieldCount = await page.locator(fieldSelector).count();
      if (fieldCount === 0) {
        phases.edit = 'UNAVAILABLE';
        phases.save = 'UNAVAILABLE';
        phases.reopen = 'UNAVAILABLE';
        return {
          evidence: {
            id: `ev_ue_auth_${Date.now()}`,
            kind: 'other',
            status: 'UNAVAILABLE',
            summary: `UE chrome opened but no editable field matched selector (${fieldSelector})`,
            producedAt: new Date().toISOString(),
            mode: 'live',
            metrics: { ...phases, fieldCount, fieldSelector },
          },
          phases,
        };
      }

      const marker = `aeds-ue-${Date.now()}`;
      try {
        await field.click({ timeout: 10_000 });
        await field.fill(marker, { timeout: 10_000 }).catch(async () => {
          await page.keyboard.type(marker, { delay: 10 });
        });
        phases.edit = 'PASS';
      } catch (editErr: unknown) {
        phases.edit = 'FAIL';
        const msg = editErr instanceof Error ? editErr.message : String(editErr);
        return {
          evidence: {
            id: `ev_ue_auth_${Date.now()}`,
            kind: 'other',
            status: 'FAIL',
            summary: `UE edit FAIL — could not type into authorable field: ${msg}`,
            producedAt: new Date().toISOString(),
            mode: 'live',
            metrics: { ...phases },
          },
          phases,
          error: msg,
        };
      }

      // Save: tenant-configured selector first; never invent PASS if control missing
      const saveBtn = page.locator(saveSelector).first();
      if ((await saveBtn.count()) === 0) {
        phases.save = 'UNAVAILABLE';
        phases.reopen = 'SKIPPED';
        return {
          evidence: {
            id: `ev_ue_auth_${Date.now()}`,
            kind: 'other',
            status: 'UNAVAILABLE',
            summary: `UE edit typed but no Save control matched selector (${saveSelector}) — cannot claim save/reopen PASS`,
            producedAt: new Date().toISOString(),
            mode: 'live',
            metrics: { ...phases, marker, saveSelector },
          },
          phases,
        };
      }

      try {
        await saveBtn.click({ timeout: 10_000 });
        await page.waitForTimeout(1500);
        phases.save = 'PASS';
      } catch (saveErr: unknown) {
        phases.save = 'FAIL';
        const msg = saveErr instanceof Error ? saveErr.message : String(saveErr);
        return {
          evidence: {
            id: `ev_ue_auth_${Date.now()}`,
            kind: 'other',
            status: 'FAIL',
            summary: `UE save FAIL — ${msg}`,
            producedAt: new Date().toISOString(),
            mode: 'live',
            metrics: { ...phases },
          },
          phases,
          error: msg,
        };
      }

      // Reopen: reload and look for marker persistence in DOM
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const bodyText = await page.evaluate(() => {
        const doc = (globalThis as any).document as { body?: { innerText?: string } };
        return doc.body?.innerText || '';
      });
      phases.reopen = bodyText.includes(marker) ? 'PASS' : 'FAIL';

      // Richer reopen: MCP/JCR content re-read (optional; never invents PASS)
      let contentSummary = '';
      try {
        const { verifyUeReopenViaContent } = await import('./ue-reopen-content.js');
        const content = await verifyUeReopenViaContent({
          marker,
          pageUrl: options?.contentPageUrl || process.env.UE_CONTENT_PAGE_URL,
          authorUrl: options?.authorUrl || process.env.AEM_AUTHOR_URL,
          aemPageId: options?.aemPageId,
        });
        phases.reopenContent = content.status;
        contentSummary = content.summary;
      } catch (contentErr: unknown) {
        phases.reopenContent = 'UNAVAILABLE';
        contentSummary =
          contentErr instanceof Error ? contentErr.message : String(contentErr);
      }

      const allPass =
        phases.open === 'PASS' &&
        phases.edit === 'PASS' &&
        phases.save === 'PASS' &&
        phases.reopen === 'PASS';

      return {
        evidence: {
          id: `ev_ue_auth_${Date.now()}`,
          kind: 'other',
          status: allPass ? 'PASS' : 'FAIL',
          summary: allPass
            ? `UE chrome authoring PASS — edit→save→reopen retained marker ${marker}${contentSummary ? `; ${contentSummary}` : ''}`
            : `UE chrome authoring FAIL — open=${phases.open} edit=${phases.edit} save=${phases.save} reopen=${phases.reopen} reopenContent=${phases.reopenContent || 'n/a'}${contentSummary ? `; ${contentSummary}` : ''}`,
          producedAt: new Date().toISOString(),
          mode: 'live',
          metrics: { ...phases, marker },
        },
        phases,
      };
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
      await browser.close().catch(() => {});
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return unavailable(`UE chrome authoring UNAVAILABLE — ${message}`, skippedPhases, message);
  }
}
