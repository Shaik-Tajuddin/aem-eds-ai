import { describe, it, expect } from 'vitest';
import { VisualComparator, VisualError, VisualErrorCode } from '../src/index.js';
import { PNG } from 'pngjs';

function createSolidPng(width: number, height: number, r: number, g: number, b: number): Buffer {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

describe('Visual Comparator', () => {
  const comparator = new VisualComparator();

  it('reports 100% match for identical images', async () => {
    const img1 = createSolidPng(100, 100, 15, 17, 23); // #0f1117
    const img2 = createSolidPng(100, 100, 15, 17, 23);

    const result = await comparator.compare(img1, img2, { threshold: 95.0 });

    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.diffPixels).toBe(0);
    expect(result.diffPercentage).toBe(0);
    expect(result.differences.length).toBe(0);
  });

  it('detects differences and generates diff overlay', async () => {
    const img1 = createSolidPng(100, 100, 15, 17, 23);
    const img2 = createSolidPng(100, 100, 255, 255, 255); // Completely white

    const result = await comparator.compare(img1, img2, { threshold: 95.0 });

    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(50);
    expect(result.diffPixels).toBeGreaterThan(0);
    expect(result.diffImageBuffer).toBeDefined();
    expect(result.differences.length).toBeGreaterThan(0);
  });

  it('handles image decoding error gracefully', async () => {
    const invalidBuffer = Buffer.from('not a valid png image buffer');
    const validImg = createSolidPng(50, 50, 0, 0, 0);

    await expect(comparator.compare(invalidBuffer, validImg)).rejects.toThrow(VisualError);
  });
});
