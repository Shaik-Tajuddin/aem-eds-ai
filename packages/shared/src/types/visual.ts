// ============================================================
// Visual Validation Types
// ============================================================

export interface VisualValidationResult {
  id: string;
  runId: string;
  iteration: number;
  score: number;         // 0-100
  threshold: number;
  passed: boolean;
  referenceScreenshot: string;   // storage path
  implementationScreenshot: string; // storage path
  diffScreenshot?: string;       // storage path
  differences: VisualDifference[];
  visionAnalysis?: VisionAnalysis;
  timestamp: string;
}

export interface VisualDifference {
  id: string;
  region: BoundingBox;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  category: 'layout' | 'typography' | 'color' | 'spacing' | 'image' | 'content';
  pixelDiffCount?: number;
  percentDiff?: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VisionAnalysis {
  summary: string;
  differences: string[];
  suggestions: string[];
  // result of LLM vision analysis comparing screenshots
}

export interface VisualIterationHistory {
  iterations: VisualIterationRecord[];
  trend: 'improving' | 'stable' | 'degrading';
  finalScore: number;
  finalPassed: boolean;
}

export interface VisualIterationRecord {
  iteration: number;
  score: number;
  passed: boolean;
  timestamp: string;
  fixApplied?: string;
}
