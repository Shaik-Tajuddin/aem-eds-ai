// ============================================================
// @aeds/github — Token Manager
// ============================================================

import { Octokit } from '@octokit/rest';
import { GitHubError, GitHubErrorCode } from './errors.js';
import type { GitHubValidationResult, GitHubUser } from './types.js';

export class GitHubTokenManager {
  private token: string | null;

  constructor(initialToken?: string) {
    if (initialToken !== undefined) {
      this.token = initialToken.trim() || null;
    } else {
      this.token = process.env.GITHUB_TOKEN?.trim() || null;
    }
  }


  public setToken(token: string): void {
    this.token = token.trim();
  }

  public getToken(): string {
    if (!this.token) {
      throw new GitHubError(
        'GitHub authentication token is required but was not provided or configured in environment',
        GitHubErrorCode.UNAUTHORIZED
      );
    }
    return this.token;
  }

  public hasToken(): boolean {
    return Boolean(this.token && this.token.length > 0);
  }

  public getMaskedToken(): string {
    if (!this.token) return 'NONE';
    if (this.token.length <= 8) return '****';
    return `${this.token.slice(0, 4)}...${this.token.slice(-4)}`;
  }

  /**
   * Validates the currently configured token against the GitHub API.
   * Returns authenticated user info and OAuth scopes granted.
   */
  public async validateToken(customToken?: string): Promise<GitHubValidationResult> {
    const tokenToTest = customToken || this.token;
    if (!tokenToTest) {
      return {
        valid: false,
        error: 'No token provided to validate',
      };
    }

    try {
      const octokit = new Octokit({ auth: tokenToTest });
      const response = await octokit.rest.users.getAuthenticated();
      const rawScopes = response.headers['x-oauth-scopes'] || '';
      const scopes = typeof rawScopes === 'string'
        ? rawScopes.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const user: GitHubUser = {
        login: response.data.login,
        id: response.data.id,
        avatarUrl: response.data.avatar_url,
        name: response.data.name || null,
        email: response.data.email || null,
      };

      return {
        valid: true,
        user,
        scopes,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: err?.message || 'Failed to authenticate token with GitHub',
      };
    }
  }

  /**
   * Asserts that the current token has the required OAuth scopes.
   */
  public async assertScopes(requiredScopes: string[]): Promise<void> {
    const validation = await this.validateToken();
    if (!validation.valid || !validation.scopes) {
      throw new GitHubError(
        `Failed to validate GitHub token: ${validation.error || 'Invalid token'}`,
        GitHubErrorCode.UNAUTHORIZED
      );
    }

    const missingScopes = requiredScopes.filter((scope) => !validation.scopes!.includes(scope));
    if (missingScopes.length > 0) {
      throw new GitHubError(
        `GitHub token lacks required scopes: ${missingScopes.join(', ')}`,
        GitHubErrorCode.FORBIDDEN,
        403,
        { missingScopes, currentScopes: validation.scopes }
      );
    }
  }
}
