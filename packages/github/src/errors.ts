// ============================================================
// @aeds/github — Errors
// ============================================================

export enum GitHubErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  REPO_NOT_FOUND = 'REPO_NOT_FOUND',
  BRANCH_NOT_FOUND = 'BRANCH_NOT_FOUND',
  BRANCH_ALREADY_EXISTS = 'BRANCH_ALREADY_EXISTS',
  RATE_LIMITED = 'RATE_LIMITED',
  CONFLICT = 'CONFLICT',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class GitHubError extends Error {
  public readonly code: GitHubErrorCode;
  public readonly status?: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: GitHubErrorCode = GitHubErrorCode.UNKNOWN_ERROR,
    status?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'GitHubError';
    this.code = code;
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, GitHubError.prototype);
  }

  static fromError(err: any): GitHubError {
    if (err instanceof GitHubError) {
      return err;
    }

    const status = err?.status || err?.response?.status;
    const message = err?.message || 'Unknown GitHub API error';

    if (status === 401) {
      return new GitHubError('Invalid or expired GitHub token', GitHubErrorCode.UNAUTHORIZED, status, err);
    }
    if (status === 403) {
      const isRateLimit = err?.response?.headers?.['x-ratelimit-remaining'] === '0';
      return new GitHubError(
        isRateLimit ? 'GitHub API rate limit exceeded' : 'Permission denied for this GitHub resource',
        isRateLimit ? GitHubErrorCode.RATE_LIMITED : GitHubErrorCode.FORBIDDEN,
        status,
        err
      );
    }
    if (status === 404) {
      return new GitHubError('GitHub resource not found', GitHubErrorCode.NOT_FOUND, status, err);
    }
    if (status === 409) {
      return new GitHubError('GitHub conflict (e.g. branch already exists or merge conflict)', GitHubErrorCode.CONFLICT, status, err);
    }
    if (status === 422) {
      return new GitHubError('GitHub validation failed: ' + message, GitHubErrorCode.VALIDATION_FAILED, status, err);
    }

    return new GitHubError(message, GitHubErrorCode.UNKNOWN_ERROR, status, err);
  }
}
