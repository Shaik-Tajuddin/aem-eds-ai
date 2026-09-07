import { describe, it, expect, vi } from 'vitest';
import { processBrowserTestJob } from '../src/processor';

describe('@aeds/browser-worker - Job Processor', () => {
  it('fails loudly when Playwright cannot audit the preview URL (no fake success)', async () => {
    const progressUpdates: number[] = [];

    const mockJob = {
      data: {
        runId: '123e4567-e89b-12d3-a456-426614174088',
        projectId: '123e4567-e89b-12d3-a456-426614174089',
        previewUrl: 'https://invalid.example.invalid/does-not-exist',
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
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.decoratedBlocks).toEqual([]);
    expect(result.undecoratedBlocks).toEqual(['hero', 'cards']);
    expect(progressUpdates).toContain(100);
  });
});
