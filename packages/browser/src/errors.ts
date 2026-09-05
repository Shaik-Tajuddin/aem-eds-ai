// ============================================================
// @aeds/browser — Errors
// ============================================================

export enum BrowserErrorCode {
  BROWSER_LAUNCH_FAILED = 'BROWSER_LAUNCH_FAILED',
  NAVIGATION_TIMEOUT = 'NAVIGATION_TIMEOUT',
  PAGE_CRASHED = 'PAGE_CRASHED',
  SCREENSHOT_FAILED = 'SCREENSHOT_FAILED',
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  AUDIT_FAILED = 'AUDIT_FAILED',
  UNKNOWN = 'UNKNOWN',
}

export class BrowserError extends Error {
  public readonly code: BrowserErrorCode;
  public readonly details?: unknown;

  constructor(message: string, code: BrowserErrorCode = BrowserErrorCode.UNKNOWN, details?: unknown) {
    super(message);
    this.name = 'BrowserError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, BrowserError.prototype);
  }
}
