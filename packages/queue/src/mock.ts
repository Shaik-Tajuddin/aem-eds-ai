import { AgentRunJobData, BrowserTestJobData, QueueMetrics, QueueName } from './types';

export interface MockJob<T = unknown> {
  id: string;
  name: string;
  data: T;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  returnvalue?: unknown;
  failedReason?: string;
  progress: number;
}

export class MockQueue<T = unknown> {
  readonly name: string;
  private jobs: Map<string, MockJob<T>> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  async add(name: string, data: T, opts?: { jobId?: string }): Promise<MockJob<T>> {
    const id = opts?.jobId || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const job: MockJob<T> = {
      id,
      name,
      data,
      status: 'waiting',
      progress: 0,
    };
    this.jobs.set(id, job);
    return job;
  }

  async getJob(id: string): Promise<MockJob<T> | null> {
    return this.jobs.get(id) || null;
  }

  async getJobCounts(): Promise<Record<string, number>> {
    const counts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    for (const job of this.jobs.values()) {
      if (counts[job.status] !== undefined) {
        counts[job.status]++;
      }
    }
    return counts;
  }

  async processNext(handler: (job: MockJob<T>) => Promise<unknown>): Promise<MockJob<T> | null> {
    for (const job of this.jobs.values()) {
      if (job.status === 'waiting') {
        job.status = 'active';
        try {
          const res = await handler(job);
          job.status = 'completed';
          job.returnvalue = res;
          job.progress = 100;
          return job;
        } catch (err) {
          job.status = 'failed';
          job.failedReason = err instanceof Error ? err.message : String(err);
          return job;
        }
      }
    }
    return null;
  }

  async getMetrics(): Promise<QueueMetrics> {
    const counts = await this.getJobCounts();
    return {
      name: this.name,
      waiting: counts['waiting'] || 0,
      active: counts['active'] || 0,
      completed: counts['completed'] || 0,
      failed: counts['failed'] || 0,
      delayed: 0,
      paused: false,
    };
  }

  clear() {
    this.jobs.clear();
  }
}
