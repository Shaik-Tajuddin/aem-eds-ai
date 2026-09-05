// ============================================================
// @aeds/visual — Types
// ============================================================

import type { VisualValidationResult, VisualDifference, BoundingBox, VisionAnalysis } from '@aeds/shared';

export interface VisualComparisonOptions {
  /**
   * Similarity threshold percentage required to pass (0 to 100, default: 95.0)
   */
  threshold?: number;

  /**
   * Pixelmatch tolerance (0.0 to 1.0, smaller is stricter, default: 0.1)
   */
  diffTolerance?: number;

  /**
   * Whether to include the diff image PNG buffer in result
   */
  generateDiffImage?: boolean;
}

export interface VisualComparisonResult {
  passed: boolean;
  score: number; // 0 to 100 (e.g. 97.8)
  threshold: number;
  totalPixels: number;
  diffPixels: number;
  diffPercentage: number;
  diffImageBuffer?: Buffer;
  differences: VisualDifference[];
}

export type { VisualValidationResult, VisualDifference, BoundingBox, VisionAnalysis };
