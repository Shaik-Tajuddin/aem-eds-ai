import { Worker } from 'bullmq';
import { QUEUE_NAMES, getRedisConnectionConfig } from '@aeds/queue';
import { processVisualTestJob } from './processor';

export * from './processor';

export function startVisualWorker(concurrency = 1): Worker {
  const worker = new Worker(
    QUEUE_NAMES.VISUAL_TESTS,
    async (job) => processVisualTestJob(job),
    {
      connection: getRedisConnectionConfig(),
      concurrency,
    },
  );

  worker.on('ready', () => {
    console.log(`[VisualWorker] Ready on queue "${QUEUE_NAMES.VISUAL_TESTS}" (concurrency: ${concurrency})`);
  });

  worker.on('completed', (job, result) => {
    console.log(`[VisualWorker] Job ${job.id} passed=${result?.passed} score=${result?.matchScore}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[VisualWorker] Job ${job?.id} failed:`, err.message);
  });

  const shutdown = async () => {
    console.log('[VisualWorker] Shutting down...');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return worker;
}

if (process.env['NODE_ENV'] !== 'test' && require.main === module) {
  startVisualWorker();
}
