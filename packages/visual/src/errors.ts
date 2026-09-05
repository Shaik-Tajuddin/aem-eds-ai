// ============================================================
// @aeds/visual — Errors
// ============================================================

export enum VisualErrorCode {
  INVALID_IMAGE_DATA = 'INVALID_IMAGE_DATA',
  IMAGE_DECODE_FAILED = 'IMAGE_DECODE_FAILED',
  DIMENSION_MISMATCH = 'DIMENSION_MISMATCH',
  COMPARISON_FAILED = 'COMPARISON_FAILED',
  UNKNOWN = 'UNKNOWN',
}

export class VisualError extends Error {
  public readonly code: VisualErrorCode;
  public readonly details?: unknown;

  constructor(message: string, code: VisualErrorCode = VisualErrorCode.UNKNOWN, details?: unknown) {
    super(message);
    this.name = 'VisualError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, VisualError.prototype);
  }
}
