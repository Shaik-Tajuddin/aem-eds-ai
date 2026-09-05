import type { BugSeverity, BugCategory } from '../enums/index.js';
import type { AxeViolation } from './testing.js';

// ============================================================
// Bug & Fix Types
// ============================================================

export interface Bug {
  id: string;
  runId: string;
  title: string;
  description: string;
  severity: BugSeverity;
  category: BugCategory;
  source: BugSource;
  evidence: BugEvidence;
  rootCause?: string;
  affectedFiles: string[];
  status: 'open' | 'fixing' | 'fixed' | 'wont-fix';
  fixAttempts: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface BugSource {
  type: 'playwright' | 'visual' | 'accessibility' | 'performance' | 'build' | 'lint';
  testName?: string;
  toolCall?: string;
}

export interface BugEvidence {
  screenshotPath?: string;
  consoleLogs?: string[];
  networkErrors?: NetworkError[];
  axeViolations?: AxeViolation[];
  lighthouseAudits?: string[];
  diffScreenshotPath?: string;
  stackTrace?: string;
}

export interface NetworkError {
  url: string;
  status?: number;
  error?: string;
}


export interface FixAttempt {
  id: string;
  bugId: string;
  runId: string;
  iteration: number;
  diagnosis: string;
  proposedFix: string;
  filesModified: string[];
  buildPassed?: boolean;
  testsPassed?: boolean;
  visualScore?: number;
  regressionPassed?: boolean;
  succeeded: boolean;
  timestamp: string;
}
