// ============================================================
// @aeds/aem — Error Classes
// ============================================================

export enum AemErrorCode {
  AUTHENTICATION_REQUIRED = 'AEM_AUTHENTICATION_REQUIRED',
  NETWORK_ERROR = 'AEM_NETWORK_ERROR',
  PREVIEW_FAILED = 'AEM_PREVIEW_FAILED',
  PUBLISH_FAILED = 'AEM_PUBLISH_FAILED',
  INVALID_COMPONENT_MODEL = 'AEM_INVALID_COMPONENT_MODEL',
  INSTRUMENTATION_MISSING = 'AEM_INSTRUMENTATION_MISSING',
  AUTHORING_TEST_FAILED = 'AEM_AUTHORING_TEST_FAILED',
  CONTENT_FRAGMENT_NOT_FOUND = 'AEM_CONTENT_FRAGMENT_NOT_FOUND',
  JCR_QUERY_FAILED = 'AEM_JCR_QUERY_FAILED',
}

export class AemError extends Error {
  public readonly code: AemErrorCode;
  public readonly status?: number;
  public readonly details?: unknown;

  constructor(message: string, code: AemErrorCode, status?: number, details?: unknown) {
    super(message);
    this.name = 'AemError';
    this.code = code;
    this.status = status;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AemError);
    }
  }
}
