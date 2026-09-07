import { Worker } from 'bullmq';
import { QUEUE_NAMES, getRedisConnectionConfig } from '@aeds/queue';
import { processTestJob } from './processor';

export * from './processor';

export function startTestWorker(concurrency = 1): Worker {
  const worker = new Worker(QUEUE_NAMES.TEST_JOBS, async (job) => processTestJob(job), {
    connection: getRedisConnectionConfig(),
    concurrency,
  });

  worker.on('ready', () => {
    console.log(`[TestWorker] Ready on "${QUEUE_NAMES.TEST_JOBS}"`);
  });
  worker.on('completed', (job, result) => {
    console.log(`[TestWorker] Job ${job.id} success=${result?.success}`);
  });
  worker.on('failed', (job, err) => {
    console.error(`[TestWorker] Job ${job?.id} failed:`, err.message);
  });

  const shutdown = async () => {
    await worker.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return worker;
}

if (process.env['NODE_ENV'] !== 'test' && require.main === module) {
  startTestWorker();
}
