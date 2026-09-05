import { Queue, JobsOptions, Job } from 'bullmq';
import {
  QUEUE_NAMES,
  QueueName,
  AgentRunJobData,
  AgentRunJobSchema,
  BrowserTestJobData,
  BrowserTestJobSchema,
  VisualTestJobData,
  VisualTestJobSchema,
  QueueMetrics,
} from './types';
import { getRedisConnectionConfig } from './connection';

const queues = new Map<string, Queue>();

export function getQueue<T = unknown>(name: QueueName): Queue<T> {
  let queue = queues.get(name) as Queue<T> | undefined;

  if (!queue) {
    queue = new Queue<T>(name, {
      connection: getRedisConnectionConfig(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 24 * 3600, // keep completed for 24h
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // keep failed for 7d
        },
      },
    });

    queues.set(name, queue as unknown as Queue);
  }

  return queue;
}

/**
 * Enqueues an autonomous agent run to the distributed `agent-runs` queue.
 */
export async function enqueueAgentRun(
  data: AgentRunJobData,
  options?: JobsOptions
): Promise<Job<AgentRunJobData>> {
  // Validate schema before enqueueing
  const validated = AgentRunJobSchema.parse(data);
  const queue = getQueue<AgentRunJobData>(QUEUE_NAMES.AGENT_RUNS);

  return queue.add(`run-${validated.runId}`, validated, {
    jobId: validated.runId, // deduplicate identical run jobs
    priority: 1,
    ...options,
  });
}

/**
 * Enqueues a browser validation test to the `browser-tests` queue.
 */
export async function enqueueBrowserTest(
  data: BrowserTestJobData,
  options?: JobsOptions
): Promise<Job<BrowserTestJobData>> {
  const validated = BrowserTestJobSchema.parse(data);
  const queue = getQueue<BrowserTestJobData>(QUEUE_NAMES.BROWSER_TESTS);

  return queue.add(`browser-${validated.runId}`, validated, {
    jobId: `browser-${validated.runId}`,
    priority: 2,
    ...options,
  });
}

/**
 * Enqueues a visual regression comparison to the `visual-tests` queue.
 */
export async function enqueueVisualTest(
  data: VisualTestJobData,
  options?: JobsOptions
): Promise<Job<VisualTestJobData>> {
  const validated = VisualTestJobSchema.parse(data);
  const queue = getQueue<VisualTestJobData>(QUEUE_NAMES.VISUAL_TESTS);

  return queue.add(`visual-${validated.runId}`, validated, {
    jobId: `visual-${validated.runId}`,
    priority: 3,
    ...options,
  });
}

/**
 * Retrieves real-time health and count metrics for a queue.
 */
export async function getQueueMetrics(name: QueueName): Promise<QueueMetrics> {
  try {
    const queue = getQueue(name);
    const countsPromise = queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
    const isPausedPromise = queue.isPaused();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Queue metrics timeout')), 500)
    );

    const [counts, isPaused] = await Promise.race([
      Promise.all([countsPromise, isPausedPromise]),
      timeoutPromise,
    ]);

    return {
      name,
      waiting: counts['waiting'] || 0,
      active: counts['active'] || 0,
      completed: counts['completed'] || 0,
      failed: counts['failed'] || 0,
      delayed: counts['delayed'] || 0,
      paused: isPaused,
    };
  } catch {
    return {
      name,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: false,
    };
  }
}

/**
 * Retrieves metrics across all platform queues.
 */
export async function getAllQueueMetrics(): Promise<QueueMetrics[]> {
  const names: QueueName[] = [
    QUEUE_NAMES.AGENT_RUNS,
    QUEUE_NAMES.BROWSER_TESTS,
    QUEUE_NAMES.VISUAL_TESTS,
  ];

  return Promise.all(names.map((name) => getQueueMetrics(name)));
}

/**
 * Cleanly closes all queue connections (useful for test tear down and server shutdown).
 */
export async function closeAllQueues(): Promise<void> {
  for (const [name, queue] of queues.entries()) {
    try {
      await queue.close();
    } catch {
      // ignore
    }
  }
  queues.clear();
}
