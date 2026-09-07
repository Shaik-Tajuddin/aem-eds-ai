import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '@aeds/database';
import { agentRuns, projects, agentEvents, repositories, pullRequests } from '@aeds/database';
import { eq, desc, and } from '@aeds/database';
import { AgentOrchestrator } from '@aeds/agent';
import { enqueueAgentRun, getAllQueueMetrics } from '@aeds/queue';
export const runsPlugin: FastifyPluginAsync = async (server) => {
  const db = getDatabase();

  // GET /api/runs — list agent runs (optionally filtered by project)
  server.get<{ Querystring: { projectId?: string; status?: string; limit?: string } }>(
    '/',
    {
      schema: {
        tags: ['runs'],
        summary: 'List agent runs',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { projectId, status, limit = '50' } = request.query;

        const conditions = [];
        if (projectId) {
          conditions.push(eq(agentRuns.projectId, projectId));
        }
        if (status) {
          conditions.push(eq(agentRuns.status, status as any));
        }

        const query = db
          .select({
            id: agentRuns.id,
            projectId: agentRuns.projectId,
            projectName: projects.name,
            status: agentRuns.status,
            source: agentRuns.source,
            sourceUrl: agentRuns.sourceUrl,
            branch: agentRuns.branch,
            progress: agentRuns.progress,
            currentStage: agentRuns.currentStage,
            iteration: agentRuns.iteration,
            maxIterations: agentRuns.maxIterations,
            startedAt: agentRuns.startedAt,
            durationMs: agentRuns.durationMs,
            createdAt: agentRuns.createdAt,
          })
          .from(agentRuns)
          .leftJoin(projects, eq(projects.id, agentRuns.projectId))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(agentRuns.createdAt))
          .limit(Math.min(Number(limit), 200));

        const rows = await query;

        return reply.send({ runs: rows });
      } catch (err) {
        request.log.error({ err }, 'Failed to list runs');
        return reply.code(500).send({ error: 'Failed to list runs' });
      }
    }
  );

  // POST /api/runs — start a new agent run
  server.post(
    '/',
    {
      schema: {
        tags: ['runs'],
        summary: 'Start agent run',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const StartRunSchema = z.object({
          projectId: z.string().uuid(),
          source: z.enum([
            'FIGMA',
            'EXISTING_WEBSITE',
            'EXISTING_AEM_PAGE',
            'EXISTING_EDS_PROJECT',
            'SCREENSHOT',
            'NATURAL_LANGUAGE',
            // UI aliases normalized below
            'AEM_PAGE',
            'PROMPT',
          ]),
          sourceUrl: z.string().url().optional(),
          branch: z.string().optional(),
          maxIterations: z.number().int().min(1).max(10).optional(),
          visualThreshold: z.number().min(0).max(100).optional(),
          taskTitle: z.string().max(500).optional(),
        });

        const raw = StartRunSchema.parse(request.body);
        const sourceAliases: Record<string, string> = {
          AEM_PAGE: 'EXISTING_AEM_PAGE',
          PROMPT: 'NATURAL_LANGUAGE',
        };
        const body = {
          ...raw,
          source: (sourceAliases[raw.source] ?? raw.source) as
            | 'FIGMA'
            | 'EXISTING_WEBSITE'
            | 'EXISTING_AEM_PAGE'
            | 'EXISTING_EDS_PROJECT'
            | 'SCREENSHOT'
            | 'NATURAL_LANGUAGE',
          maxIterations: raw.maxIterations ?? 5,
        };

        // Verify project exists + load linked GitHub repo
        const [project] = await db
          .select()
          .from(projects)
          .where(eq(projects.id, body.projectId))
          .limit(1);

        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        const [repoRow] = await db
          .select()
          .from(repositories)
          .where(eq(repositories.projectId, body.projectId))
          .limit(1);

        const fullName = repoRow?.fullName || 'adobe/aem-boilerplate';
        const [repoOwner, ...repoNameParts] = fullName.split('/');
        const repoName = repoNameParts.join('/') || 'aem-boilerplate';
        const branch = body.branch || repoRow?.defaultBranch || 'main';

        // Create run record
        const [run] = await db
          .insert(agentRuns)
          .values({
            projectId: body.projectId,
            status: 'RECEIVED',
            source: body.source,
            sourceUrl: body.sourceUrl,
            branch,
            progress: 0,
            iteration: 0,
            maxIterations: body.maxIterations,
            startedAt: new Date(),
            currentStage: body.taskTitle ? `Received: ${body.taskTitle}` : 'Received',
            triggeredBy: request.userId ?? undefined,
          })
          .returning();

        if (!run) {
          return reply.code(500).send({ error: 'Failed to create run' });
        }

        const startTime = Date.now();

        const persistEvent = async (type: string, payload: Record<string, unknown>) => {
          const phase = String(payload['phase'] || payload['step'] || 'pipeline');
          const status = String(payload['status'] || phase || 'running');
          const progress =
            typeof payload['progress'] === 'number' ? (payload['progress'] as number) : undefined;
          const currentStage =
            typeof payload['currentStage'] === 'string'
              ? (payload['currentStage'] as string)
              : phase;

          try {
            await db.insert(agentEvents).values({
              runId: run.id,
              projectId: body.projectId,
              type: String(type),
              actor: 'agent',
              step: phase,
              status,
              data: payload,
            });
          } catch (err) {
            server.log.warn({ err, runId: run.id }, 'Failed to record agent event');
          }

          if (status && status !== 'running') {
            try {
              await db
                .update(agentRuns)
                .set({
                  status: status as any,
                  currentStage,
                  ...(progress !== undefined ? { progress } : {}),
                  updatedAt: new Date(),
                })
                .where(eq(agentRuns.id, run.id));
            } catch (err) {
              server.log.warn({ err, runId: run.id }, 'Failed to update run progress');
            }
          }
        };

        const executeInProcess = () => {
          const orchestrator = new AgentOrchestrator(run.id, undefined, undefined, body.maxIterations);
          orchestrator.onEvent(async (type, payload) => {
            await persistEvent(String(type), payload);
          });

          void orchestrator
            .execute({
              runId: run.id,
              projectId: body.projectId,
              repoOwner: repoOwner || 'adobe',
              repoName,
              baseBranch: branch,
              sourceType: body.source,
              sourceUrl: body.sourceUrl,
              maxFixIterations: body.maxIterations,
            })
            .then(async (result) => {
              await db
                .update(agentRuns)
                .set({
                  status: result.finalStatus as any,
                  progress: 100,
                  currentStage: String(result.finalStatus),
                  durationMs: Date.now() - startTime,
                  completedAt: new Date(),
                  updatedAt: new Date(),
                  ...(result.gitCommit ? { gitCommit: result.gitCommit } : {}),
                })
                .where(eq(agentRuns.id, run.id));

              if (result.pullRequestUrl) {
                try {
                  await db.insert(pullRequests).values({
                    runId: run.id,
                    projectId: body.projectId,
                    provider: 'github',
                    prNumber: result.pullRequestNumber,
                    title: `feat(aeds): EDS pipeline run ${run.id.slice(0, 8)}`,
                    body: result.previewUrl ? `Preview: ${result.previewUrl}` : undefined,
                    url: result.pullRequestUrl,
                    headBranch: `aeds/run-${run.id}`,
                    baseBranch: branch,
                    status: 'open',
                    evidenceSummary: {
                      previewUrl: result.previewUrl,
                      files: result.files.map((f) => f.path),
                    },
                  });
                } catch (prErr) {
                  server.log.warn({ err: prErr, runId: run.id }, 'Failed to persist pull request record');
                }
              }
            })
            .catch(async (err) => {
              server.log.error({ err, runId: run.id }, 'Agent run pipeline failed');
              await db
                .update(agentRuns)
                .set({
                  status: 'FAILED',
                  currentStage: 'Failed',
                  durationMs: Date.now() - startTime,
                  completedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(agentRuns.id, run.id));
            });
        };

        // Default: run in-process so local UI always sees stage progress.
        // Set USE_BULLMQ_RUNS=true to prefer the worker queue instead.
        const preferQueue = process.env['USE_BULLMQ_RUNS'] === 'true';
        let queued = false;
        if (preferQueue) {
          try {
            await enqueueAgentRun({
              runId: run.id,
              projectId: body.projectId,
              repoOwner: repoOwner || 'adobe',
              repoName,
              baseBranch: branch,
              sourceType: body.source,
              sourceUrl: body.sourceUrl,
              iteration: 0,
              maxIterations: body.maxIterations,
            });
            queued = true;
            request.log.info({ runId: run.id }, 'Agent run enqueued to BullMQ');
          } catch (queueErr) {
            request.log.warn({ err: queueErr, runId: run.id }, 'BullMQ enqueue failed; using in-process execution');
          }
        }

        if (!queued) {
          executeInProcess();
          request.log.info({ runId: run.id }, 'Agent run started in-process');
        }

        request.log.info({ runId: run.id, projectId: body.projectId }, 'Agent run started');

        return reply.code(202).send({
          run: {
            id: run.id,
            status: run.status,
            projectId: run.projectId,
            currentStage: run.currentStage,
            progress: run.progress,
            createdAt: run.createdAt,
          },
          message: 'Autonomous EDS Agent run launched. Poll GET /api/runs/:id for stage progress.',
        });

      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Validation failed', details: err.errors });
        }
        request.log.error({ err }, 'Failed to start run');
        return reply.code(500).send({ error: 'Failed to start run' });
      }
    }
  );

  // GET /api/runs/queues/metrics — get real-time BullMQ queue metrics
  server.get(
    '/queues/metrics',
    {
      schema: {
        tags: ['runs'],
        summary: 'Get BullMQ queue health and metrics',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const metrics = await getAllQueueMetrics();
        return reply.send({ queues: metrics });
      } catch (err) {
        request.log.warn({ err }, 'Failed to fetch queue metrics');
        return reply.send({
          queues: [
            { name: 'agent-runs', waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: false },
            { name: 'browser-tests', waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: false },
            { name: 'visual-tests', waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: false },
          ],
        });
      }
    }
  );


  // GET /api/runs/:id — get run detail
  server.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['runs'],
        summary: 'Get run detail',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        if (!z.string().uuid().safeParse(id).success) {
          return reply.code(404).send({ error: 'Run not found' });
        }
        const [run] = await db
          .select()
          .from(agentRuns)
          .where(eq(agentRuns.id, id))
          .limit(1);

        if (!run) {
          return reply.code(404).send({ error: 'Run not found' });
        }

        const [pr] = await db
          .select()
          .from(pullRequests)
          .where(eq(pullRequests.runId, id))
          .limit(1);

        return reply.send({
          run: {
            ...run,
            pullRequestUrl: pr?.url ?? null,
            pullRequestNumber: pr?.prNumber ?? null,
            pullRequestTitle: pr?.title ?? null,
            pullRequestStatus: pr?.status ?? null,
            previewUrl:
              (pr?.evidenceSummary as { previewUrl?: string } | null)?.previewUrl ?? null,
          },
        });
      } catch (err) {
        request.log.error({ err }, 'Failed to get run');
        return reply.code(500).send({ error: 'Failed to get run' });
      }
    }
  );

  // GET /api/runs/:id/events — historical agent events for a run (JSON, not SSE)
  server.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    '/:id/events',
    {
      schema: {
        tags: ['runs'],
        summary: 'List agent events for a run',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        if (!z.string().uuid().safeParse(id).success) {
          return reply.code(404).send({ error: 'Run not found' });
        }
        const limit = Math.min(Number(request.query.limit || 200), 500);
        const events = await db
          .select({
            id: agentEvents.id,
            runId: agentEvents.runId,
            type: agentEvents.type,
            actor: agentEvents.actor,
            step: agentEvents.step,
            status: agentEvents.status,
            data: agentEvents.data,
            timestamp: agentEvents.timestamp,
          })
          .from(agentEvents)
          .where(eq(agentEvents.runId, id))
          .orderBy(desc(agentEvents.timestamp))
          .limit(limit);

        // Return chronological for UI timeline
        return reply.send({ events: events.reverse() });
      } catch (err) {
        request.log.error({ err }, 'Failed to list run events');
        return reply.code(500).send({ error: 'Failed to list run events' });
      }
    }
  );

  // POST /api/runs/:id/pause
  server.post<{ Params: { id: string } }>(
    '/:id/pause',
    { schema: { tags: ['runs'], summary: 'Pause run', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { id } = request.params;
      await db.update(agentRuns).set({ status: 'PAUSED' }).where(eq(agentRuns.id, id));
      return reply.send({ message: 'Run paused' });
    }
  );

  // POST /api/runs/:id/cancel
  server.post<{ Params: { id: string } }>(
    '/:id/cancel',
    { schema: { tags: ['runs'], summary: 'Cancel run', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { id } = request.params;
      await db
        .update(agentRuns)
        .set({ status: 'CANCELLED', completedAt: new Date() })
        .where(eq(agentRuns.id, id));
      return reply.send({ message: 'Run cancelled' });
    }
  );
};
