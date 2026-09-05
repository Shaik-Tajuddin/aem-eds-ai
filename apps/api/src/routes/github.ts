import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { GitHubAdapter, GitHubTokenManager, GitHubError } from '@aeds/github';

// ============================================================
// GitHub Integration Routes — Phase 2
// Provides real validation, repo inspection, branch management,
// and PR creation for EDS projects.
// ============================================================

const ValidateTokenSchema = z.object({
  token: z.string().optional(),
});

const ValidateRepoSchema = z.object({
  repoUrl: z.string().min(1, 'Repository URL or slug is required'),
  token: z.string().optional(),
});

const CreateBranchSchema = z.object({
  branchName: z.string().min(1, 'Branch name is required'),
  fromBranch: z.string().optional(),
  token: z.string().optional(),
});

const CreatePRSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  headBranch: z.string().min(1, 'Head branch is required'),
  baseBranch: z.string().optional(),
  body: z.string().min(1, 'Body is required'),
  token: z.string().optional(),
  edsPreviewUrl: z.string().optional(),
  lighthouseScore: z.number().optional(),
  visualRegressionPassed: z.boolean().optional(),
});

export const githubPlugin: FastifyPluginAsync = async (server) => {
  // POST /api/github/validate-token
  server.post('/validate-token', async (request, reply) => {
    const parseResult = ValidateTokenSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        details: parseResult.error.format(),
      });
    }

    const { token } = parseResult.data;
    const tokenManager = new GitHubTokenManager(token);
    const result = await tokenManager.validateToken();

    if (!result.valid) {
      return reply.code(401).send({
        valid: false,
        error: result.error || 'Invalid or expired GitHub token',
      });
    }

    return reply.send({
      valid: true,
      user: result.user,
      scopes: result.scopes,
      maskedToken: tokenManager.getMaskedToken(),
    });
  });

  // POST /api/github/validate-repo
  server.post('/validate-repo', async (request, reply) => {
    const parseResult = ValidateRepoSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        details: parseResult.error.format(),
      });
    }

    const { repoUrl, token } = parseResult.data;

    try {
      const { owner, repo } = GitHubAdapter.parseRepoUrl(repoUrl);
      const adapter = new GitHubAdapter({ auth: token });
      const repoInfo = await adapter.getRepository(owner, repo);

      return reply.send({
        success: true,
        repository: repoInfo,
        edsDetected: repoInfo.isEdsProject,
        edsDetails: {
          hasFstab: repoInfo.hasFstab,
          hasScripts: repoInfo.hasScripts,
          hasHelixConfig: repoInfo.hasHelixConfig,
        },
      });
    } catch (err: any) {
      server.log.warn({ err }, 'GitHub repo validation failed');
      const ghErr = GitHubError.fromError(err);
      return reply.code(ghErr.status || 400).send({
        success: false,
        error: ghErr.code,
        message: ghErr.message,
      });
    }
  });

  // POST /api/github/repo/:owner/:repo/branches
  server.post<{
    Params: { owner: string; repo: string };
  }>('/repo/:owner/:repo/branches', async (request, reply) => {
    const { owner, repo } = request.params;
    const parseResult = CreateBranchSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        details: parseResult.error.format(),
      });
    }

    const { branchName, fromBranch, token } = parseResult.data;

    try {
      const adapter = new GitHubAdapter({ auth: token });
      const branchInfo = await adapter.createBranch(owner, repo, branchName, fromBranch);

      return reply.code(201).send({
        success: true,
        branch: branchInfo,
      });
    } catch (err: any) {
      const ghErr = GitHubError.fromError(err);
      return reply.code(ghErr.status || 400).send({
        success: false,
        error: ghErr.code,
        message: ghErr.message,
      });
    }
  });

  // POST /api/github/repo/:owner/:repo/pull-requests
  server.post<{
    Params: { owner: string; repo: string };
  }>('/repo/:owner/:repo/pull-requests', async (request, reply) => {
    const { owner, repo } = request.params;
    const parseResult = CreatePRSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        details: parseResult.error.format(),
      });
    }

    const {
      title,
      headBranch,
      baseBranch,
      body,
      token,
      edsPreviewUrl,
      lighthouseScore,
      visualRegressionPassed,
    } = parseResult.data;

    try {
      const adapter = new GitHubAdapter({ auth: token });
      const prResult = await adapter.createPullRequest({
        owner,
        repo,
        title,
        headBranch,
        baseBranch,
        body,
        edsPreviewUrl,
        lighthouseScore,
        visualRegressionPassed,
      });

      return reply.code(201).send({
        success: true,
        pullRequest: prResult,
      });
    } catch (err: any) {
      const ghErr = GitHubError.fromError(err);
      return reply.code(ghErr.status || 400).send({
        success: false,
        error: ghErr.code,
        message: ghErr.message,
      });
    }
  });
};
