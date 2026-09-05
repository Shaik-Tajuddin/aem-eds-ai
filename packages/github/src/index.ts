// ============================================================
// @aeds/github — GitHub Adapter
// Real Octokit + simple-git integration for:
//   - Repository validation & metadata
//   - Branch creation & management
//   - File reads and commits
//   - Pull request creation with evidence
//   - Workflow status polling
// ============================================================

export { GitHubAdapter } from './adapter.js';
export { GitHubTokenManager } from './token-manager.js';
export type {
  GitHubRepoInfo,
  GitHubBranchInfo,
  GitHubFileContent,
  GitHubCommitResult,
  GitHubPRResult,
  GitHubPROptions,
  GitHubWorkflowRun,
  GitHubUser,
  GitHubValidationResult,
  GitHubAdapterConfig,
} from './types.js';
export { GitHubError, GitHubErrorCode } from './errors.js';
