// ============================================================
// Utility functions for the UI
// ============================================================

/**
 * Format milliseconds into human-readable duration string.
 * e.g. 125000 → "2m 5s"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Format an ISO timestamp as relative time.
 * e.g. "2 min ago", "1h ago"
 */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const ts = new Date(isoString).getTime();
  const diffMs = now - ts;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Format an ISO timestamp as HH:MM
 */
export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Round a number to N decimal places.
 */
export function round(n: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** Run statuses that no longer need fast live polling */
export const TERMINAL_RUN_STATUSES = new Set([
  'WAITING_APPROVAL',
  'DEPLOYED',
  'FAILED',
  'CANCELLED',
  'LIMIT_REACHED',
  'PR_CREATED',
  'COMPLETED',
  'NOT_FOUND',
  'ERROR',
]);

export function isTerminalRunStatus(status?: string | null): boolean {
  if (!status) return false;
  return TERMINAL_RUN_STATUSES.has(status);
}

/** Poll while a pipeline is actively advancing */
export const POLL_ACTIVE_MS = 2500;
/** Slow background refresh when nothing is running */
export const POLL_IDLE_MS = 30000;
