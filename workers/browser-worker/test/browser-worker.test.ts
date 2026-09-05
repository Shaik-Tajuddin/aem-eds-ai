import { describe, it, expect, vi } from 'vitest';
import { processBrowserTestJob } from '../src/processor';

describe('@aeds/browser-worker - Job Processor', () => {
  it('processes browser test job and reports results', async () => {
    const progressUpdates: number[] = [];

    const mockJob = {
      data: {
        runId: '123e4567-e89b-12d3-a456-426614174088',
        projectId: '123e4567-e89b-12d3-a456-426614174089',
        previewUrl: 'https://main--site--adobe.hlx.page',
        blockNames: ['hero', 'cards'],
        viewports: ['desktop', 'mobile'] as ('desktop' | 'mobile')[],
        auditA11y: true,
        captureScreenshots: true,
      },
      updateProgress: vi.fn(async (progress: number) => {
        progressUpdates.push(progress);
      }),
    };

    const result = await processBrowserTestJob(mockJob);

    expect(result.runId).toBe(mockJob.data.runId);
    expect(result.success).toBe(true);
    expect(result.decoratedBlocks).toEqual(['hero', 'cards']);
    expect(result.screenshots['desktop']).toBeDefined();
    expect(result.screenshots['mobile']).toBeDefined();
    expect(progressUpdates).toContain(100);
  });
});
