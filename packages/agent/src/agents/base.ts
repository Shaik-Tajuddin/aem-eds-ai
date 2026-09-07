// ============================================================
// @aeds/agent — Base Agent Contract
// Abstract base class for all specialized AI agents in the pipeline
// ============================================================

import type { AgentDecision, AgentEventType, RunStatus, SystemEvidence, EDSArchitectureIR } from '@aeds/shared';
import type { LLMGateway } from '@aeds/llm';
import type { ToolRegistry } from '@aeds/tools';
import type { ReferenceSnapshot } from '../reference-capture.js';

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
  /** AEM author host for MCP/JCR structured capture */
  authorUrl?: string;
  /** Optional MCP pageId when known */
  aemPageId?: string;
  llmGateway: LLMGateway;
  toolRegistry: ToolRegistry;
  generatedFiles: Map<string, GeneratedFile>;
  designTokens?: Record<string, unknown>;
  detectedBlocks?: string[];
  /** Validated Engineering IR from Architecture Agent */
  architectureIR?: EDSArchitectureIR;
  /** Captured HTML/CSS/JS excerpts from the run sourceUrl */
  referenceSnapshot?: ReferenceSnapshot;
  bugs: Array<{ id: string; title: string; severity: string; description: string; resolved?: boolean }>;
  /** System evidence records — never invent PASS without tool output */
  evidence?: SystemEvidence[];
  /** Base64 PNG screenshots from live Playwright audits, keyed by viewport */
  browserScreenshots?: Record<string, string>;
  /** Compact live browser metrics for downstream a11y/perf agents */
  liveBrowserAudit?: Record<
    string,
    {
      a11yViolations: number;
      a11yMode: 'axe' | 'heuristic';
      consoleErrors: number;
      networkErrors: number;
      lcp?: number;
      loadTimeMs: number;
    }
  >;
  /** When true, DeploymentAgent will not call the GitHub API */
  skipGitHubPublish?: boolean;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
  gitCommit?: string;
  previewUrl?: string;
  /** Optional baseline PNG URL for visual comparison */
  visualBaselineUrl?: string;
  log: (message: string, level?: 'info' | 'warn' | 'error') => void;
  /** Emit a structured agent event (persisted to the run timeline / UI). */
  emit: (type: AgentEventType | string, payload?: Record<string, unknown>) => void;
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
