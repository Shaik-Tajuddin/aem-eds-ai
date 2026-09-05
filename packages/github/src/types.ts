// ============================================================
// @aeds/github — Types
// ============================================================

import type { GitHubRepository, GitHubBranch, GitHubPullRequest, GitHubFileChange } from '@aeds/shared';

export interface GitHubAdapterConfig {
  auth?: string; // Personal Access Token or GitHub App Token
  userAgent?: string;
  baseUrl?: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatarUrl: string;
  name: string | null;
  email: string | null;
}

export interface GitHubRepoInfo extends GitHubRepository {
  description: string | null;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  hasHelixConfig: boolean;
  hasFstab: boolean;
  hasScripts: boolean;
  isEdsProject: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubBranchInfo extends GitHubBranch {
  commitMessage?: string;
  commitAuthor?: string;
  commitDate?: string;
}

export interface GitHubFileContent {
  path: string;
  sha: string;
  size: number;
  content: string; // decoded utf-8 content or raw base64
  encoding: 'utf-8' | 'base64';
}

export interface GitHubCommitResult {
  sha: string;
  message: string;
  treeSha: string;
  parentShas: string[];
  url: string;
}

export interface GitHubPROptions {
  owner: string;
  repo: string;
  title: string;
  headBranch: string;
  baseBranch?: string;
  body: string;
  draft?: boolean;
  labels?: string[];
  reviewers?: string[];
  // Specific EDS metadata
  edsPreviewUrl?: string;
  lighthouseScore?: number;
  visualRegressionPassed?: boolean;
}

export interface GitHubPRResult extends GitHubPullRequest {
  diffUrl: string;
  patchUrl: string;
  mergeable?: boolean;
  mergeableState?: string;
}

export interface GitHubWorkflowRun {
  id: number;
  name: string;
  headBranch: string;
  headSha: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'requested';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required' | 'skipped' | null;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubValidationResult {
  valid: boolean;
  user?: GitHubUser;
  scopes?: string[];
  error?: string;
}

export type { GitHubFileChange };
