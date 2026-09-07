// ============================================================
// @aeds/browser — Types
// ============================================================

import type { AxeViolation, PerformanceRun } from '@aeds/shared';

export type ViewportName = 'desktop' | 'tablet' | 'mobile';

export interface ViewportConfig {
  width: number;
  height: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

export const VIEWPORT_PRESETS: Record<ViewportName, ViewportConfig> = {
  desktop: { width: 1440, height: 900, isMobile: false, hasTouch: false },
  tablet: { width: 768, height: 1024, isMobile: true, hasTouch: true },
  mobile: { width: 375, height: 812, isMobile: true, hasTouch: true },
};

export interface BrowserLaunchConfig {
  headless?: boolean;
  browserType?: 'chromium' | 'firefox' | 'webkit';
  timeoutMs?: number;
}

export interface ConsoleLogEntry {
  type: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
  location?: string;
  timestamp: string;
}

export interface NetworkErrorEntry {
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  errorText?: string;
  timestamp: string;
}

export interface EdsDomSummary {
  sectionsCount: number;
  blocksCount: number;
  detectedBlocks: Array<{
    name: string;
    classes: string[];
    isDecorated: boolean;
  }>;
  hasMain: boolean;
  hasHeader: boolean;
  hasFooter: boolean;
}

export interface PageAuditResult {
  url: string;
  viewport: ViewportName;
  statusCode: number;
  title: string;
  loadTimeMs: number;
  consoleLogs: ConsoleLogEntry[];
  networkErrors: NetworkErrorEntry[];
  domSummary: EdsDomSummary;
  screenshotBase64?: string;
  screenshotPath?: string;
  a11yViolations: AxeViolation[];
  /** How a11y was produced — never claim axe when heuristics were used */
  a11yMode?: 'axe' | 'heuristic';
  performanceMetrics?: Partial<PerformanceRun>;
}
