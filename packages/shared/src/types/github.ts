// ============================================================
// GitHub Integration Types
// ============================================================

export interface GitHubRepository {
  owner: string;
  repo: string;
  fullName: string; // owner/repo
  defaultBranch: string;
  cloneUrl: string;
  isPrivate: boolean;
}

export interface GitHubBranch {
  name: string;
  sha: string;
  protected: boolean;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
  files: string[];
}

export interface GitHubPullRequest {
  id: string;
  number: number;
  title: string;
  body: string;
  url: string;
  headBranch: string;
  baseBranch: string;
  status: 'open' | 'merged' | 'closed';
  createdAt: string;
  mergedAt?: string;
  labels: string[];
}

export interface GitHubFileChange {
  path: string;
  operation: 'create' | 'modify' | 'delete';
  content?: string;
  encoding?: 'utf-8' | 'base64';
}
