import { Job } from 'bullmq';
import { AgentRunJobData, AgentRunJobResult } from '@aeds/queue';
import { AgentOrchestrator } from '@aeds/agent';
import { getDatabase, agentRuns, agentEvents } from '@aeds/database';
import { eq } from '@aeds/database';

export async function processAgentRunJob(
  job: Pick<Job<AgentRunJobData>, 'data' | 'updateProgress'>
): Promise<AgentRunJobResult> {
  const { data } = job;
  const startTime = Date.now();

  let db: ReturnType<typeof getDatabase> | null = null;
  try {
    db = getDatabase();
  } catch {
    // Offline or test environment without database
  }

  // 1. Update run status to RUNNING in database
  if (db) {
    try {
      await db
        .update(agentRuns)
        .set({
          status: 'ANALYZING',
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(agentRuns.id, data.runId));
    } catch (err) {
      console.warn('[AgentWorker] Failed to update initial run status in database:', err);
    }
  }

  // 2. Instantiate orchestrator
  const orchestrator = new AgentOrchestrator(data.runId);

  // 3. Pipe orchestrator events to DB and BullMQ progress
  orchestrator.onEvent(async (type, payload) => {
    try {
      const step = String(payload['phase'] || payload['step'] || 'pipeline');
      const status = String(payload['status'] || 'running');
      const progress = typeof payload['progress'] === 'number' ? payload['progress'] : undefined;

      if (progress !== undefined) {
        await job.updateProgress(progress);
      }

      if (db) {
        await db.insert(agentEvents).values({
          runId: data.runId,
          projectId: data.projectId,
          type: String(type),
          actor: 'agent',
          step,
          status,
          data: payload,
        });

        if (payload['status']) {
          await db
            .update(agentRuns)
            .set({
              status: payload['status'] as any,
              progress: progress ?? undefined,
              updatedAt: new Date(),
            })
            .where(eq(agentRuns.id, data.runId));
        }
      }
    } catch (err) {
      console.warn('[AgentWorker] Event recording error:', err);
    }
  });

  // 4. Execute the autonomous pipeline
  try {
    const result = await orchestrator.execute({
      runId: data.runId,
      projectId: data.projectId,
      repoOwner: data.repoOwner,
      repoName: data.repoName,
      baseBranch: data.baseBranch,
      sourceType: data.sourceType,
      sourceUrl: data.sourceUrl,
    });

    const durationMs = Date.now() - startTime;

    // Mark as completed in DB
    if (db) {
      try {
        await db
          .update(agentRuns)
          .set({
            status: 'COMPLETED',
            progress: 100,
            durationMs,
            updatedAt: new Date(),
          })
          .where(eq(agentRuns.id, data.runId));
      } catch (err) {
        console.warn('[AgentWorker] Failed to update completed status:', err);
      }
    }

    return {
      runId: data.runId,
      status: (result.finalStatus as any) === 'COMPLETED' ? 'COMPLETED' : 'HALTED',
      finalStage: 'DEPLOYMENT_COMPLETE',
      pullRequestUrl: `https://github.com/${data.repoOwner}/${data.repoName}/pull/1`,
      previewUrl: result.previewUrl || `https://preview--${data.repoName}--${data.repoOwner}.aem.page`,
      iterationsCompleted: data.iteration || 1,
      totalDurationMs: durationMs,
    };
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Record failure in DB
    if (db) {
      try {
        await db
          .update(agentRuns)
          .set({
            status: 'FAILED',
            durationMs,
            updatedAt: new Date(),
          })
          .where(eq(agentRuns.id, data.runId));

        await db.insert(agentEvents).values({
          runId: data.runId,
          projectId: data.projectId,
          type: 'RUN_FAILED',
          actor: 'system',
          step: 'pipeline',
          status: 'failed',
          data: { error: errorMessage },
        });
      } catch (dbErr) {
        console.warn('[AgentWorker] Failed to record failure state:', dbErr);
      }
    }

    return {
      runId: data.runId,
      status: 'FAILED',
      finalStage: 'ERROR',
      iterationsCompleted: 0,
      totalDurationMs: durationMs,
      error: errorMessage,
    };
  }
}
