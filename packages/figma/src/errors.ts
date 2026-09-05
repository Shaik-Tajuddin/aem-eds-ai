// ============================================================
// @aeds/figma — Error Classes
// ============================================================

export enum FigmaErrorCode {
  AUTHENTICATION_REQUIRED = 'FIGMA_AUTHENTICATION_REQUIRED',
  INVALID_URL = 'FIGMA_INVALID_URL',
  FILE_NOT_FOUND = 'FIGMA_FILE_NOT_FOUND',
  NODE_NOT_FOUND = 'FIGMA_NODE_NOT_FOUND',
  RATE_LIMITED = 'FIGMA_RATE_LIMITED',
  IR_CONVERSION_FAILED = 'FIGMA_IR_CONVERSION_FAILED',
  NETWORK_ERROR = 'FIGMA_NETWORK_ERROR',
}

export class FigmaError extends Error {
  public readonly code: FigmaErrorCode;
  public readonly status?: number;
  public readonly details?: unknown;

  constructor(message: string, code: FigmaErrorCode, status?: number, details?: unknown) {
    super(message);
    this.name = 'FigmaError';
    this.code = code;
    this.status = status;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FigmaError);
    }
  }
}
