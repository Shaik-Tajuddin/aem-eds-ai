import { Worker } from 'bullmq';
import { QUEUE_NAMES, getRedisConnectionConfig } from '@aeds/queue';
import { processAgentRunJob } from './processor';

export * from './processor';

export function startAgentWorker(concurrency = 3): Worker {
  const worker = new Worker(
    QUEUE_NAMES.AGENT_RUNS,
    async (job) => {
      return processAgentRunJob(job);
    },
    {
      connection: getRedisConnectionConfig(),
      concurrency,
    }
  );

  worker.on('ready', () => {
    console.log(`[AgentWorker] Ready and listening on queue "${QUEUE_NAMES.AGENT_RUNS}" (concurrency: ${concurrency})`);
  });

  worker.on('completed', (job, result) => {
    console.log(`[AgentWorker] Job ${job.id} completed successfully in ${result?.totalDurationMs}ms`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[AgentWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[AgentWorker] Worker error:', err.message);
  });

  const shutdown = async () => {
    console.log('[AgentWorker] Shutting down cleanly...');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return worker;
}

// Automatically start if executed as main module
if (process.env['NODE_ENV'] !== 'test' && require.main === module) {
  startAgentWorker();
}
