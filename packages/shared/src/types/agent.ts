// ============================================================
// Agent Types
// ============================================================
import type { RunStatus } from '../enums/index.js';

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  runPhase: RunStatus[];
  capabilities: string[];
}

export interface AgentDecision {
  agentId: string;
  runId: string;
  timestamp: string;
  intent: string;
  plan: string[];
  rationale: string;
  // NEVER contains: raw LLM reasoning, chain-of-thought, API keys
}

export interface AgentPlan {
  runId: string;
  steps: AgentPlanStep[];
  estimatedDuration?: number;
  createdAt: string;
}

export interface AgentPlanStep {
  id: string;
  name: string;
  description: string;
  agentId: string;
  dependsOn: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
}

export interface AgentCheckpoint {
  runId: string;
  step: string;
  status: RunStatus;
  stateSnapshot: unknown;
  timestamp: string;
}

export interface AgentLimitStatus {
  runtimeMinutes: number;
  maxRuntimeMinutes: number;
  toolCalls: number;
  maxToolCalls: number;
  llmCalls: number;
  maxLLMCalls: number;
  estimatedCostUsd: number;
  maxEstimatedCostUsd?: number;
  limitReached: boolean;
  limitReason?: string;
}
