import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '@aeds/database';
import { agentRuns, projects, agentEvents, repositories, pullRequests, projectConfigs, environments, persistUsageFromAgentEvent, persistPendingToolApproval, ueAuthoringTests, listPendingFromSnapshot } from '@aeds/database';
import { eq, desc, and, notInArray } from '@aeds/database';
import { AgentOrchestrator, resolveReferenceSourceUrl } from '@aeds/agent';
import { enqueueAgentRun, getAllQueueMetrics } from '@aeds/queue';
import {
  abortAllRuns,
  abortRun,
  clearRunAbort,
  PAUSE_ALL_SKIP_STATUSES,
  registerRunAbort,
} from '../services/run-abort.js';
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

        const [configRow] = await db
          .select()
          .from(projectConfigs)
          .where(eq(projectConfigs.projectId, body.projectId))
          .limit(1);

        const [envRow] = await db
          .select()
          .from(environments)
          .where(eq(environments.projectId, body.projectId))
          .limit(1);

        const resolvedRef = resolveReferenceSourceUrl({
          requestedUrl: body.sourceUrl,
          projectSourceUrl: configRow?.sourceUrl,
          authorUrl: envRow?.authorUrl,
          authoringPath: envRow?.authoringPath,
        });
        const referenceSourceUrl = resolvedRef?.url || body.sourceUrl;

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
            sourceUrl: referenceSourceUrl,
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

        if (resolvedRef && body.sourceUrl && resolvedRef.url !== body.sourceUrl) {
          await db.insert(agentEvents).values({
            runId: run.id,
            projectId: body.projectId,
            type: 'agent.step.started',
            actor: 'system',
            step: 'RECEIVED',
            status: 'RECEIVED',
            data: {
              phase: 'RECEIVED',
              status: 'RECEIVED',
              message: `Reference URL corrected: ${resolvedRef.reason}. Using ${resolvedRef.url} (not authoring URL ${body.sourceUrl}).`,
              requestedSourceUrl: body.sourceUrl,
              referenceSourceUrl: resolvedRef.url,
            },
          }).catch(() => null);
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

          try {
            await persistUsageFromAgentEvent(db, run.id, String(type), payload);
          } catch (err) {
            server.log.warn({ err, runId: run.id }, 'Failed to persist usage telemetry');
          }

          if (String(type) === 'tool.approval_required' && typeof payload.callId === 'string') {
            try {
              await persistPendingToolApproval(db, {
                callId: String(payload.callId),
                toolName: String(payload.toolName || 'unknown'),
                namespace: String(payload.namespace || 'unknown'),
                riskLevel: String(payload.riskLevel || 'unknown'),
                runId: run.id,
                projectId: body.projectId,
                input:
                  typeof payload.input === 'object' && payload.input
                    ? (payload.input as Record<string, unknown>)
                    : {},
                sanitizedInput:
                  typeof payload.sanitizedInput === 'object' && payload.sanitizedInput
                    ? (payload.sanitizedInput as Record<string, unknown>)
                    : {},
                createdAt: String(payload.createdAt || new Date().toISOString()),
                reason: typeof payload.reason === 'string' ? payload.reason : undefined,
              });
            } catch (err) {
              server.log.warn({ err, runId: run.id }, 'Failed to persist pending tool approval');
            }
          }

          if (status && status !== 'running') {
            try {
              // Never overwrite an explicit pause/cancel with in-flight stage progress
              await db
                .update(agentRuns)
                .set({
                  status: status as any,
                  currentStage,
                  ...(progress !== undefined ? { progress } : {}),
                  updatedAt: new Date(),
                })
                .where(
                  and(
                    eq(agentRuns.id, run.id),
                    notInArray(agentRuns.status, ['PAUSED', 'CANCELLED']),
                  ),
                );
            } catch (err) {
              server.log.warn({ err, runId: run.id }, 'Failed to update run progress');
            }
          }
        };

        const executeInProcess = () => {
          const abortSignal = registerRunAbort(run.id);
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
              sourceUrl: referenceSourceUrl,
              authorUrl: envRow?.authorUrl || process.env.AEM_AUTHOR_URL || undefined,
              maxFixIterations: body.maxIterations,
              abortSignal,
            })
            .then(async (result) => {
              clearRunAbort(run.id);
              // If paused mid-flight, keep PAUSED instead of overwriting with a later stage
              if (abortSignal.aborted) {
                return;
              }
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
              clearRunAbort(run.id);
              if (abortSignal.aborted) {
                server.log.info({ runId: run.id }, 'Agent run aborted (paused)');
                return;
              }
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
              sourceUrl: referenceSourceUrl,
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

        const ueTests = await db
          .select()
          .from(ueAuthoringTests)
          .where(eq(ueAuthoringTests.runId, id))
          .limit(100);

        const pendingToolApprovals = listPendingFromSnapshot(run.stateSnapshot).map((p) => ({
          callId: p.callId,
          toolName: p.toolName,
          riskLevel: p.riskLevel,
          createdAt: p.createdAt,
          reason: p.reason,
        }));

        return reply.send({
          run: {
            ...run,
            pullRequestUrl: pr?.url ?? null,
            pullRequestNumber: pr?.prNumber ?? null,
            pullRequestTitle: pr?.title ?? null,
            pullRequestStatus: pr?.status ?? null,
            previewUrl:
              (pr?.evidenceSummary as { previewUrl?: string } | null)?.previewUrl ?? null,
            ueAuthoringTests: ueTests,
            pendingToolApprovals,
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

  // POST /api/runs/pause-all — pause every non-terminal in-flight run
  server.post(
    '/pause-all',
    {
      schema: {
        tags: ['runs'],
        summary: 'Pause all active agent runs',
        security: [{ bearerAuth: [] }],
      },
      // Allow POST with empty body (browsers often omit Content-Type)
      config: { rawBody: false },
    },
    async (_request, reply) => {
      try {
        const active = await db
          .select({
            id: agentRuns.id,
            status: agentRuns.status,
            stateSnapshot: agentRuns.stateSnapshot,
          })
          .from(agentRuns)
          .where(notInArray(agentRuns.status, [...PAUSE_ALL_SKIP_STATUSES]));

        const pausedAt = new Date().toISOString();
        const pausedIds: string[] = [];

        for (const run of active) {
          const snapshot = {
            ...(typeof run.stateSnapshot === 'object' && run.stateSnapshot
              ? (run.stateSnapshot as Record<string, unknown>)
              : {}),
            pausedAt,
            statusBeforePause: run.status,
            pausedVia: 'pause-all',
          };
          await db
            .update(agentRuns)
            .set({
              status: 'PAUSED',
              currentStage: 'Paused',
              stateSnapshot: snapshot,
              updatedAt: new Date(),
            })
            .where(eq(agentRuns.id, run.id));
          abortRun(run.id);
          pausedIds.push(run.id);
        }

        // Also abort any in-process runs that may not have been selected (race)
        abortAllRuns();

        return reply.send({
          message: pausedIds.length
            ? `Paused ${pausedIds.length} agent run(s)`
            : 'No active agent runs to pause',
          pausedCount: pausedIds.length,
          pausedIds,
        });
      } catch (err) {
        _request.log.error({ err }, 'Failed to pause all runs');
        return reply.code(500).send({ error: 'Failed to pause all runs' });
      }
    },
  );

  // POST /api/runs/:id/pause
  server.post<{ Params: { id: string } }>(
    '/:id/pause',
    { schema: { tags: ['runs'], summary: 'Pause run', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { id } = request.params;
      const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, id)).limit(1);
      if (!run) return reply.status(404).send({ error: 'Run not found' });

      if (PAUSE_ALL_SKIP_STATUSES.includes(run.status as (typeof PAUSE_ALL_SKIP_STATUSES)[number])) {
        return reply.status(409).send({
          error: `Run status ${run.status} cannot be paused`,
          hint: 'Only in-progress runs can be paused',
        });
      }

      const snapshot = {
        ...(typeof run.stateSnapshot === 'object' && run.stateSnapshot ? run.stateSnapshot : {}),
        pausedAt: new Date().toISOString(),
        statusBeforePause: run.status,
      };
      await db
        .update(agentRuns)
        .set({
          status: 'PAUSED',
          currentStage: 'Paused',
          stateSnapshot: snapshot,
          updatedAt: new Date(),
        })
        .where(eq(agentRuns.id, id));
      abortRun(id);
      return reply.send({ message: 'Run paused', stateSnapshot: snapshot });
    }
  );

  // POST /api/runs/:id/resume — restore from state_snapshot and re-enqueue / re-run
  server.post<{ Params: { id: string } }>(
    '/:id/resume',
    { schema: { tags: ['runs'], summary: 'Resume a paused or failed run from checkpoint', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const { id } = request.params;
      const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, id)).limit(1);
      if (!run) return reply.status(404).send({ error: 'Run not found' });

      if (String(run.status) === 'WAITING_APPROVAL') {
        return reply.status(409).send({
          error: 'WAITING_APPROVAL runs must use approve-deployment or reject-deployment',
          hint: 'POST /api/runs/:id/approve-deployment or POST /api/runs/:id/reject-deployment',
        });
      }

      const resumable = ['PAUSED', 'FAILED', 'LIMIT_REACHED'].includes(String(run.status));
      if (!resumable) {
        return reply.status(409).send({
          error: `Run status ${run.status} is not resumable`,
          hint: 'Only PAUSED, FAILED, or LIMIT_REACHED runs can be resumed',
        });
      }

      const snapshot =
        typeof run.stateSnapshot === 'object' && run.stateSnapshot
          ? (run.stateSnapshot as Record<string, unknown>)
          : {};
      const resumeStatus =
        typeof snapshot.statusBeforePause === 'string'
          ? snapshot.statusBeforePause
          : 'ANALYZING';

      const [repo] = await db
        .select()
        .from(repositories)
        .where(eq(repositories.projectId, run.projectId))
        .limit(1);

      const fullName = repo?.fullName || 'adobe/aem-boilerplate';
      const [repoOwner, ...rest] = fullName.split('/');
      const repoName = rest.join('/') || 'aem-boilerplate';

      const nextSnapshot = {
        ...snapshot,
        resumedAt: new Date().toISOString(),
        resumeCount: Number(snapshot.resumeCount || 0) + 1,
      };

      await db
        .update(agentRuns)
        .set({
          status: resumeStatus as any,
          stateSnapshot: nextSnapshot,
          completedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(agentRuns.id, id));

      let enqueueError: string | undefined;
      try {
        await enqueueAgentRun({
          runId: id,
          projectId: run.projectId,
          repoOwner: repoOwner || 'adobe',
          repoName,
          baseBranch: repo?.defaultBranch || 'main',
          sourceType: (run.source as any) || 'NATURAL_LANGUAGE',
          sourceUrl: run.sourceUrl || undefined,
          iteration: Number(run.iteration || 0),
          maxIterations: Number(run.maxIterations || 5),
          metadata: { resumeFrom: resumeStatus, ...nextSnapshot },
        });
      } catch (err: any) {
        enqueueError = err?.message || String(err);
      }

      return reply.send({
        message: enqueueError
          ? 'Run checkpoint restored; queue enqueue failed (worker may be offline)'
          : 'Run resumed from checkpoint and re-enqueued',
        status: resumeStatus,
        stateSnapshot: nextSnapshot,
        enqueueError,
      });
    }
  );

  // POST /api/runs/:id/approve-deployment — human gate: WAITING_APPROVAL → DEPLOYED
  server.post<{
    Params: { id: string };
    Body: { mergePullRequest?: boolean; note?: string; mergeMethod?: 'merge' | 'squash' | 'rebase' };
  }>(
    '/:id/approve-deployment',
    {
      schema: {
        tags: ['runs'],
        summary: 'Approve production deployment after WAITING_APPROVAL (optional GitHub merge)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body || {};
      const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, id)).limit(1);
      if (!run) return reply.status(404).send({ error: 'Run not found' });

      if (String(run.status) !== 'WAITING_APPROVAL') {
        return reply.status(409).send({
          error: `Run status ${run.status} cannot be approved for deployment`,
          hint: 'Only WAITING_APPROVAL runs can be approved',
        });
      }

      const [repo] = await db
        .select()
        .from(repositories)
        .where(eq(repositories.projectId, run.projectId))
        .limit(1);
      const [pr] = await db
        .select()
        .from(pullRequests)
        .where(eq(pullRequests.runId, id))
        .limit(1);

      const fullName = repo?.fullName || '';
      const [repoOwner, ...rest] = fullName.split('/');
      const repoName = rest.join('/') || '';

      const evidence: Array<{
        kind: string;
        status: 'PASS' | 'FAIL' | 'SKIPPED' | 'UNAVAILABLE';
        summary: string;
      }> = [];

      let mergeResult: { merged?: boolean; sha?: string; message?: string; url?: string } | undefined;
      const wantMerge = body.mergePullRequest === true;

      if (wantMerge) {
        if (process.env.ENABLE_GITHUB_MERGE === 'false') {
          evidence.push({
            kind: 'github_merge',
            status: 'SKIPPED',
            summary: 'Merge requested but ENABLE_GITHUB_MERGE=false',
          });
        } else if (!pr?.prNumber || !repoOwner || !repoName) {
          evidence.push({
            kind: 'github_merge',
            status: 'UNAVAILABLE',
            summary: 'No pull request number / repository recorded for this run — cannot merge',
          });
          return reply.status(409).send({
            error: 'Cannot merge: missing PR number or repository metadata',
            evidence,
          });
        } else {
          try {
            const { createDefaultToolRegistry } = await import('@aeds/agent');
            const registry = createDefaultToolRegistry();
            const { result, record } = await registry.execute(
              'github.mergePR',
              {
                owner: repoOwner,
                repo: repoName,
                pullNumber: pr.prNumber,
                mergeMethod: body.mergeMethod || 'squash',
              },
              {
                runId: id,
                projectId: run.projectId,
                forceApprove: true,
              },
            );

            if (!result.success) {
              evidence.push({
                kind: 'github_merge',
                status: 'FAIL',
                summary: result.error || 'github.mergePR failed',
              });
              await db.insert(agentEvents).values({
                runId: id,
                projectId: run.projectId,
                type: 'human.approval_merge_failed',
                actor: 'user',
                step: 'WAITING_APPROVAL',
                status: 'FAIL',
                data: { evidence, toolCall: record, note: body.note },
              });
              return reply.status(502).send({
                error: result.error || 'GitHub merge failed',
                evidence,
                status: 'WAITING_APPROVAL',
              });
            }

            mergeResult = result.data as typeof mergeResult;
            const merged = Boolean(mergeResult?.merged);
            evidence.push({
              kind: 'github_merge',
              status: merged ? 'PASS' : 'FAIL',
              summary: mergeResult?.message || (merged ? `Merged PR #${pr.prNumber}` : 'Merge returned merged=false'),
            });

            if (!merged) {
              await db.insert(agentEvents).values({
                runId: id,
                projectId: run.projectId,
                type: 'human.approval_merge_failed',
                actor: 'user',
                step: 'WAITING_APPROVAL',
                status: 'FAIL',
                data: { evidence, mergeResult, note: body.note },
              });
              return reply.status(502).send({
                error: 'GitHub did not merge the pull request',
                evidence,
                mergeResult,
                status: 'WAITING_APPROVAL',
              });
            }

            await db
              .update(pullRequests)
              .set({
                status: 'merged',
                mergedAt: new Date(),
                approvedAt: new Date(),
              })
              .where(eq(pullRequests.id, pr.id));
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            evidence.push({ kind: 'github_merge', status: 'FAIL', summary: message });
            return reply.status(502).send({
              error: message,
              evidence,
              status: 'WAITING_APPROVAL',
            });
          }
        }
      } else {
        evidence.push({
          kind: 'github_merge',
          status: 'SKIPPED',
          summary: 'Human approved deployment without requesting GitHub merge (mergePullRequest=false)',
        });
      }

      evidence.push({
        kind: 'deployment_approval',
        status: 'PASS',
        summary: body.note?.trim()
          ? `Human approved production gate: ${body.note.trim()}`
          : 'Human approved production gate (WAITING_APPROVAL → DEPLOYED)',
      });

      const snapshot = {
        ...(typeof run.stateSnapshot === 'object' && run.stateSnapshot
          ? (run.stateSnapshot as Record<string, unknown>)
          : {}),
        approvedAt: new Date().toISOString(),
        approvalNote: body.note || null,
        mergeRequested: wantMerge,
        mergeResult: mergeResult || null,
        approvalEvidence: evidence,
      };

      await db
        .update(agentRuns)
        .set({
          status: 'DEPLOYED',
          currentStage: 'DEPLOYED',
          progress: 100,
          completedAt: new Date(),
          updatedAt: new Date(),
          stateSnapshot: snapshot,
        })
        .where(eq(agentRuns.id, id));

      if (pr && !wantMerge) {
        await db
          .update(pullRequests)
          .set({ approvedAt: new Date() })
          .where(eq(pullRequests.id, pr.id));
      }

      await db.insert(agentEvents).values({
        runId: id,
        projectId: run.projectId,
        type: 'human.deployment_approved',
        actor: 'user',
        step: 'DEPLOYED',
        status: 'PASS',
        data: {
          evidence,
          pullRequestUrl: pr?.url,
          pullRequestNumber: pr?.prNumber,
          mergeResult: mergeResult || null,
          note: body.note || null,
        },
      });

      return reply.send({
        message: 'Deployment approved',
        status: 'DEPLOYED',
        evidence,
        mergeResult: mergeResult || null,
        pullRequest: pr
          ? { number: pr.prNumber, url: pr.url, status: wantMerge ? 'merged' : pr.status }
          : null,
      });
    },
  );

  // POST /api/runs/:id/reject-deployment — human gate: WAITING_APPROVAL → CANCELLED
  server.post<{
    Params: { id: string };
    Body: { reason?: string };
  }>(
    '/:id/reject-deployment',
    {
      schema: {
        tags: ['runs'],
        summary: 'Reject production deployment (WAITING_APPROVAL → CANCELLED)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const reason = request.body?.reason?.trim() || 'Rejected by human reviewer';
      const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, id)).limit(1);
      if (!run) return reply.status(404).send({ error: 'Run not found' });

      if (String(run.status) !== 'WAITING_APPROVAL') {
        return reply.status(409).send({
          error: `Run status ${run.status} cannot be rejected for deployment`,
          hint: 'Only WAITING_APPROVAL runs can be rejected',
        });
      }

      const evidence = [
        {
          kind: 'deployment_approval',
          status: 'FAIL' as const,
          summary: reason,
        },
      ];

      const snapshot = {
        ...(typeof run.stateSnapshot === 'object' && run.stateSnapshot
          ? (run.stateSnapshot as Record<string, unknown>)
          : {}),
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
        approvalEvidence: evidence,
      };

      await db
        .update(agentRuns)
        .set({
          status: 'CANCELLED',
          currentStage: 'CANCELLED',
          completedAt: new Date(),
          updatedAt: new Date(),
          stateSnapshot: snapshot,
        })
        .where(eq(agentRuns.id, id));

      await db.insert(agentEvents).values({
        runId: id,
        projectId: run.projectId,
        type: 'human.deployment_rejected',
        actor: 'user',
        step: 'CANCELLED',
        status: 'FAIL',
        data: { evidence, reason },
      });

      return reply.send({
        message: 'Deployment rejected',
        status: 'CANCELLED',
        evidence,
      });
    },
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
