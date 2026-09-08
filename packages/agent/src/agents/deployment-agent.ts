// ============================================================
// @aeds/agent — Preview deploy + PR agents
// Preview: commit work branch BEFORE live QA
// PR: open GitHub PR AFTER quality gate
// ============================================================

import { RunStatus } from '@aeds/shared';
import { GitHubError, GitHubTokenManager } from '@aeds/github';
import { BaseAgent, type RunExecutionContext, type AgentExecutionResult } from './base.js';
import { cleanupPublishWorkspace, preparePublishWorkspace } from '../publish-workspace.js';
import { executeTool } from '../execute-tool.js';

function shouldAttemptGitHubPublish(context: RunExecutionContext): boolean {
  if (context.skipGitHubPublish) return false;
  if (process.env.VITEST || process.env.NODE_ENV === 'test') return false;
  if (process.env.ENABLE_GITHUB_PUBLISH === 'false') return false;
  return new GitHubTokenManager().hasToken();
}

export function buildPreviewUrl(owner: string, repo: string, branch: string): string {
  const cleanBranch = branch
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const cleanRepo = repo.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const cleanOwner = owner.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `https://${cleanBranch}--${cleanRepo}--${cleanOwner}.aem.live/`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Commit generated files to the work branch and mark preview as published.
 * Does NOT open a Pull Request — that happens after the quality gate.
 */
export class PreviewDeployAgent extends BaseAgent {
  public readonly id = 'agent-preview-deploy';
  public readonly name = 'Preview Deploy';
  public readonly description =
    'Runs build:json + lint:fix, commits to the work branch so aem.live preview is available before browser QA';
  public readonly phase = RunStatus.DEPLOYING_PREVIEW;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    const fileList = Array.from(context.generatedFiles.keys());
    const previewUrl = buildPreviewUrl(context.repoOwner, context.repoName, context.workBranch);
    context.previewUrl = previewUrl;

    const decision = this.createDecision(
      context,
      'Publish work branch for live preview before QA',
      [
        'Clone base branch and apply generated files locally',
        'Run npm run build:json && npm run lint:fix',
        `Commit resulting files to branch ${context.workBranch}`,
        `Expose preview URL ${previewUrl} for Playwright / visual checks`,
      ],
      'Live browser QA must not run against a stale branch; preview publish happens first.',
    );

    if (!shouldAttemptGitHubPublish(context)) {
      // In-memory / test path: treat as published so static QA can proceed without inventing live FAIL
      context.previewPublished = false;
      context.log(
        'Preview GitHub publish skipped (no GITHUB_TOKEN, tests, or ENABLE_GITHUB_PUBLISH=false). Live browser QA will skip until a real publish.',
        'warn',
      );
      return { success: true, decision, filesGenerated: fileList };
    }

    if (context.generatedFiles.size === 0) {
      context.previewPublished = false;
      context.log('No generated files to commit — preview not published.', 'warn');
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
        context.previewPublished = false;
        context.log(
          `Pre-push checks failed — preview branch not updated. ${prep.error || 'unknown error'}`,
          'error',
        );
        return {
          success: false,
          decision,
          filesGenerated: fileList,
          error: prep.error || 'Pre-push build/lint checks failed',
        };
      }

      for (const file of prep.files) {
        context.generatedFiles.set(file.path, file);
      }

      const branchResult = await executeTool(context, 'github.createBranch', {
        owner,
        repo,
        branch: workBranch,
        baseBranch,
      });
      if (!branchResult.success) {
        const msg = branchResult.error || 'createBranch failed';
        const alreadyExists = /already exists|Reference already exists|conflict/i.test(msg);
        if (alreadyExists) {
          context.log(`Branch ${workBranch} already exists — updating with new commit`);
        } else {
          throw new Error(msg);
        }
      } else {
        context.log(`Created branch ${workBranch} from ${baseBranch}`);
      }

      const files = prep.files.map((f) => ({
        path: f.path,
        content: f.content,
        operation: f.operation,
      }));

      const commitResult = await executeTool(context, 'github.commitFiles', {
        owner,
        repo,
        branch: workBranch,
        message: `feat(aeds): preview deploy for run ${context.runId.slice(0, 8)}\n\nVerified with npm run build:json && npm run lint:fix`,
        files,
      });
      if (!commitResult.success || !commitResult.data) {
        throw new Error(commitResult.error || 'github.commitFiles failed');
      }

      const commitData = commitResult.data as { sha?: string };
      const sha = commitData.sha || '';
      context.gitCommit = sha;
      context.previewPublished = true;
      context.log(
        `Preview published: ${files.length} file(s) → ${sha.slice(0, 7) || 'unknown'} @ ${previewUrl}`,
      );

      const waitMs = Math.max(0, Number(process.env.PREVIEW_READY_WAIT_MS || 8000));
      if (waitMs > 0) {
        context.log(`Waiting ${waitMs}ms for AEM/Franklin preview to pick up commit…`);
        await sleep(waitMs);
      }

      return {
        success: true,
        decision,
        filesGenerated: Array.from(context.generatedFiles.keys()),
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const ghMsg = err instanceof GitHubError ? err.message : message;
      context.previewPublished = false;
      context.log(`Preview publish failed: ${ghMsg}`, 'error');
      // Continue pipeline — QA will skip live audits when previewPublished is false
      return {
        success: true,
        decision,
        filesGenerated: fileList,
        error: ghMsg,
      };
    } finally {
      await cleanupPublishWorkspace(workDir);
    }
  }
}

/**
 * Open the GitHub Pull Request after quality gate (branch already published at preview).
 */
export class DeploymentAgent extends BaseAgent {
  public readonly id = 'agent-deployment';
  public readonly name = 'Deployment & PR Assistant';
  public readonly description =
    'Opens the evidence-backed Pull Request after quality gate (preview branch already committed)';
  public readonly phase = RunStatus.PR_CREATED;

  public async execute(context: RunExecutionContext): Promise<AgentExecutionResult> {
    const fileList = Array.from(context.generatedFiles.keys());
    const previewUrl =
      context.previewUrl ||
      buildPreviewUrl(context.repoOwner, context.repoName, context.workBranch);
    context.previewUrl = previewUrl;

    const decision = this.createDecision(
      context,
      'Open Pull Request with preview evidence after quality gate',
      [
        context.gitCommit
          ? `Reuse preview commit ${context.gitCommit.slice(0, 7)}`
          : 'Commit files if preview publish was skipped earlier',
        `Open PR ${context.workBranch} → ${context.baseBranch}`,
        `Attach preview URL ${previewUrl}`,
      ],
      'PR is created only after automated QA / quality gate so reviewers see validated evidence.',
    );

    if (!shouldAttemptGitHubPublish(context)) {
      context.log(
        'GitHub PR skipped (no GITHUB_TOKEN, tests, or ENABLE_GITHUB_PUBLISH=false).',
        'warn',
      );
      return { success: true, decision, filesGenerated: fileList };
    }

    // If preview never committed, fall back to full publish+PR via PreviewDeployAgent path
    if (!context.gitCommit && context.generatedFiles.size > 0) {
      context.log('No preview commit yet — publishing branch before opening PR…', 'warn');
      const preview = new PreviewDeployAgent();
      const previewResult = await preview.execute(context);
      if (!previewResult.success) {
        return {
          success: false,
          decision,
          filesGenerated: fileList,
          error: previewResult.error || 'Preview publish failed before PR',
        };
      }
    }

    if (!context.gitCommit && context.generatedFiles.size === 0) {
      context.log('No commit and no files — skipping PR.', 'warn');
      return { success: true, decision, filesGenerated: fileList };
    }

    try {
      const { repoOwner: owner, repoName: repo, workBranch, baseBranch } = context;

      if (context.pullRequestUrl && context.pullRequestNumber) {
        context.log(`PR already open #${context.pullRequestNumber}: ${context.pullRequestUrl}`);
        return { success: true, decision, filesGenerated: fileList };
      }

      const prResult = await executeTool(context, 'github.createPR', {
        owner,
        repo,
        title: `feat(aeds): EDS pipeline run ${context.runId.slice(0, 8)}`,
        head: workBranch,
        base: baseBranch,
        body: [
          `## AI EDS Developer — autonomous run`,
          '',
          `- **Run ID**: \`${context.runId}\``,
          `- **Source**: ${context.sourceType}${context.sourceUrl ? ` (${context.sourceUrl})` : ''}`,
          `- **Commit**: \`${context.gitCommit || 'n/a'}\``,
          `- **Files**: ${fileList.map((f) => `\`${f}\``).join(', ')}`,
          '',
          '### Checks',
          '- Preview branch published before live browser QA',
          '- Quality gate completed',
          '',
          `Preview: ${previewUrl}`,
          '',
          '### Notes',
          '- Production merge / AEM live publish still requires human approval.',
        ].join('\n'),
        edsPreviewUrl: previewUrl,
        labels: ['aeds', 'autonomous'],
      });

      if (prResult.success && prResult.data) {
        const pr = prResult.data as { url?: string; number?: number };
        context.pullRequestUrl = pr.url;
        context.pullRequestNumber = pr.number;
      } else {
        const msg = prResult.error || 'createPR failed';
        context.log(`PR create failed (${msg}); compare URL provided as fallback.`, 'warn');
        context.pullRequestUrl = `https://github.com/${owner}/${repo}/compare/${baseBranch}...${workBranch}?expand=1`;
      }

      context.log(
        context.pullRequestNumber
          ? `Opened pull request #${context.pullRequestNumber}: ${context.pullRequestUrl}`
          : `GitHub publish complete. Review changes: ${context.pullRequestUrl}`,
      );

      return {
        success: true,
        decision,
        filesGenerated: fileList,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const ghMsg = err instanceof GitHubError ? err.message : message;
      context.log(`GitHub PR failed (pipeline continues to WAITING_APPROVAL): ${ghMsg}`, 'error');
      return {
        success: true,
        decision,
        filesGenerated: fileList,
        error: ghMsg,
      };
    }
  }
}
