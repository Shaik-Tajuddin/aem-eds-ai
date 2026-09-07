import { Worker } from 'bullmq';
import { QUEUE_NAMES, getRedisConnectionConfig } from '@aeds/queue';
import { processBuildJob } from './processor';

export * from './processor';

export function startBuildWorker(concurrency = 1): Worker {
  const worker = new Worker(QUEUE_NAMES.BUILD_JOBS, async (job) => processBuildJob(job), {
    connection: getRedisConnectionConfig(),
    concurrency,
  });

  worker.on('ready', () => {
    console.log(`[BuildWorker] Ready on "${QUEUE_NAMES.BUILD_JOBS}"`);
  });
  worker.on('completed', (job, result) => {
    console.log(`[BuildWorker] Job ${job.id} success=${result?.success}`);
  });
  worker.on('failed', (job, err) => {
    console.error(`[BuildWorker] Job ${job?.id} failed:`, err.message);
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
  startBuildWorker();
}
