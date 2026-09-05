import { Worker } from 'bullmq';
import { QUEUE_NAMES, getRedisConnectionConfig } from '@aeds/queue';
import { processBrowserTestJob } from './processor';

export * from './processor';

export function startBrowserWorker(concurrency = 2): Worker {
  const worker = new Worker(
    QUEUE_NAMES.BROWSER_TESTS,
    async (job) => {
      return processBrowserTestJob(job);
    },
    {
      connection: getRedisConnectionConfig(),
      concurrency,
    }
  );

  worker.on('ready', () => {
    console.log(`[BrowserWorker] Ready and listening on queue "${QUEUE_NAMES.BROWSER_TESTS}" (concurrency: ${concurrency})`);
  });

  worker.on('completed', (job, result) => {
    console.log(`[BrowserWorker] Job ${job.id} finished with success: ${result?.success}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[BrowserWorker] Job ${job?.id} failed:`, err.message);
  });

  const shutdown = async () => {
    console.log('[BrowserWorker] Shutting down cleanly...');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return worker;
}

if (process.env['NODE_ENV'] !== 'test' && require.main === module) {
  startBrowserWorker();
}
