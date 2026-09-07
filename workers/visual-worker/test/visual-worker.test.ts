import { describe, it, expect } from 'vitest';
import { PNG } from 'pngjs';
import { VisualComparator } from '@aeds/visual';
import { processVisualTestJob } from '../src/processor';

function solidPng(color: [number, number, number, number], w = 32, h = 32): Buffer {
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    png.data[idx] = color[0];
    png.data[idx + 1] = color[1];
    png.data[idx + 2] = color[2];
    png.data[idx + 3] = color[3];
  }
  return PNG.sync.write(png);
}

describe('@aeds/visual-worker', () => {
  it('comparator passes identical images (unit path used by worker)', async () => {
    const buf = solidPng([10, 20, 30, 255]);
    const result = await new VisualComparator().compare(buf, buf, { threshold: 95 });
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
  });

  it('job processor returns failed score when URLs are unreachable (no fake PASS)', async () => {
    const result = await processVisualTestJob({
      data: {
        runId: '123e4567-e89b-12d3-a456-426614174088',
        projectId: '123e4567-e89b-12d3-a456-426614174089',
        baselineUrl: 'https://invalid.example.invalid/baseline.png',
        candidateUrl: 'https://invalid.example.invalid/candidate.png',
        viewports: ['desktop'],
        tolerance: 0.05,
      },
      updateProgress: async () => {},
    });

    expect(result.passed).toBe(false);
    expect(result.matchScore).toBe(0);
  });
});
