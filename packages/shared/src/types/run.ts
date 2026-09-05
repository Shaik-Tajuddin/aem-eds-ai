import type { RunStatus, SourceType, QualityGateStatus } from '../enums/index.js';
import type { QualityGateName } from './project.js';
import type { QualityGateResult } from './quality-gate.js';

// ============================================================
// Agent Run
// ============================================================
export interface AgentRun {
  id: string;
  projectId: string;
  status: RunStatus;
  source: SourceType;
  sourceUrl?: string;
  branch?: string;
  gitCommit?: string;
  model?: string;
  provider?: string;
  progress: number; // 0-100
  currentStage?: string;
  iteration: number;
  maxIterations: number;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  triggeredBy: string; // userId or 'system'
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Run Summary (for cards / lists)
// ============================================================
export interface RunSummary {
  id: string;
  projectId: string;
  projectName: string;
  status: RunStatus;
  source: SourceType;
  progress: number;
  currentStage?: string;
  iteration: number;
  maxIterations: number;
  testsPassed?: number;
  testsTotal?: number;
  visualScore?: number;
  startedAt?: string;
  durationMs?: number;
}

// ============================================================
// Agent State (persisted for resumability)
// ============================================================
export interface AgentState {
  runId: string;
  projectId: string;
  status: RunStatus;
  checkpoint: string; // last successfully completed step
  project: ProjectStateData;
  source: SourceState;
  design: DesignState;
  eds: EDSState;
  github: GitHubState;
  aem: AEMState;
  universalEditor: UEState;
  implementation: ImplementationState;
  tests: TestState;
  visual: VisualState;
  accessibility: AccessibilityState;
  performance: PerformanceState;
  bugs: BugState[];
  fixes: FixState[];
  deployment: DeploymentState;
  qualityGate: QualityGateState;
  llmUsage: LLMUsage;
  toolCallCount: number;
  updatedAt: string;
}

export interface ProjectStateData {
  name: string;
  repository: string;
  branch?: string;
}

export interface SourceState {
  type: SourceType;
  url?: string;
  analyzed: boolean;
  analysisResult?: unknown;
}

export interface DesignState {
  analyzed: boolean;
  designIR?: unknown;
}

export interface EDSState {
  analyzed: boolean;
  projectStructure?: EDSProjectStructure;
}

export interface EDSProjectStructure {
  blocks: string[];
  existingModels: string[];
  existingDefinitions: string[];
  conventions: Record<string, string>;
}

export interface GitHubState {
  cloned: boolean;
  branch?: string;
  baseCommit?: string;
  headCommit?: string;
  prUrl?: string;
  prNumber?: number;
}

export interface AEMState {
  connected: boolean;
  environment?: string;
}

export interface UEState {
  tested: boolean;
  blocksTestedCount: number;
  fieldsTestedCount: number;
  passed: boolean;
}

export interface ImplementationState {
  blocksGenerated: string[];
  filesChanged: string[];
  buildPassed: boolean;
  previewUrl?: string;
}

export interface TestState {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passed_e2e: boolean;
  passed_unit: boolean;
}

export interface VisualState {
  score?: number;
  passed: boolean;
  iterations: VisualIteration[];
  threshold: number;
}

export interface VisualIteration {
  iteration: number;
  score: number;
  passed: boolean;
  timestamp: string;
}

export interface AccessibilityState {
  score?: number;
  passed: boolean;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

export interface PerformanceState {
  score?: number;
  passed: boolean;
  cls?: number;
  lcp?: number;
  fid?: number;
  fcp?: number;
  ttfb?: number;
}

export interface BugState {
  id: string;
  description: string;
  severity: string;
  category: string;
  affectedFiles: string[];
  fixed: boolean;
  fixAttempts: number;
}

export interface FixState {
  id: string;
  bugId: string;
  iteration: number;
  filesModified: string[];
  passed: boolean;
  timestamp: string;
}

export interface DeploymentState {
  previewDeployed: boolean;
  previewUrl?: string;
  productionDeployed: boolean;
  productionUrl?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface QualityGateState {
  status: QualityGateStatus;
  gates: Record<QualityGateName, QualityGateResult>;
}


export interface LLMUsage {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalLatencyMs: number;
  estimatedCostUsd: number;
  failedRequests: number;
  retries: number;
}
