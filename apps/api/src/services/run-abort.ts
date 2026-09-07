// ============================================================
// In-process agent run abort registry (API process only)
// ============================================================

const controllers = new Map<string, AbortController>();

export function registerRunAbort(runId: string): AbortSignal {
  abortRun(runId);
  const controller = new AbortController();
  controllers.set(runId, controller);
  return controller.signal;
}

export function abortRun(runId: string): boolean {
  const existing = controllers.get(runId);
  if (!existing) return false;
  if (!existing.signal.aborted) {
    existing.abort();
  }
  controllers.delete(runId);
  return true;
}

export function abortAllRuns(): string[] {
  const ids = Array.from(controllers.keys());
  for (const id of ids) {
    abortRun(id);
  }
  return ids;
}

export function clearRunAbort(runId: string): void {
  controllers.delete(runId);
}

/** Statuses that should not be bulk-paused (already finished or paused). */
export const PAUSE_ALL_SKIP_STATUSES = [
  'WAITING_APPROVAL',
  'DEPLOYED',
  'FAILED',
  'CANCELLED',
  'LIMIT_REACHED',
  'PR_CREATED',
  'COMPLETED',
  'PAUSED',
] as const;
