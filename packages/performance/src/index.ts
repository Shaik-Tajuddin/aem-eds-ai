export type { PerformanceBudget, PerformanceAuditResult } from './types.js';

import type { PerformanceBudget, PerformanceAuditResult } from './types.js';

const DEFAULT_BUDGET: Required<PerformanceBudget> = {
  maxJsBytes: 150_000,
  maxCssBytes: 80_000,
  maxLcpMs: 2500,
  minScore: 90,
};

/**
 * Static performance budget check against generated assets.
 * Does not claim Lighthouse PASS — mode is always static-budget unless a live runner is used.
 */
export function auditAssetBudgets(
  assets: Array<{ path: string; content: string }>,
  budget: PerformanceBudget = {},
): PerformanceAuditResult {
  const b = { ...DEFAULT_BUDGET, ...budget };
  const jsBytes = assets
    .filter((a) => a.path.endsWith('.js'))
    .reduce((sum, a) => sum + Buffer.byteLength(a.content, 'utf8'), 0);
  const cssBytes = assets
    .filter((a) => a.path.endsWith('.css'))
    .reduce((sum, a) => sum + Buffer.byteLength(a.content, 'utf8'), 0);

  const actionable: string[] = [];
  if (jsBytes > b.maxJsBytes) {
    actionable.push(`Reduce JS from ${jsBytes} bytes to ≤ ${b.maxJsBytes} (prefer CSS over JS).`);
  }
  if (cssBytes > b.maxCssBytes) {
    actionable.push(`Reduce CSS from ${cssBytes} bytes to ≤ ${b.maxCssBytes}.`);
  }

  const score =
    100 -
    (jsBytes > b.maxJsBytes ? 20 : 0) -
    (cssBytes > b.maxCssBytes ? 15 : 0);

  return {
    mode: 'static-budget',
    passed: actionable.length === 0 && score >= b.minScore,
    summary:
      actionable.length === 0
        ? `Static asset budgets passed (JS ${jsBytes}B, CSS ${cssBytes}B)`
        : `Static asset budgets failed: ${actionable.join(' ')}`,
    metrics: { jsBytes, cssBytes, score },
    actionable,
  };
}

export function lighthouseUnavailable(reason: string): PerformanceAuditResult {
  return {
    mode: 'unavailable',
    passed: false,
    summary: `Lighthouse unavailable: ${reason}`,
    metrics: {},
    actionable: ['Configure lighthouse + Chrome and set ENABLE_LIGHTHOUSE=true'],
  };
}

export { runLighthouseAudit } from './lighthouse.js';
export type { LighthouseRunOptions } from './lighthouse.js';
