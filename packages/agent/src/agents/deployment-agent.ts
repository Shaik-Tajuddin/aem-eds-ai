// ============================================================
// @aeds/agent — Deployment Agent
// Pre-push: build:json + lint:fix, then commit branch + open PR
// ============================================================

import { RunStatus } from '@aeds/shared';
import { GitHubAdapter, GitHubError, GitHubErrorCode, GitHubTokenManager } from '@aeds/github';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';
import { cleanupPublishWorkspace, preparePublishWorkspace } from '../publish-workspace.js';

function shouldAttemptGitHubPublish(context: RunExecutionContext): boolean {
  if (context.skipGitHubPublish) return false;
  if (process.env.VITEST || process.env.NODE_ENV === 'test') return false;
  if (process.env.ENABLE_GITHUB_PUBLISH === 'false') return false;
  return new GitHubTokenManager().hasToken();
}

function buildPreviewUrl(owner: string, repo: string, branch: string): string {
  const cleanBranch = branch.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const cleanRepo = repo.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const cleanOwner = owner.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `https://${cleanBranch}--${cleanRepo}--${cleanOwner}.aem.live/`;
}

export class DeploymentAgent extends BaseAgent {
  public readonly id = 'agent-deployment';
  public readonly name = 'Deployment & PR Assistant';
  public readonly description =
    'Runs build:json + lint:fix, commits validated code, and opens a Pull Request with preview evidence';
  public readonly phase = RunStatus.PR_CREATED;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    context.log(`Packaging ${context.generatedFiles.size} files for Pull Request...`);

    const fileList = Array.from(context.generatedFiles.keys());
    const previewUrl = buildPreviewUrl(context.repoOwner, context.repoName, context.workBranch);
    context.previewUrl = previewUrl;

    const decision = this.createDecision(
      context,
      'Validate with build:json + lint:fix, then submit Pull Request',
      [
        'Clone base branch and apply generated files locally',
        'Run npm run build:json',
        'Run npm run lint:fix',
        `Commit resulting files to branch ${context.workBranch}`,
        `Open PR with preview URL ${previewUrl}`,
      ],
      'Pull Request prepared only after build:json and lint:fix succeeded.',
    );

    if (!shouldAttemptGitHubPublish(context)) {
      context.log(
        'GitHub publish skipped (no GITHUB_TOKEN, tests, or ENABLE_GITHUB_PUBLISH=false). Files remain in-memory only.',
        'warn',
      );
      return {
        success: true,
        decision,
        filesGenerated: fileList,
      };
    }

    if (context.generatedFiles.size === 0) {
      context.log('No generated files to commit — skipping GitHub publish.', 'warn');
      return { success: true, decision, filesGenerated: fileList };
    }

    let workDir: string | undefined;

    try {
      const token = new GitHubTokenManager().getToken();
      const { repoOwner: owner, repoName: repo, workBranch, baseBranch } = context;

      const prep = await preparePublishWorkspace({
        owner,
        repo,
        baseBranch,
        workBranch,
        token,
        generatedFiles: context.generatedFiles,
        log: (msg, level) => context.log(msg, level),
      });
      workDir = prep.workDir;

      if (!prep.ok) {
        context.log(
          `Pre-push checks failed — branch/PR not created. ${prep.error || 'unknown error'}`,
          'error',
        );
        return {
          success: true,
          decision,
          filesGenerated: fileList,
          error: prep.error,
        };
      }

      // Keep generatedFiles in sync with post-script outputs for later UI/events
      for (const file of prep.files) {
        context.generatedFiles.set(file.path, file);
      }

      const adapter = new GitHubAdapter({ auth: token });

      try {
        await adapter.createBranch(owner, repo, workBranch, baseBranch);
        context.log(`Created branch ${workBranch} from ${baseBranch}`);
      } catch (err: unknown) {
        const code = err instanceof GitHubError ? err.code : undefined;
        if (code === GitHubErrorCode.BRANCH_ALREADY_EXISTS || code === GitHubErrorCode.CONFLICT) {
          context.log(`Branch ${workBranch} already exists — updating with new commit`);
        } else {
          throw err;
        }
      }

      const files = prep.files.map((f) => ({
        path: f.path,
        content: f.content,
        operation: f.operation,
        encoding: 'utf-8' as const,
      }));

      const commit = await adapter.commitFiles(
        owner,
        repo,
        workBranch,
        `feat(aeds): autonomous EDS changes for run ${context.runId.slice(0, 8)}\n\nVerified with npm run build:json && npm run lint:fix`,
        files,
      );
      context.gitCommit = commit.sha;
      context.log(
        `Committed ${files.length} file(s) after build:json + lint:fix → ${commit.sha.slice(0, 7)}`,
      );

      let prUrl: string | undefined;
      let prNumber: number | undefined;

      try {
        const pr = await adapter.createPullRequest({
          owner,
          repo,
          title: `feat(aeds): EDS pipeline run ${context.runId.slice(0, 8)}`,
          headBranch: workBranch,
          baseBranch,
          body: [
            `## AI EDS Developer — autonomous run`,
            '',
            `- **Run ID**: \`${context.runId}\``,
            `- **Source**: ${context.sourceType}${context.sourceUrl ? ` (${context.sourceUrl})` : ''}`,
            `- **Files**: ${prep.files.map((f) => `\`${f.path}\``).join(', ')}`,
            '',
            '### Pre-push checks',
            '- `npm run build:json` ✅',
            '- `npm run lint:fix` ✅',
            '',
            `Preview (after AEM rebuild): ${previewUrl}`,
            '',
            '### Notes',
            '- Production merge / AEM live publish still requires human approval.',
          ].join('\n'),
          edsPreviewUrl: previewUrl,
          labels: ['aeds', 'autonomous'],
        });
        prUrl = pr.url;
        prNumber = pr.number;
      } catch (prErr: unknown) {
        const msg = prErr instanceof Error ? prErr.message : String(prErr);
        context.log(`PR create failed (${msg}); compare URL provided as fallback.`, 'warn');
        prUrl = `https://github.com/${owner}/${repo}/compare/${baseBranch}...${workBranch}?expand=1`;
      }

      context.pullRequestUrl = prUrl;
      context.pullRequestNumber = prNumber;
      context.log(
        prNumber
          ? `Opened pull request #${prNumber}: ${prUrl}`
          : `GitHub publish complete. Review changes: ${prUrl}`,
      );

      return {
        success: true,
        decision,
        filesGenerated: Array.from(context.generatedFiles.keys()),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      context.log(`GitHub publish failed (pipeline continues to WAITING_APPROVAL): ${message}`, 'error');
      return {
        success: true,
        decision,
        filesGenerated: fileList,
        error: message,
      };
    } finally {
      await cleanupPublishWorkspace(workDir);
    }
  }
}
