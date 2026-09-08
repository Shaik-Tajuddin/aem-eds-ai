// ============================================================
// POST /api/parity — Track B page authoring (standalone or post-PR)
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getDatabase,
  agentRuns,
  projects,
  projectConfigs,
  environments,
  repositories,
  pullRequests,
  persistUeAuthoringTestRows,
  eq,
  desc,
} from '@aeds/database';
import {
  runPageParity,
  toAuthorContentPath,
  type ParityPhaseResult,
} from '@aeds/aem';

const ParityBodySchema = z.object({
  projectId: z.string().uuid().optional(),
  runId: z.string().uuid().optional(),
  referenceUrl: z.string().optional(),
  referencePath: z.string().optional(),
  targetAuthorPath: z.string().optional(),
  targetUrl: z.string().optional(),
  authorUrl: z.string().optional(),
  branch: z.string().optional(),
  fixCss: z.boolean().optional().default(false),
  verifyBrowser: z.boolean().optional().default(true),
  contentTree: z.unknown().optional(),
  patch: z.unknown().optional(),
});

function mapPhaseStatus(status: string): string {
  return status.toUpperCase();
}

async function runBrowserAuditPhase(
  targetUrl: string,
): Promise<ParityPhaseResult> {
  try {
    const { BrowserController } = await import('@aeds/browser');
    const controller = new BrowserController({ headless: true });
    try {
      const audit = await controller.auditPage(targetUrl, 'desktop');
      const blocks = audit.domSummary?.detectedBlocks || [];
      const decorated = blocks.filter((b) => b.isDecorated).length;
      const consoleErrs = (audit.consoleLogs || []).filter((l) => l.type === 'error').length;
      const httpOk = audit.statusCode >= 200 && audit.statusCode < 400;
      return {
        action: 'browser-audit',
        status: httpOk && consoleErrs < 20 ? 'PASS' : 'FAIL',
        detail: {
          statusCode: audit.statusCode,
          decoratedBlocks: decorated,
          blocksCount: audit.domSummary?.blocksCount,
          consoleErrors: consoleErrs,
          loadTimeMs: audit.loadTimeMs,
        },
        errorMessage: httpOk ? undefined : `HTTP ${audit.statusCode}`,
      };
    } finally {
      await controller.close().catch(() => undefined);
    }
  } catch (err: unknown) {
    return {
      action: 'browser-audit',
      status: 'UNAVAILABLE',
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

export const parityPlugin: FastifyPluginAsync = async (server) => {
  const db = getDatabase();

  server.post<{ Body: z.infer<typeof ParityBodySchema> }>(
    '/',
    {
      schema: {
        tags: ['parity'],
        summary:
          'Track B: author destination page via aem-cloud MCP write-api (standalone or after PR)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const parsed = ParityBodySchema.safeParse(request.body || {});
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid body', details: parsed.error.flatten() });
      }
      const body = parsed.data;

      if (!body.projectId && !body.runId) {
        return reply.status(400).send({ error: 'projectId or runId is required' });
      }

      try {
        let projectId = body.projectId;
        let runId = body.runId;
        let branch = body.branch;
        let sourceUrl = body.referenceUrl || body.referencePath;
        let authorUrl = body.authorUrl;
        let authoringPath = body.targetAuthorPath || body.targetUrl;
        let previewUrl: string | undefined;

        if (runId) {
          const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
          if (!run) {
            return reply.status(404).send({ error: 'Run not found' });
          }
          projectId = projectId || run.projectId;
          branch = branch || run.branch || undefined;
          sourceUrl = sourceUrl || run.sourceUrl || undefined;

          const [pr] = await db
            .select()
            .from(pullRequests)
            .where(eq(pullRequests.runId, runId))
            .limit(1);
          if (pr?.headBranch && !body.branch) {
            branch = pr.headBranch;
          }
        }

        if (!projectId) {
          return reply.status(400).send({ error: 'Could not resolve projectId' });
        }

        const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
        if (!project) {
          return reply.status(404).send({ error: 'Project not found' });
        }

        const [config] = await db
          .select()
          .from(projectConfigs)
          .where(eq(projectConfigs.projectId, projectId))
          .limit(1);
        const [env] = await db
          .select()
          .from(environments)
          .where(eq(environments.projectId, projectId))
          .limit(1);
        const [repo] = await db
          .select()
          .from(repositories)
          .where(eq(repositories.projectId, projectId))
          .limit(1);

        sourceUrl = sourceUrl || config?.sourceUrl || undefined;
        authorUrl = authorUrl || env?.authorUrl || process.env.AEM_AUTHOR_URL || undefined;
        authoringPath =
          authoringPath || env?.authoringPath || process.env.AEM_DEFAULT_AUTHORING_PATH || undefined;
        previewUrl = env?.previewUrl || undefined;
        branch = branch || repo?.defaultBranch || 'main';

        if (!authorUrl) {
          return reply.status(400).send({
            error: 'authorUrl is required (project environments.author_url or body.authorUrl)',
          });
        }
        if (!sourceUrl) {
          return reply.status(400).send({
            error: 'reference URL/path is required (project source_url or body.referenceUrl)',
          });
        }
        if (!authoringPath) {
          return reply.status(400).send({
            error: 'targetAuthorPath is required (project authoring_path or body.targetAuthorPath)',
          });
        }

        // Create a lightweight run for evidence when none provided
        if (!runId) {
          const [created] = await db
            .insert(agentRuns)
            .values({
              projectId,
              status: 'RECEIVED',
              source: config?.sourceType || 'EXISTING_AEM_PAGE',
              sourceUrl: typeof sourceUrl === 'string' ? sourceUrl : undefined,
              branch,
              currentStage: 'PAGE_PARITY',
              progress: 0,
              startedAt: new Date(),
              stateSnapshot: { kind: 'page-parity', fixCss: body.fixCss },
            })
            .returning({ id: agentRuns.id });
          runId = created.id;
        } else {
          await db
            .update(agentRuns)
            .set({
              updatedAt: new Date(),
              stateSnapshot: {
                kind: 'page-parity',
                fixCss: body.fixCss,
                startedAt: new Date().toISOString(),
              },
            })
            .where(eq(agentRuns.id, runId));
        }

        const targetPath = toAuthorContentPath(authoringPath);
        let targetUrl = body.targetUrl;
        if (!targetUrl && authorUrl && targetPath) {
          targetUrl = `${authorUrl.replace(/\/$/, '')}${targetPath}.html?ref=${encodeURIComponent(branch || 'main')}`;
        }

        const parity = await runPageParity({
          authorUrl,
          referencePath: sourceUrl,
          targetPath: authoringPath,
          branch,
          referenceUrl: body.referenceUrl,
          targetUrl,
          contentTree: body.contentTree,
          patch: body.patch,
          fixCss: body.fixCss,
          verifyBrowser: false, // host runs browser below
          accessToken: process.env.AEM_MCP_ACCESS_TOKEN,
          mcpUrl:
            process.env.AEM_MCP_WRITE_URL ||
            process.env.AEM_MCP_URL ||
            'https://mcp.adobeaemcloud.com/adobe/mcp/aem',
        });

        // Replace deferred browser-audit phase
        const phases = parity.phases.filter((p) => p.action !== 'browser-audit');
        if (body.verifyBrowser !== false && parity.targetUrl) {
          phases.push(await runBrowserAuditPhase(parity.targetUrl));
        } else {
          phases.push({
            action: 'browser-audit',
            status: 'SKIPPED',
            errorMessage: body.verifyBrowser === false ? 'verifyBrowser=false' : 'No targetUrl',
          });
        }

        const failed = phases.some((p) => p.status === 'FAIL');
        const ok = !failed;

        await persistUeAuthoringTestRows(db, {
          runId: runId!,
          pageUrl: parity.targetUrl || targetUrl || authoringPath,
          blockName: 'page-parity',
          phases: phases.map((p) => ({
            action: p.action,
            status: mapPhaseStatus(p.status),
            errorMessage: p.errorMessage,
          })),
        });

        const [existingRun] = await db
          .select({ status: agentRuns.status })
          .from(agentRuns)
          .where(eq(agentRuns.id, runId!))
          .limit(1);
        const preserveGate = ['WAITING_APPROVAL', 'PR_CREATED', 'DEPLOYED'].includes(
          String(existingRun?.status || ''),
        );

        await db
          .update(agentRuns)
          .set({
            ...(preserveGate
              ? {}
              : {
                  status: ok ? 'COMPLETED' : 'FAILED',
                  progress: ok ? 100 : 50,
                  completedAt: new Date(),
                }),
            currentStage: preserveGate ? existingRun?.status === 'WAITING_APPROVAL' ? 'WAITING_APPROVAL' : 'PAGE_PARITY' : 'PAGE_PARITY',
            updatedAt: new Date(),
            stateSnapshot: {
              kind: 'page-parity',
              ok,
              phases,
              referencePageId: parity.referencePageId,
              targetPageId: parity.targetPageId,
              previewUrl,
              priorStatus: existingRun?.status,
            },
          })
          .where(eq(agentRuns.id, runId!));

        return reply.status(ok ? 200 : 422).send({
          ok,
          projectId,
          runId,
          branch,
          referencePath: parity.referencePath,
          targetPath: parity.targetPath,
          referencePageId: parity.referencePageId,
          targetPageId: parity.targetPageId,
          referenceUrl: parity.referenceUrl,
          targetUrl: parity.targetUrl,
          writeEtag: parity.writeEtag,
          phases,
          error: ok ? undefined : parity.error || phases.find((p) => p.status === 'FAIL')?.errorMessage,
          hint: body.fixCss
            ? 'css-fix was skipped by API; edit blocks/*.css on the branch or use Cursor for interactive parity'
            : undefined,
        });
      } catch (err) {
        request.log.error({ err }, 'Page parity failed');
        return reply.status(500).send({
          error: 'Page parity failed',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    },
  );

  // GET /api/parity/latest?projectId= — latest parity snapshot from runs
  server.get<{ Querystring: { projectId?: string } }>(
    '/latest',
    {
      schema: {
        tags: ['parity'],
        summary: 'Latest page-parity run snapshot for a project',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const projectId = request.query.projectId;
      if (!projectId) {
        return reply.status(400).send({ error: 'projectId is required' });
      }
      try {
        const rows = await db
          .select()
          .from(agentRuns)
          .where(eq(agentRuns.projectId, projectId))
          .orderBy(desc(agentRuns.createdAt))
          .limit(25);
        const parityRuns = rows.filter((r) => {
          const snap = r.stateSnapshot as { kind?: string } | null;
          return snap?.kind === 'page-parity' || r.currentStage === 'PAGE_PARITY';
        }).slice(0, 5);
        return reply.send({
          projectId,
          runs: parityRuns.map((r) => ({
            id: r.id,
            status: r.status,
            branch: r.branch,
            createdAt: r.createdAt,
            completedAt: r.completedAt,
            snapshot: r.stateSnapshot,
          })),
        });
      } catch (err) {
        request.log.error({ err }, 'Failed to list parity runs');
        return reply.status(500).send({ error: 'Failed to list parity runs' });
      }
    },
  );
};
