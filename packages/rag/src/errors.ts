export enum RagErrorCode {
  INVALID_INPUT = 'RAG_INVALID_INPUT',
  EMBEDDING_FAILED = 'RAG_EMBEDDING_FAILED',
  CHUNKING_FAILED = 'RAG_CHUNKING_FAILED',
  RETRIEVAL_FAILED = 'RAG_RETRIEVAL_FAILED',
  INDEXING_FAILED = 'RAG_INDEXING_FAILED',
  DATABASE_ERROR = 'RAG_DATABASE_ERROR',
}

export class RagError extends Error {
  readonly code: RagErrorCode;
  readonly details?: unknown;

  constructor(code: RagErrorCode, message: string, details?: unknown) {
    super(`[${code}] ${message}`);
    this.name = 'RagError';
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
