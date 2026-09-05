// ============================================================
// @aeds/agent — Base Agent Contract
// Abstract base class for all specialized AI agents in the pipeline
// ============================================================

import type { AgentDecision, RunStatus } from '@aeds/shared';
import type { LLMGateway } from '@aeds/llm';
import type { ToolRegistry } from '@aeds/tools';

export interface GeneratedFile {
  path: string;
  content: string;
  operation: 'create' | 'modify' | 'delete';
}

export interface RunExecutionContext {
  runId: string;
  projectId: string;
  repoOwner: string;
  repoName: string;
  baseBranch: string;
  workBranch: string;
  sourceType: string;
  sourceUrl?: string;
  llmGateway: LLMGateway;
  toolRegistry: ToolRegistry;
  generatedFiles: Map<string, GeneratedFile>;
  designTokens?: Record<string, unknown>;
  detectedBlocks?: string[];
  bugs: Array<{ id: string; title: string; severity: string; description: string; resolved?: boolean }>;
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
}

export interface AgentExecutionResult {
  success: boolean;
  decision: AgentDecision;
  filesGenerated?: string[];
  error?: string;
}

export abstract class BaseAgent {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly phase: RunStatus;

  public abstract execute(context: RunExecutionContext): Promise<AgentExecutionResult>;

  protected createDecision(
    context: RunExecutionContext,
    intent: string,
    plan: string[],
    rationale: string
  ): AgentDecision {
    return {
      agentId: this.id,
      runId: context.runId,
      timestamp: new Date().toISOString(),
      intent,
      plan,
      rationale,
    };
  }
}
