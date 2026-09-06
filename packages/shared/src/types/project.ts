import type { ProjectHealth, SourceType } from '../enums/index.js';

// ============================================================
// Project
// ============================================================
export interface Project {
  id: string;
  name: string;
  description?: string;
  health: ProjectHealth;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
}

// ============================================================
// Project Configuration (non-secret portions)
// ============================================================
export interface ProjectConfig {
  projectId: string;
  source: SourceConfig;
  github: GitHubConfig;
  aem: AEMConfig;
  figma?: FigmaConfig;
  quality: QualityConfig;
  limits: AgentLimits;
}

export interface SourceConfig {
  type: SourceType;
  url?: string;
}

export interface GitHubConfig {
  repository: string; // owner/repo
  defaultBranch: string;
  // token stored encrypted in DB — never in this type
}

export interface AEMConfig {
  authorUrl: string;
  previewUrl: string;
  environment: string;
  /** Root or default JCR page path in AEM Cloud (e.g. '/content/mysite/us/en') */
  authoringPath?: string;
  // credentials stored encrypted in DB — never in this type
}

export interface FigmaConfig {
  fileUrl: string;
  nodeId?: string;
  // token stored encrypted in DB — never in this type
}

export interface LLMConfig {
  provider: string;
  apiUrl?: string;
  model: string;
  embeddingModel?: string;
  // API key stored encrypted in DB — never in this type
}

export interface QualityConfig {
  visualThreshold: number;       // default: 95
  accessibilityThreshold: number; // default: 95
  performanceThreshold: number;   // default: 90
  maxFixIterations: number;       // default: 5
  requiredGates: QualityGateName[];
}

export type QualityGateName =
  | 'build'
  | 'lint'
  | 'typecheck'
  | 'unit'
  | 'e2e'
  | 'universal-editor'
  | 'functional'
  | 'visual'
  | 'accessibility'
  | 'performance';

export interface AgentLimits {
  maxRuntimeMinutes: number;   // default: 30
  maxToolCalls: number;        // default: 250
  maxLLMCalls: number;         // default: 100
  maxEstimatedCostUsd?: number;
}

// ============================================================
// Project Statistics (for dashboard)
// ============================================================
export interface ProjectStats {
  projectId: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  activeRuns: number;
  successRate: number;
  avgVisualScore: number;
  avgRunTimeMinutes: number;
  avgFixIterations: number;
  lastRunAt?: string;
}
