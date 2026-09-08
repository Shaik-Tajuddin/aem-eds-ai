import postgres from 'postgres';
import fs from 'fs';
import { AgentOrchestrator } from '../packages/agent/dist/index.mjs';

const env = fs.readFileSync('.env', 'utf8');
const connectionString = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim() || 'postgresql://aeds:aeds_password@localhost:5432/aeds_dev';
const sql = postgres(connectionString);

async function main() {
  const runId = '3fc5edce-1c5b-4a1e-982d-3078e588e00f';
  console.log(`[E2E Runner] Starting Antigravity Orchestrator for run: ${runId}`);

  const [run] = await sql`SELECT * FROM agent_runs WHERE id = ${runId}`;
  if (!run) {
    throw new Error(`Run ${runId} not found in database`);
  }

  // Reset run to ANALYZING status
  await sql`
    UPDATE agent_runs
    SET status = 'ANALYZING',
        current_stage = 'Antigravity Autonomous Planning',
        progress = 10,
        started_at = NOW(),
        completed_at = NULL
    WHERE id = ${runId}
  `;

  const orchestrator = new AgentOrchestrator(runId);

  // Hook event listener to persist to agent_events table
  orchestrator.onEvent(async (type, payload) => {
    const step = String(payload?.phase || payload?.step || 'pipeline');
    const status = String(payload?.status || 'running');
    console.log(`[Event: ${type}] Step: ${step} -`, payload?.message || payload?.thought || payload?.status || '');

    try {
      await sql`
        INSERT INTO agent_events (
          run_id, project_id, type, actor, step, status, data, timestamp
        ) VALUES (
          ${runId}, ${run.project_id}, ${String(type)}, 'agent', ${step}, ${status}, ${sql.json(payload || {})}, NOW()
        )
      `;
    } catch (e) {
      console.warn('[Event Save Error]:', e.message);
    }
  });

  const startTime = Date.now();

  try {
    const result = await orchestrator.execute({
      runId,
      projectId: run.project_id,
      repoOwner: 'Shaik-Tajuddin',
      repoName: 'wknd-eds',
      baseBranch: 'dev',
      workBranch: 'dev-v2',
      sourceType: run.source,
      sourceUrl: run.source_url,
      authorUrl: 'https://author-p149251-e1522049.adobeaemcloud.com',
      engine: 'default',
      skipGitHubPublish: false,
    });

    console.log(`[E2E Runner] Execution completed with status: ${result.finalStatus}`);

    await sql`
      UPDATE agent_runs
      SET status = ${result.finalStatus},
          progress = 100,
          current_stage = ${String(result.finalStatus)},
          completed_at = NOW(),
          duration_ms = ${Date.now() - startTime},
          updated_at = NOW()
      WHERE id = ${runId}
    `;

    console.log('[E2E Runner] Database updated successfully.');
  } catch (err) {
    console.error('[E2E Runner Error]:', err);
    await sql`
      UPDATE agent_runs
      SET status = 'FAILED',
          current_stage = 'Failed',
          completed_at = NOW(),
          duration_ms = ${Date.now() - startTime},
          updated_at = NOW()
      WHERE id = ${runId}
    `;
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
