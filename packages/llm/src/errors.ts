// ============================================================
// @aeds/llm — Errors
// ============================================================

export enum LLMErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  MISSING_API_KEY = 'MISSING_API_KEY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONTEXT_LENGTH_EXCEEDED = 'CONTEXT_LENGTH_EXCEEDED',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  UNSUPPORTED_PROVIDER = 'UNSUPPORTED_PROVIDER',
}

export class LLMError extends Error {
  public readonly code: LLMErrorCode;
  public readonly provider: string;
  public readonly status?: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: LLMErrorCode,
    provider: string,
    status?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'LLMError';
    this.code = code;
    this.provider = provider;
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, LLMError.prototype);
  }
}
