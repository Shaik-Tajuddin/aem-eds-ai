export interface PerformanceBudget {
  maxJsBytes?: number;
  maxCssBytes?: number;
  maxLcpMs?: number;
  minScore?: number;
}

export interface PerformanceAuditResult {
  mode: 'static-budget' | 'lighthouse' | 'unavailable';
  passed: boolean;
  summary: string;
  metrics: Record<string, number>;
  actionable: string[];
}
