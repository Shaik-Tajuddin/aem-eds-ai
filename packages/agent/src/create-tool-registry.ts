// ============================================================
// @aeds/agent — Default ToolRegistry with production tool handlers
// Agents should call tools through this registry (policy + audit).
// ============================================================

import { ToolRegistry } from '@aeds/tools';
import { GitHubAdapter, GitHubTokenManager } from '@aeds/github';
import { BrowserController } from '@aeds/browser';
import { VisualComparator } from '@aeds/visual';
import { runAllowlistedCommand } from '@aeds/queue';
import { FigmaClient, FigmaUrlParser } from '@aeds/figma';

function gh(): GitHubAdapter {
  const mgr = new GitHubTokenManager();
  if (!mgr.hasToken()) {
    throw new Error('GITHUB_TOKEN is not configured');
  }
  return new GitHubAdapter({ auth: mgr.getToken() });
}

/**
 * Builds a ToolRegistry preloaded with platform tools.
 * Handlers fail loudly when credentials/URLs are missing — never invent success.
 */
export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // ── GitHub ───────────────────────────────────────────────
  registry.register(
    {
      name: 'github.getRepository',
      namespace: 'github',
      description: 'Fetch repository metadata and EDS characteristic detection',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
        },
        required: ['owner', 'repo'],
      },
      riskLevel: 'low',
      timeoutMs: 30_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { owner, repo } = input as { owner: string; repo: string };
      return gh().getRepository(owner, repo);
    },
  );

  registry.register(
    {
      name: 'github.readFile',
      namespace: 'github',
      description: 'Read a file from a GitHub repository branch',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          path: { type: 'string' },
          ref: { type: 'string' },
        },
        required: ['owner', 'repo', 'path'],
      },
      riskLevel: 'low',
      timeoutMs: 30_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { owner, repo, path, ref } = input as {
        owner: string;
        repo: string;
        path: string;
        ref?: string;
      };
      return gh().getFileContent(owner, repo, path, ref);
    },
  );

  registry.register(
    {
      name: 'github.createBranch',
      namespace: 'github',
      description: 'Create a git branch from a base branch',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          branch: { type: 'string' },
          baseBranch: { type: 'string' },
        },
        required: ['owner', 'repo', 'branch'],
      },
      riskLevel: 'high',
      requiresApproval: false,
      timeoutMs: 60_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { owner, repo, branch, baseBranch } = input as {
        owner: string;
        repo: string;
        branch: string;
        baseBranch?: string;
      };
      await gh().createBranch(owner, repo, branch, baseBranch || 'main');
      return { owner, repo, branch, created: true };
    },
  );

  registry.register(
    {
      name: 'github.commitFiles',
      namespace: 'github',
      description: 'Atomically commit multiple file changes',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          branch: { type: 'string' },
          message: { type: 'string' },
          files: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                content: { type: 'string' },
                operation: { type: 'string', enum: ['create', 'modify', 'delete'] },
              },
            },
          },
        },
        required: ['owner', 'repo', 'branch', 'message', 'files'],
      },
      riskLevel: 'high',
      timeoutMs: 120_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { owner, repo, branch, message, files } = input as {
        owner: string;
        repo: string;
        branch: string;
        message: string;
        files: Array<{
          path: string;
          content?: string;
          operation?: 'create' | 'modify' | 'delete';
        }>;
      };
      return gh().commitFiles(
        owner,
        repo,
        branch,
        message,
        files.map((f) => ({
          path: f.path,
          content: f.content,
          operation: f.operation || (f.content === undefined ? 'delete' : 'modify'),
        })),
      );
    },
  );

  registry.register(
    {
      name: 'github.createPR',
      namespace: 'github',
      description:
        'Open a pull request (audited). Merge/publish remains a separate human approval stage.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          title: { type: 'string' },
          head: { type: 'string' },
          base: { type: 'string' },
          body: { type: 'string' },
          edsPreviewUrl: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } },
        },
        required: ['owner', 'repo', 'title', 'head'],
      },
      // Opening a PR is the pipeline deliverable; critical merge gate is WAITING_APPROVAL.
      riskLevel: 'high',
      requiresApproval: false,
      timeoutMs: 60_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { owner, repo, title, head, base, body, edsPreviewUrl, labels } = input as {
        owner: string;
        repo: string;
        title: string;
        head: string;
        base?: string;
        body?: string;
        edsPreviewUrl?: string;
        labels?: string[];
      };
      return gh().createPullRequest({
        owner,
        repo,
        title,
        headBranch: head,
        baseBranch: base || 'main',
        body: body || '',
        edsPreviewUrl,
        labels,
      });
    },
  );

  // ── Browser ──────────────────────────────────────────────
  registry.register(
    {
      name: 'browser.auditPage',
      namespace: 'browser',
      description: 'Playwright page audit (DOM, console, network, a11y, screenshot)',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          viewport: { type: 'string', enum: ['desktop', 'tablet', 'mobile'] },
        },
        required: ['url'],
      },
      riskLevel: 'medium',
      timeoutMs: 90_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { url, viewport } = input as { url: string; viewport?: 'desktop' | 'tablet' | 'mobile' };
      const controller = new BrowserController({
        headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
      });
      try {
        const audit = await controller.auditPage(url, viewport || 'desktop');
        return {
          url: audit.url,
          statusCode: audit.statusCode,
          title: audit.title,
          loadTimeMs: audit.loadTimeMs,
          a11yViolations: audit.a11yViolations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            helpUrl: v.helpUrl,
            nodes: v.nodes,
          })),
          a11yMode: audit.a11yMode,
          consoleLogs: audit.consoleLogs.map((l) => ({ type: l.type, text: l.text })),
          networkErrors: audit.networkErrors.map((e) => ({
            url: e.url,
            method: e.method,
            status: e.status,
            errorText: e.errorText,
          })),
          screenshotBase64: audit.screenshotBase64,
          domSummary: audit.domSummary,
          performanceMetrics: audit.performanceMetrics,
        };
      } finally {
        await controller.close().catch(() => {});
      }
    },
  );

  // ── Visual ───────────────────────────────────────────────
  registry.register(
    {
      name: 'visual.compare',
      namespace: 'visual',
      description: 'Pixelmatch compare of two PNG buffers (base64)',
      parameters: {
        type: 'object',
        properties: {
          baselineBase64: { type: 'string' },
          candidateBase64: { type: 'string' },
          threshold: { type: 'number' },
        },
        required: ['baselineBase64', 'candidateBase64'],
      },
      riskLevel: 'low',
      timeoutMs: 60_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { baselineBase64, candidateBase64, threshold } = input as {
        baselineBase64: string;
        candidateBase64: string;
        threshold?: number;
      };
      const result = await new VisualComparator().compare(
        Buffer.from(baselineBase64, 'base64'),
        Buffer.from(candidateBase64, 'base64'),
        { threshold: threshold ?? 95, generateDiffImage: false },
      );
      return {
        passed: result.passed,
        score: result.score,
        diffPixels: result.diffPixels,
        diffPercentage: result.diffPercentage,
      };
    },
  );

  // ── Build / test (allowlisted) ────────────────────────────
  registry.register(
    {
      name: 'build.validateArtifacts',
      namespace: 'build',
      description: 'Validate generated EDS block/JSON artifacts (decorate export, no React, JSON parse)',
      parameters: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                content: { type: 'string' },
              },
            },
          },
        },
        required: ['files'],
      },
      riskLevel: 'low',
      timeoutMs: 30_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { files } = input as { files: Array<{ path: string; content: string }> };
      const { validateEdsArtifacts } = await import('./validate-artifacts.js');
      return validateEdsArtifacts(files || []);
    },
  );

  registry.register(
    {
      name: 'testing.runCommand',
      namespace: 'testing',
      description: 'Run an allowlisted npm/npx/node command in a work directory',
      parameters: {
        type: 'object',
        properties: {
          workDir: { type: 'string' },
          command: { type: 'string' },
          timeoutMs: { type: 'number' },
        },
        required: ['workDir', 'command'],
      },
      riskLevel: 'high',
      timeoutMs: 300_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { workDir, command, timeoutMs } = input as {
        workDir: string;
        command: string;
        timeoutMs?: number;
      };
      return runAllowlistedCommand(workDir, command, timeoutMs ?? 300_000);
    },
  );

  // ── Figma ────────────────────────────────────────────────
  registry.register(
    {
      name: 'figma.getFile',
      namespace: 'figma',
      description: 'Fetch a Figma file by URL or file key',
      parameters: {
        type: 'object',
        properties: {
          urlOrKey: { type: 'string' },
        },
        required: ['urlOrKey'],
      },
      riskLevel: 'low',
      timeoutMs: 60_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { urlOrKey } = input as { urlOrKey: string };
      const token = process.env.FIGMA_TOKEN;
      if (!token) throw new Error('FIGMA_TOKEN is not configured');
      const parsed = urlOrKey.includes('figma.com')
        ? FigmaUrlParser.parse(urlOrKey)
        : { fileKey: urlOrKey, nodeId: undefined };
      const client = new FigmaClient({ accessToken: token });
      const file = await client.getFile(parsed.fileKey);
      return {
        fileKey: parsed.fileKey,
        nodeId: parsed.nodeId,
        name: (file as any).name,
        lastModified: (file as any).lastModified,
        version: (file as any).version,
      };
    },
  );

  // ── AEM preview (read-ish) ───────────────────────────────
  registry.register(
    {
      name: 'aem.previewPage',
      namespace: 'aem',
      description: 'Request AEM/EDS preview publish for a path',
      parameters: {
        type: 'object',
        properties: {
          authorUrl: { type: 'string' },
          path: { type: 'string' },
          previewUrl: { type: 'string' },
        },
        required: ['authorUrl', 'path'],
      },
      riskLevel: 'high',
      timeoutMs: 60_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { authorUrl, path, previewUrl } = input as {
        authorUrl: string;
        path: string;
        previewUrl?: string;
      };
      const { AemCloudClient } = await import('@aeds/aem');
      const client = new AemCloudClient({ authorUrl, previewUrl });
      return client.previewPage(path);
    },
  );

  registry.register(
    {
      name: 'github.mergePR',
      namespace: 'github',
      description:
        'Merge a pull request into the base branch. Critical — requires human approval completion.',
      parameters: {
        type: 'object',
        properties: {
          owner: { type: 'string' },
          repo: { type: 'string' },
          pullNumber: { type: 'number' },
          mergeMethod: { type: 'string', enum: ['merge', 'squash', 'rebase'] },
        },
        required: ['owner', 'repo', 'pullNumber'],
      },
      riskLevel: 'critical',
      requiresApproval: true,
      timeoutMs: 60_000,
      allowedInScopes: ['*'],
    },
    async (input) => {
      const { owner, repo, pullNumber, mergeMethod } = input as {
        owner: string;
        repo: string;
        pullNumber: number;
        mergeMethod?: 'merge' | 'squash' | 'rebase';
      };
      return gh().mergePullRequest(owner, repo, pullNumber, { mergeMethod });
    },
  );

  return registry;
}

export function listDefaultToolNames(): string[] {
  return createDefaultToolRegistry().listTools().map((t) => t.name);
}
