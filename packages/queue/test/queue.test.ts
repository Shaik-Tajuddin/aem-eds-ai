import { describe, it, expect } from 'vitest';
import {
  AgentRunJobSchema,
  BrowserTestJobSchema,
  VisualTestJobSchema,
  QUEUE_NAMES,
  getRedisConnectionConfig,
  MockQueue,
} from '../src';

describe('@aeds/queue - Queue Contracts & Dispatcher', () => {
  describe('Job Schemas & Validation', () => {
    it('validates a correct AgentRunJobData payload', () => {
      const payload = {
        runId: '123e4567-e89b-12d3-a456-426614174000',
        projectId: '123e4567-e89b-12d3-a456-426614174001',
        repoOwner: 'adobe',
        repoName: 'aem-boilerplate',
        baseBranch: 'main',
        sourceType: 'FIGMA',
        sourceUrl: 'https://www.figma.com/design/abc123XYZ/My-Site',
      };

      const parsed = AgentRunJobSchema.parse(payload);
      expect(parsed.runId).toBe(payload.runId);
      expect(parsed.iteration).toBe(0);
      expect(parsed.maxIterations).toBe(5);
    });

    it('rejects an invalid AgentRunJobData with malformed UUID or unknown source', () => {
      expect(() => {
        AgentRunJobSchema.parse({
          runId: 'not-a-uuid',
          projectId: '123e4567-e89b-12d3-a456-426614174001',
          repoOwner: 'adobe',
          repoName: 'aem-boilerplate',
          sourceType: 'UNKNOWN_SOURCE',
        });
      }).toThrow();
    });

    it('validates a BrowserTestJobData payload', () => {
      const payload = {
        runId: '123e4567-e89b-12d3-a456-426614174000',
        projectId: '123e4567-e89b-12d3-a456-426614174001',
        previewUrl: 'https://main--site--adobe.hlx.page',
        blockNames: ['hero', 'cards'],
      };

      const parsed = BrowserTestJobSchema.parse(payload);
      expect(parsed.previewUrl).toBe('https://main--site--adobe.hlx.page');
      expect(parsed.viewports).toEqual(['desktop']);
      expect(parsed.auditA11y).toBe(true);
    });

    it('validates a VisualTestJobData payload', () => {
      const payload = {
        runId: '123e4567-e89b-12d3-a456-426614174000',
        projectId: '123e4567-e89b-12d3-a456-426614174001',
        baselineUrl: 'https://www.adobe.com',
        candidateUrl: 'https://main--site--adobe.hlx.page',
      };

      const parsed = VisualTestJobSchema.parse(payload);
      expect(parsed.tolerance).toBe(0.05);
      expect(parsed.viewports).toEqual(['desktop']);
    });
  });

  describe('Redis Connection Configuration', () => {
    it('provides standard BullMQ redis options with exponential retry', () => {
      const config = getRedisConnectionConfig();
      expect(config.maxRetriesPerRequest).toBeNull();
      expect(config.enableReadyCheck).toBe(false);
      expect(typeof config.retryStrategy).toBe('function');

      const delay1 = (config.retryStrategy as (times: number) => number)(1);
      expect(delay1).toBe(100);

      const delay5 = (config.retryStrategy as (times: number) => number)(5);
      expect(delay5).toBe(500);
    });
  });

  describe('MockQueue (Offline & In-Memory Fallback)', () => {
    it('manages job lifecycle and computes accurate queue metrics', async () => {
      const queue = new MockQueue<any>(QUEUE_NAMES.AGENT_RUNS);

      const job = await queue.add('test-job', { foo: 'bar' });
      expect(job.status).toBe('waiting');

      let metrics = await queue.getMetrics();
      expect(metrics.waiting).toBe(1);
      expect(metrics.active).toBe(0);
      expect(metrics.completed).toBe(0);

      // Process job successfully
      const processed = await queue.processNext(async (j) => {
        return { result: `handled-${j.data.foo}` };
      });

      expect(processed?.status).toBe('completed');
      expect(processed?.returnvalue).toEqual({ result: 'handled-bar' });

      metrics = await queue.getMetrics();
      expect(metrics.waiting).toBe(0);
      expect(metrics.completed).toBe(1);
    });

    it('handles job processor failure gracefully', async () => {
      const queue = new MockQueue<any>(QUEUE_NAMES.BROWSER_TESTS);
      await queue.add('failing-job', { fail: true });

      const failedJob = await queue.processNext(async () => {
        throw new Error('Playwright launch timeout');
      });

      expect(failedJob?.status).toBe('failed');
      expect(failedJob?.failedReason).toContain('Playwright launch timeout');

      const metrics = await queue.getMetrics();
      expect(metrics.failed).toBe(1);
    });
  });
});
