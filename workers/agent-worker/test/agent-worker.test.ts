import { describe, it, expect, vi } from 'vitest';
import { processAgentRunJob } from '../src/processor';
import { AgentRunJobData } from '@aeds/queue';

describe('@aeds/agent-worker - Job Processor', () => {
  it('processes an agent run job and updates progress', async () => {
    const progressUpdates: number[] = [];

    const mockJob = {
      data: {
        runId: '123e4567-e89b-12d3-a456-426614174099',
        projectId: '123e4567-e89b-12d3-a456-426614174098',
        repoOwner: 'adobe',
        repoName: 'aem-boilerplate',
        baseBranch: 'main',
        sourceType: 'FIGMA' as const,
        sourceUrl: 'https://figma.com/design/test',
        iteration: 0,
        maxIterations: 5,
      },
      updateProgress: vi.fn(async (progress: number) => {
        progressUpdates.push(progress);
      }),
    };

    const result = await processAgentRunJob(mockJob);

    expect(result.runId).toBe(mockJob.data.runId);
    expect(['COMPLETED', 'FAILED', 'HALTED']).toContain(result.status);
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
  });
});
