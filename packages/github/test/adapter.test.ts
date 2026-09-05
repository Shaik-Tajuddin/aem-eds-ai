import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubAdapter, GitHubTokenManager, GitHubError, GitHubErrorCode } from '../src/index.js';

describe('GitHub Adapter', () => {
  describe('parseRepoUrl', () => {
    it('parses standard https github url', () => {
      const parsed = GitHubAdapter.parseRepoUrl('https://github.com/adobe/aem-boilerplate');
      expect(parsed).toEqual({ owner: 'adobe', repo: 'aem-boilerplate' });
    });

    it('parses https github url with .git suffix', () => {
      const parsed = GitHubAdapter.parseRepoUrl('https://github.com/adobe/helix-project-boilerplate.git');
      expect(parsed).toEqual({ owner: 'adobe', repo: 'helix-project-boilerplate' });
    });

    it('parses owner/repo slug format', () => {
      const parsed = GitHubAdapter.parseRepoUrl('my-org/my-eds-site');
      expect(parsed).toEqual({ owner: 'my-org', repo: 'my-eds-site' });
    });

    it('throws validation error for invalid format', () => {
      expect(() => GitHubAdapter.parseRepoUrl('invalid-url-without-slash')).toThrow(GitHubError);
      try {
        GitHubAdapter.parseRepoUrl('invalid-string');
      } catch (err: any) {
        expect(err.code).toBe(GitHubErrorCode.VALIDATION_FAILED);
      }
    });
  });

  describe('GitHubTokenManager', () => {
    it('manages token state and masks secret appropriately', () => {
      const manager = new GitHubTokenManager('ghp_abcdef1234567890xyz');
      expect(manager.hasToken()).toBe(true);
      expect(manager.getToken()).toBe('ghp_abcdef1234567890xyz');
      expect(manager.getMaskedToken()).toBe('ghp_...0xyz');
    });

    it('throws UNAUTHORIZED if token requested but none provided', () => {
      const manager = new GitHubTokenManager('');
      expect(manager.hasToken()).toBe(false);
      expect(() => manager.getToken()).toThrow(GitHubError);
    });
  });

  describe('GitHubError', () => {
    it('correctly maps 401 status to UNAUTHORIZED', () => {
      const error = GitHubError.fromError({ status: 401, message: 'Bad credentials' });
      expect(error.code).toBe(GitHubErrorCode.UNAUTHORIZED);
    });

    it('correctly maps 404 status to NOT_FOUND', () => {
      const error = GitHubError.fromError({ status: 404, message: 'Not found' });
      expect(error.code).toBe(GitHubErrorCode.NOT_FOUND);
    });

    it('identifies rate limit exceeded', () => {
      const error = GitHubError.fromError({
        status: 403,
        message: 'API rate limit exceeded',
        response: { headers: { 'x-ratelimit-remaining': '0' } },
      });
      expect(error.code).toBe(GitHubErrorCode.RATE_LIMITED);
    });
  });
});
