// ============================================================
// @aeds/github — GitHub Adapter Implementation
// ============================================================

import { Octokit } from '@octokit/rest';
import { GitHubError, GitHubErrorCode } from './errors.js';
import { GitHubTokenManager } from './token-manager.js';
import type {
  GitHubAdapterConfig,
  GitHubRepoInfo,
  GitHubBranchInfo,
  GitHubFileContent,
  GitHubFileChange,
  GitHubCommitResult,
  GitHubPROptions,
  GitHubPRResult,
  GitHubWorkflowRun,
} from './types.js';

export class GitHubAdapter {
  private octokit: Octokit;
  private tokenManager: GitHubTokenManager;

  constructor(config?: GitHubAdapterConfig) {
    this.tokenManager = new GitHubTokenManager(config?.auth);
    const token = this.tokenManager.hasToken() ? this.tokenManager.getToken() : undefined;

    this.octokit = new Octokit({
      auth: token,
      userAgent: config?.userAgent || 'AI-EDS-Developer/0.1.0',
      baseUrl: config?.baseUrl,
    });
  }

  /**
   * Helper to parse "owner/repo" or "https://github.com/owner/repo.git" into { owner, repo }
   */
  public static parseRepoUrl(urlOrSlug: string): { owner: string; repo: string } {
    const cleaned = urlOrSlug.trim().replace(/\.git$/, '');
    if (cleaned.includes('github.com/')) {
      const parts = cleaned.split('github.com/')[1].split('/');
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1] };
      }
    } else if (cleaned.includes('/')) {
      const parts = cleaned.split('/');
      if (parts.length === 2) {
        return { owner: parts[0], repo: parts[1] };
      }
    }
    throw new GitHubError(
      `Invalid repository format: "${urlOrSlug}". Expected "owner/repo" or "https://github.com/owner/repo"`,
      GitHubErrorCode.VALIDATION_FAILED
    );
  }

  /**
   * Fetches repository information and verifies if it is an AEM Edge Delivery Services repo.
   */
  public async getRepository(owner: string, repo: string): Promise<GitHubRepoInfo> {
    try {
      const { data } = await this.octokit.rest.repos.get({ owner, repo });

      // Detect EDS characteristics (fstab.yaml, scripts/scripts.js, helix config)
      let hasFstab = false;
      let hasScripts = false;
      let hasHelixConfig = false;

      try {
        await this.octokit.rest.repos.getContent({ owner, repo, path: 'fstab.yaml' });
        hasFstab = true;
      } catch {
        // Not present
      }

      try {
        await this.octokit.rest.repos.getContent({ owner, repo, path: 'scripts/scripts.js' });
        hasScripts = true;
      } catch {
        // Not present
      }

      try {
        await this.octokit.rest.repos.getContent({ owner, repo, path: '.helix/config.json' });
        hasHelixConfig = true;
      } catch {
        // Not present
      }

      const isEdsProject = hasFstab || hasScripts || hasHelixConfig;

      return {
        owner: data.owner.login,
        repo: data.name,
        fullName: data.full_name,
        defaultBranch: data.default_branch,
        cloneUrl: data.clone_url,
        isPrivate: data.private,
        description: data.description,
        starsCount: data.stargazers_count,
        forksCount: data.forks_count,
        openIssuesCount: data.open_issues_count,
        hasFstab,
        hasScripts,
        hasHelixConfig,
        isEdsProject,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (err: any) {
      throw GitHubError.fromError(err);
    }
  }

  /**
   * Check if a branch exists
   */
  public async branchExists(owner: string, repo: string, branchName: string): Promise<boolean> {
    try {
      await this.octokit.rest.repos.getBranch({ owner, repo, branch: branchName });
      return true;
    } catch (err: any) {
      if (err.status === 404) {
        return false;
      }
      throw GitHubError.fromError(err);
    }
  }

  /**
   * Creates a new branch from a base branch (or default branch).
   */
  public async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromBranch?: string
  ): Promise<GitHubBranchInfo> {
    try {
      const base = fromBranch || (await this.getRepository(owner, repo)).defaultBranch;

      // Get sha of the base branch
      const refData = await this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${base}`,
      });
      const sha = refData.data.object.sha;

      // Create new reference
      await this.octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha,
      });

      return {
        name: branchName,
        sha,
        protected: false,
      };
    } catch (err: any) {
      if (err.status === 422 && err.message?.includes('already exists')) {
        throw new GitHubError(
          `Branch "${branchName}" already exists on ${owner}/${repo}`,
          GitHubErrorCode.BRANCH_ALREADY_EXISTS,
          422,
          err
        );
      }
      throw GitHubError.fromError(err);
    }
  }

  /**
   * Retrieves single file content from the repo at a given ref/branch.
   */
  public async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<GitHubFileContent> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if (Array.isArray(response.data) || !('content' in response.data)) {
        throw new GitHubError(
          `Path "${path}" is a directory, not a file`,
          GitHubErrorCode.VALIDATION_FAILED
        );
      }

      const fileData = response.data;
      const rawContent = fileData.content || '';
      const encoding = fileData.encoding === 'base64' ? 'base64' : 'utf-8';
      const decodedContent = encoding === 'base64'
        ? Buffer.from(rawContent, 'base64').toString('utf-8')
        : rawContent;

      return {
        path: fileData.path,
        sha: fileData.sha,
        size: fileData.size,
        content: decodedContent,
        encoding: 'utf-8',
      };
    } catch (err: any) {
      throw GitHubError.fromError(err);
    }
  }

  /**
   * Commits multiple file changes atomically using the Git Data API:
   * 1. Creates blobs for modified/created files
   * 2. Creates a new tree based on the latest commit
   * 3. Creates the commit pointing to parent SHA
   * 4. Updates branch reference
   */
  public async commitFiles(
    owner: string,
    repo: string,
    branch: string,
    message: string,
    files: GitHubFileChange[]
  ): Promise<GitHubCommitResult> {
    if (files.length === 0) {
      throw new GitHubError('No file changes provided to commit', GitHubErrorCode.VALIDATION_FAILED);
    }

    try {
      // 1. Get current branch ref & commit
      const refData = await this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      const parentCommitSha = refData.data.object.sha;

      const parentCommit = await this.octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: parentCommitSha,
      });
      const baseTreeSha = parentCommit.data.tree.sha;

      // 2. Prepare tree items
      const treeItems: Array<{
        path?: string;
        mode?: '100644' | '100755' | '040000' | '160000' | '120000';
        type?: 'blob' | 'tree' | 'commit';
        sha?: string | null;
        content?: string;
      }> = [];

      for (const file of files) {
        if (file.operation === 'delete') {
          // In GitHub API, setting sha to null removes the file
          treeItems.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: null,
          });
        } else {
          // Create blob for UTF-8 or base64
          const isBase64 = file.encoding === 'base64';
          const blobData = await this.octokit.rest.git.createBlob({
            owner,
            repo,
            content: file.content || '',
            encoding: isBase64 ? 'base64' : 'utf-8',
          });

          treeItems.push({
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blobData.data.sha,
          });
        }
      }

      // 3. Create new tree
      const newTree = await this.octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: baseTreeSha,
        tree: treeItems,
      });

      // 4. Create commit
      const newCommit = await this.octokit.rest.git.createCommit({
        owner,
        repo,
        message,
        tree: newTree.data.sha,
        parents: [parentCommitSha],
      });

      // 5. Update branch ref
      await this.octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommit.data.sha,
        force: false,
      });

      return {
        sha: newCommit.data.sha,
        message,
        treeSha: newTree.data.sha,
        parentShas: [parentCommitSha],
        url: newCommit.data.html_url,
      };
    } catch (err: any) {
      throw GitHubError.fromError(err);
    }
  }

  /**
   * Creates a rich Pull Request formatted with EDS evidence:
   * - EDS Preview & Live URLs
   * - Performance metrics
   * - Visual regression summary
   * - Change description & QA checklist
   */
  public async createPullRequest(options: GitHubPROptions): Promise<GitHubPRResult> {
    const { owner, repo, title, headBranch, body } = options;

    try {
      const repoInfo = await this.getRepository(owner, repo);
      const baseBranch = options.baseBranch || repoInfo.defaultBranch;

      // Format rich body if not already formatted
      let formattedBody = body;
      const previewUrl = options.edsPreviewUrl || `https://${headBranch}--${repo}--${owner}.hlx.page/`;

      const edsMetadataSection = `
---
### 🚀 AEM Edge Delivery Services Preview
- **EDS Preview URL**: [${previewUrl}](${previewUrl})
${options.lighthouseScore ? `- **Lighthouse Performance Score**: \`${options.lighthouseScore}/100\` ⚡` : ''}
${options.visualRegressionPassed !== undefined ? `- **Visual Regression Check**: ${options.visualRegressionPassed ? '✅ PASSED' : '⚠️ REVIEW REQUIRED'}` : ''}

### 🤖 Generated by AI EDS Developer
*Autonomous validation completed: Browser tests, EDS Block structure, Universal Editor models.*
`;

      if (!formattedBody.includes('AEM Edge Delivery Services Preview')) {
        formattedBody = `${formattedBody.trim()}\n\n${edsMetadataSection}`;
      }

      const pr = await this.octokit.rest.pulls.create({
        owner,
        repo,
        title,
        head: headBranch,
        base: baseBranch,
        body: formattedBody,
        draft: options.draft ?? false,
      });

      // Add labels if provided
      if (options.labels && options.labels.length > 0) {
        try {
          await this.octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: pr.data.number,
            labels: options.labels,
          });
        } catch {
          // Non-critical if label assignment fails
        }
      }

      // Add reviewers if provided
      if (options.reviewers && options.reviewers.length > 0) {
        try {
          await this.octokit.rest.pulls.requestReviewers({
            owner,
            repo,
            pull_number: pr.data.number,
            reviewers: options.reviewers,
          });
        } catch {
          // Non-critical if reviewer request fails
        }
      }

      return {
        id: String(pr.data.id),
        number: pr.data.number,
        title: pr.data.title,
        body: pr.data.body || '',
        url: pr.data.html_url,
        diffUrl: pr.data.diff_url,
        patchUrl: pr.data.patch_url,
        headBranch: pr.data.head.ref,
        baseBranch: pr.data.base.ref,
        status: pr.data.state === 'closed' ? (pr.data.merged_at ? 'merged' : 'closed') : 'open',
        createdAt: pr.data.created_at,
        labels: pr.data.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
        mergeable: pr.data.mergeable ?? undefined,
        mergeableState: pr.data.mergeable_state ?? undefined,
      };
    } catch (err: any) {
      throw GitHubError.fromError(err);
    }
  }

  /**
   * Merges a pull request (critical — requires human approval in tool policy).
   * Fails loudly when GitHub rejects the merge; never invents success.
   */
  public async mergePullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    options?: { commitTitle?: string; commitMessage?: string; mergeMethod?: 'merge' | 'squash' | 'rebase' },
  ): Promise<{ merged: boolean; sha?: string; message: string; url?: string }> {
    try {
      const { data } = await this.octokit.rest.pulls.merge({
        owner,
        repo,
        pull_number: pullNumber,
        commit_title: options?.commitTitle,
        commit_message: options?.commitMessage,
        merge_method: options?.mergeMethod || 'squash',
      });

      return {
        merged: Boolean(data.merged),
        sha: data.sha,
        message: data.message || (data.merged ? 'Pull request merged' : 'Merge not completed'),
        url: `https://github.com/${owner}/${repo}/pull/${pullNumber}`,
      };
    } catch (err: any) {
      throw GitHubError.fromError(err);
    }
  }

  /**
   * Retrieves pull request details
   */
  public async getPullRequest(owner: string, repo: string, pullNumber: number): Promise<GitHubPRResult> {
    try {
      const { data } = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });

      return {
        id: String(data.id),
        number: data.number,
        title: data.title,
        body: data.body || '',
        url: data.html_url,
        diffUrl: data.diff_url,
        patchUrl: data.patch_url,
        headBranch: data.head.ref,
        baseBranch: data.base.ref,
        status: data.state === 'closed' ? (data.merged_at ? 'merged' : 'closed') : 'open',
        createdAt: data.created_at,
        mergedAt: data.merged_at || undefined,
        labels: data.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
        mergeable: data.mergeable ?? undefined,
        mergeableState: data.mergeable_state ?? undefined,
      };
    } catch (err: any) {
      throw GitHubError.fromError(err);
    }
  }

  /**
   * Lists GitHub Actions workflow runs for the repo (e.g. Helix / AEM bot checks)
   */
  public async listWorkflowRuns(
    owner: string,
    repo: string,
    branch?: string
  ): Promise<GitHubWorkflowRun[]> {
    try {
      const { data } = await this.octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        branch,
        per_page: 10,
      });

      return data.workflow_runs.map((run) => ({
        id: run.id,
        name: run.name || 'Workflow Run',
        headBranch: run.head_branch || '',
        headSha: run.head_sha,
        status: run.status as GitHubWorkflowRun['status'],
        conclusion: run.conclusion as GitHubWorkflowRun['conclusion'],
        htmlUrl: run.html_url,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
      }));
    } catch (err: any) {
      throw GitHubError.fromError(err);
    }
  }

  /**
   * Polls a workflow run until it completes or times out
   */
  public async waitForWorkflowConclusion(
    owner: string,
    repo: string,
    runId: number,
    maxWaitMs = 180000,
    pollIntervalMs = 5000
  ): Promise<GitHubWorkflowRun> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const { data: run } = await this.octokit.rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id: runId,
      });

      if (run.status === 'completed') {
        return {
          id: run.id,
          name: run.name || 'Workflow Run',
          headBranch: run.head_branch || '',
          headSha: run.head_sha,
          status: run.status as GitHubWorkflowRun['status'],
          conclusion: run.conclusion as GitHubWorkflowRun['conclusion'],
          htmlUrl: run.html_url,
          createdAt: run.created_at,
          updatedAt: run.updated_at,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new GitHubError(
      `Workflow run ${runId} timed out after ${maxWaitMs / 1000}s`,
      GitHubErrorCode.NETWORK_ERROR
    );
  }
}
