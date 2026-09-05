import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '@aeds/database';
import { agentRuns, projects, agentEvents } from '@aeds/database';
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
            status: agentRuns.status,
            source: agentRuns.source,
            progress: agentRuns.progress,
            currentStage: agentRuns.currentStage,
            iteration: agentRuns.iteration,
            maxIterations: agentRuns.maxIterations,
            startedAt: agentRuns.startedAt,
            durationMs: agentRuns.durationMs,
            createdAt: agentRuns.createdAt,
          })
          .from(agentRuns)
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
          source: z.enum(['FIGMA', 'EXISTING_WEBSITE', 'EXISTING_AEM_PAGE', 'EXISTING_EDS_PROJECT', 'SCREENSHOT', 'NATURAL_LANGUAGE']),
          sourceUrl: z.string().url().optional(),
          branch: z.string().optional(),
        });

        const body = StartRunSchema.parse(request.body);

        // Verify project exists
        const [project] = await db
          .select()
          .from(projects)
          .where(eq(projects.id, body.projectId))
          .limit(1);

        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        // Create run record
        const [run] = await db
          .insert(agentRuns)
          .values({
            projectId: body.projectId,
            status: 'RECEIVED',
            source: body.source,
            sourceUrl: body.sourceUrl,
            branch: body.branch,
            progress: 0,
            iteration: 0,
            maxIterations: 5,
            triggeredBy: request.userId ?? undefined,
          })
          .returning();

        if (!run) {
          return reply.code(500).send({ error: 'Failed to create run' });
        }

        const repoOwner = 'adobe';
        const repoName = 'aem-boilerplate';

        // Dispatch to distributed BullMQ queue, or fall back to in-process orchestrator if Redis unavailable
        try {
          await enqueueAgentRun({
            runId: run.id,
            projectId: body.projectId,
            repoOwner,
            repoName,
            baseBranch: body.branch || 'main',
            sourceType: body.source,
            sourceUrl: body.sourceUrl,
            iteration: 0,
            maxIterations: 5,
          });
          request.log.info({ runId: run.id, projectId: body.projectId }, 'Agent run enqueued to BullMQ distributed queue');
        } catch (queueErr) {
          request.log.warn({ err: queueErr, runId: run.id }, 'BullMQ enqueue failed; falling back to local in-process execution');

          const orchestrator = new AgentOrchestrator(run.id);

          orchestrator.onEvent(async (type, payload) => {
            try {
              await db.insert(agentEvents).values({
                runId: run.id,
                projectId: body.projectId,
                type: String(type),
                actor: 'agent',
                step: String(payload['phase'] || payload['step'] || 'pipeline'),
                status: String(payload['status'] || 'running'),
                data: payload,
              });

              // Only update status on actual status changes
              if (payload['status'] && payload['status'] !== 'running') {
                await db
                  .update(agentRuns)
                  .set({ status: payload['status'] as any, updatedAt: new Date() })
                  .where(eq(agentRuns.id, run.id));
              }
            } catch (err) {
              server.log.warn({ err, runId: run.id }, 'Failed to record agent event');
            }
          });

          void orchestrator.execute({
            runId: run.id,
            projectId: body.projectId,
            repoOwner,
            repoName,
            baseBranch: body.branch || 'main',
            sourceType: body.source,
            sourceUrl: body.sourceUrl,
          }).catch((err) => {
            server.log.error({ err, runId: run.id }, 'Agent run pipeline failed');
          });
        }

        request.log.info({ runId: run.id, projectId: body.projectId }, 'Agent run started');

        return reply.code(202).send({
          run: {
            id: run.id,
            status: run.status,
            projectId: run.projectId,
            createdAt: run.createdAt,
          },
          message: 'Autonomous EDS Agent run launched. Stream progress via /api/runs/:id/events.',
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
        const [run] = await db
          .select()
          .from(agentRuns)
          .where(eq(agentRuns.id, id))
          .limit(1);

        if (!run) {
          return reply.code(404).send({ error: 'Run not found' });
        }

        return reply.send({ run });
      } catch (err) {
        request.log.error({ err }, 'Failed to get run');
        return reply.code(500).send({ error: 'Failed to get run' });
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
