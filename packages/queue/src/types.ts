import { z } from 'zod';

export const QUEUE_NAMES = {
  AGENT_RUNS: 'agent-runs',
  BROWSER_TESTS: 'browser-tests',
  VISUAL_TESTS: 'visual-tests',
  BUILD_JOBS: 'build-jobs',
  TEST_JOBS: 'test-jobs',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

// ─── AGENT RUN JOB CONTRACT ──────────────────────────────────────────────────

export const AgentRunJobSchema = z.object({
  runId: z.string().uuid(),
  projectId: z.string().uuid(),
  repoOwner: z.string(),
  repoName: z.string(),
  baseBranch: z.string().default('main'),
  sourceType: z.enum([
    'FIGMA',
    'EXISTING_WEBSITE',
    'EXISTING_AEM_PAGE',
    'EXISTING_EDS_PROJECT',
    'SCREENSHOT',
    'NATURAL_LANGUAGE',
  ]),
  sourceUrl: z.string().optional(),
  /** AEM author host for MCP/JCR structured capture */
  authorUrl: z.string().optional(),
  /** Optional Adobe MCP pageId */
  aemPageId: z.string().optional(),
  iteration: z.number().int().default(0),
  maxIterations: z.number().int().default(5),
  metadata: z.record(z.unknown()).optional(),
});

export type AgentRunJobData = z.infer<typeof AgentRunJobSchema>;

export interface AgentRunJobResult {
  runId: string;
  status: 'COMPLETED' | 'FAILED' | 'HALTED';
  finalStage: string;
  pullRequestUrl?: string;
  previewUrl?: string;
  iterationsCompleted: number;
  totalDurationMs: number;
  error?: string;
}

// ─── BROWSER TEST JOB CONTRACT ───────────────────────────────────────────────

export const BrowserTestJobSchema = z.object({
  runId: z.string().uuid(),
  projectId: z.string().uuid(),
  previewUrl: z.string().url(),
  blockNames: z.array(z.string()).default([]),
  viewports: z.array(z.enum(['mobile', 'tablet', 'desktop'])).default(['desktop']),
  auditA11y: z.boolean().default(true),
  captureScreenshots: z.boolean().default(true),
});

export type BrowserTestJobData = z.infer<typeof BrowserTestJobSchema>;

export interface BrowserTestJobResult {
  runId: string;
  success: boolean;
  decoratedBlocks: string[];
  undecoratedBlocks: string[];
  consoleErrorsCount: number;
  a11yViolationsCount: number;
  screenshots: Record<string, string>;
  durationMs: number;
  error?: string;
}

// ─── VISUAL TEST JOB CONTRACT ────────────────────────────────────────────────

export const VisualTestJobSchema = z.object({
  runId: z.string().uuid(),
  projectId: z.string().uuid(),
  baselineUrl: z.string().url(),
  candidateUrl: z.string().url(),
  viewports: z.array(z.enum(['mobile', 'tablet', 'desktop'])).default(['desktop']),
  tolerance: z.number().min(0).max(1).default(0.05),
});

export type VisualTestJobData = z.infer<typeof VisualTestJobSchema>;

export interface VisualTestJobResult {
  runId: string;
  matchScore: number;
  passed: boolean;
  diffPixelsCount: number;
  diffImagePath?: string;
  durationMs: number;
}

// ─── BUILD JOB CONTRACT ──────────────────────────────────────────────────────

export const BuildJobSchema = z.object({
  runId: z.string().uuid(),
  projectId: z.string().uuid(),
  workDir: z.string().min(1),
  commands: z.array(z.string()).default(['npm run build:json', 'npm run lint:js']),
  timeoutMs: z.number().int().positive().default(300_000),
});

export type BuildJobData = z.infer<typeof BuildJobSchema>;

export interface BuildJobResult {
  runId: string;
  success: boolean;
  commands: Array<{ command: string; exitCode: number; stdout: string; stderr: string; durationMs: number }>;
  durationMs: number;
  error?: string;
}

// ─── TEST JOB CONTRACT ───────────────────────────────────────────────────────

export const TestJobSchema = z.object({
  runId: z.string().uuid(),
  projectId: z.string().uuid(),
  workDir: z.string().min(1),
  commands: z.array(z.string()).default(['npm test']),
  timeoutMs: z.number().int().positive().default(600_000),
});

export type TestJobData = z.infer<typeof TestJobSchema>;

export interface TestJobResult {
  runId: string;
  success: boolean;
  commands: Array<{ command: string; exitCode: number; stdout: string; stderr: string; durationMs: number }>;
  durationMs: number;
  error?: string;
}

// ─── QUEUE METRICS ───────────────────────────────────────────────────────────

export interface QueueMetrics {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}
