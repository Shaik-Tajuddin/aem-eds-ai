// ============================================================
// Canonical autonomous pipeline stages (user-visible order)
// ============================================================

import { RunStatus } from '@aeds/shared';

/**
 * Happy-path stages executed by AgentOrchestrator.
 * UE models are authored before preview publish so live QA sees complete artifacts.
 * PR opens only after quality gate.
 */
export const PIPELINE_STAGE_ORDER: RunStatus[] = [
  RunStatus.ANALYZING,
  RunStatus.PLANNING,
  RunStatus.IMPLEMENTING,
  RunStatus.BUILDING,
  RunStatus.UE_AUTHORING,
  RunStatus.DEPLOYING_PREVIEW,
  RunStatus.FUNCTIONAL_TESTING,
  RunStatus.VISUAL_VALIDATION,
  RunStatus.ACCESSIBILITY,
  RunStatus.PERFORMANCE,
  RunStatus.QUALITY_GATE,
  RunStatus.PR_CREATED,
  RunStatus.WAITING_APPROVAL,
];

export const PIPELINE_STAGE_LABELS: Record<string, string> = {
  [RunStatus.RECEIVED]: 'Received',
  [RunStatus.ANALYZING]: 'Analyze',
  [RunStatus.PLANNING]: 'Plan Architecture',
  [RunStatus.IMPLEMENTING]: 'Build EDS Blocks',
  [RunStatus.BUILDING]: 'CSS + JS Build',
  [RunStatus.DEPLOYING_PREVIEW]: 'Deploy Preview',
  [RunStatus.UE_AUTHORING]: 'Universal Editor Models',
  [RunStatus.FUNCTIONAL_TESTING]: 'Browser Tests',
  [RunStatus.VISUAL_VALIDATION]: 'Visual Validation',
  [RunStatus.ACCESSIBILITY]: 'Accessibility',
  [RunStatus.PERFORMANCE]: 'Performance',
  [RunStatus.DIAGNOSING]: 'Diagnose',
  [RunStatus.FIXING]: 'AI Fix',
  [RunStatus.REGRESSION_TESTING]: 'Re-test',
  [RunStatus.QUALITY_GATE]: 'Quality Gate',
  [RunStatus.PR_CREATED]: 'PR Created',
  [RunStatus.WAITING_APPROVAL]: 'Waiting Approval',
  [RunStatus.DEPLOYED]: 'Deployed',
  [RunStatus.FAILED]: 'Failed',
  [RunStatus.CANCELLED]: 'Cancelled',
  [RunStatus.PAUSED]: 'Paused',
  [RunStatus.LIMIT_REACHED]: 'Limit Reached',
};

export function stageProgressPercent(stage: RunStatus | string, total = PIPELINE_STAGE_ORDER.length): number {
  const idx = PIPELINE_STAGE_ORDER.indexOf(stage as RunStatus);
  if (idx < 0) {
    if (stage === RunStatus.RECEIVED) return 0;
    if (stage === RunStatus.DEPLOYED || stage === 'COMPLETED') return 100;
    return Math.min(99, Math.round((1 / total) * 100));
  }
  return Math.min(100, Math.round(((idx + 1) / total) * 100));
}

export function stagesCompletedThrough(stage: RunStatus | string): string[] {
  const idx = PIPELINE_STAGE_ORDER.indexOf(stage as RunStatus);
  if (idx < 0) return stage === RunStatus.RECEIVED ? [RunStatus.RECEIVED] : [];
  return [RunStatus.RECEIVED, ...PIPELINE_STAGE_ORDER.slice(0, idx + 1)];
}
