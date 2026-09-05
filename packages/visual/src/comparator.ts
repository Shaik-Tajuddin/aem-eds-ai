// ============================================================
// @aeds/visual — Visual Comparator
// Pixel-by-pixel image diffing and difference localization
// ============================================================

import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { VisualError, VisualErrorCode } from './errors.js';
import type {
  VisualComparisonOptions,
  VisualComparisonResult,
  VisualDifference,
  BoundingBox,
} from './types.js';

export class VisualComparator {
  /**
   * Compares a baseline/design reference image with an actual implementation screenshot
   */
  public async compare(
    baselineBuffer: Buffer,
    implementationBuffer: Buffer,
    options?: VisualComparisonOptions
  ): Promise<VisualComparisonResult> {
    const threshold = options?.threshold ?? 95.0;
    const diffTolerance = options?.diffTolerance ?? 0.1;
    const generateDiffImage = options?.generateDiffImage ?? true;

    let img1: PNG;
    let img2: PNG;

    try {
      img1 = PNG.sync.read(baselineBuffer);
    } catch (err: any) {
      throw new VisualError('Failed to parse baseline PNG image buffer', VisualErrorCode.IMAGE_DECODE_FAILED, err);
    }

    try {
      img2 = PNG.sync.read(implementationBuffer);
    } catch (err: any) {
      throw new VisualError('Failed to parse implementation PNG image buffer', VisualErrorCode.IMAGE_DECODE_FAILED, err);
    }

    // Align dimensions if different (scale or pad to max width/height)
    const width = Math.max(img1.width, img2.width);
    const height = Math.max(img1.height, img2.height);

    const normalized1 = this.padImage(img1, width, height);
    const normalized2 = this.padImage(img2, width, height);

    const diff = new PNG({ width, height });

    try {
      const diffPixels = pixelmatch(
        normalized1.data,
        normalized2.data,
        diff.data,
        width,
        height,
        {
          threshold: diffTolerance,
          includeAA: false,
          diffColor: [239, 68, 68], // Red accent #ef4444
        }
      );

      const totalPixels = width * height;
      const diffRatio = diffPixels / totalPixels;
      const similarityScore = Math.max(0, Math.round((1 - diffRatio) * 1000) / 10);
      const diffPercentage = Math.round(diffRatio * 1000) / 10;
      const passed = similarityScore >= threshold;

      let diffImageBuffer: Buffer | undefined;
      if (generateDiffImage) {
        diffImageBuffer = PNG.sync.write(diff);
      }

      // Cluster differences into bounding boxes
      const differences = this.detectDifferences(normalized1, normalized2, width, height, diffTolerance);

      return {
        passed,
        score: similarityScore,
        threshold,
        totalPixels,
        diffPixels,
        diffPercentage,
        diffImageBuffer,
        differences,
      };
    } catch (err: any) {
      throw new VisualError(`Comparison failed: ${err?.message || err}`, VisualErrorCode.COMPARISON_FAILED, err);
    }
  }

  private padImage(source: PNG, targetWidth: number, targetHeight: number): PNG {
    if (source.width === targetWidth && source.height === targetHeight) {
      return source;
    }

    const padded = new PNG({ width: targetWidth, height: targetHeight });
    padded.data.fill(255); // Fill with white background

    // Copy source pixels into padded image
    for (let y = 0; y < source.height; y++) {
      for (let x = 0; x < source.width; x++) {
        const srcIdx = (y * source.width + x) * 4;
        const tgtIdx = (y * targetWidth + x) * 4;

        padded.data[tgtIdx] = source.data[srcIdx];
        padded.data[tgtIdx + 1] = source.data[srcIdx + 1];
        padded.data[tgtIdx + 2] = source.data[srcIdx + 2];
        padded.data[tgtIdx + 3] = source.data[srcIdx + 3];
      }
    }

    return padded;
  }

  private detectDifferences(
    img1: PNG,
    img2: PNG,
    width: number,
    height: number,
    tolerance: number
  ): VisualDifference[] {
    const diffs: VisualDifference[] = [];
    const step = 32; // 32px grid check for bounding box clustering

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        let blockDiffs = 0;
        const w = Math.min(step, width - x);
        const h = Math.min(step, height - y);

        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const dr = Math.abs(img1.data[idx] - img2.data[idx]);
            const dg = Math.abs(img1.data[idx + 1] - img2.data[idx + 1]);
            const db = Math.abs(img1.data[idx + 2] - img2.data[idx + 2]);

            if ((dr + dg + db) / (255 * 3) > tolerance) {
              blockDiffs++;
            }
          }
        }

        if (blockDiffs > 10) {
          const region: BoundingBox = { x, y, width: w, height: h };
          diffs.push({
            id: `diff_${x}_${y}`,
            region,
            description: `Visual variance detected at [x: ${x}, y: ${y}]`,
            severity: blockDiffs > 100 ? 'major' : 'minor',
            category: 'layout',
            pixelDiffCount: blockDiffs,
            percentDiff: Math.round((blockDiffs / (w * h)) * 100),
          });
        }
      }
    }

    return diffs;
  }
}
