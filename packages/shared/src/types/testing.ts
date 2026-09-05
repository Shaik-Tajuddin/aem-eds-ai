// ============================================================
// Testing Types
// ============================================================

export type TestType = 'unit' | 'e2e' | 'accessibility' | 'performance' | 'visual' | 'ue';

export interface TestRun {
  id: string;
  runId: string;
  type: TestType;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs?: number;
  startedAt?: string;
  completedAt?: string;
  results: TestResult[];
}

export interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs?: number;
  errorMessage?: string;
  screenshot?: string;
  retries?: number;
}

export interface AccessibilityRun {
  id: string;
  runId: string;
  url: string;
  status: 'passed' | 'failed';
  score: number;
  violations: AxeViolation[];
  passes: number;
  incomplete: number;
  timestamp: string;
}

export interface PerformanceRun {
  id: string;
  runId: string;
  url: string;
  status: 'passed' | 'failed';
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  cls?: number;
  lcp?: number;
  fcp?: number;
  ttfb?: number;
  tbt?: number;
  timestamp: string;
}

export interface AxeViolation {
  id: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  nodes: number;
  helpUrl: string;
}
