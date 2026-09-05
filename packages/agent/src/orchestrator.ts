// ============================================================
// @aeds/agent — Master Agent Orchestrator
// Coordinates the state machine, specialized agents, resource limits, and events
// ============================================================

import { RunStatus, AgentEventType } from '@aeds/shared';
import type { AgentDecision, AgentLimitStatus } from '@aeds/shared';
import { LLMGateway } from '@aeds/llm';
import { ToolRegistry } from '@aeds/tools';
import { RunStateMachine } from './state-machine.js';
import { BaseAgent, type RunExecutionContext, type GeneratedFile } from './agents/base.js';
import { ProjectAnalyzerAgent } from './agents/project-analyzer.js';
import { ArchitectureAgent } from './agents/architecture-agent.js';
import { EdsDeveloperAgent } from './agents/eds-developer.js';
import { UniversalEditorAgent } from './agents/ue-agent.js';
import { QAValidationAgent } from './agents/qa-agent.js';
import { FixAgent } from './agents/fix-agent.js';
import { DeploymentAgent } from './agents/deployment-agent.js';

export interface OrchestratorRunOptions {
  runId: string;
  projectId: string;
  repoOwner: string;
  repoName: string;
  baseBranch?: string;
  workBranch?: string;
  sourceType: string;
  sourceUrl?: string;
  maxRuntimeMinutes?: number;
  maxLLMCalls?: number;
  maxToolCalls?: number;
  maxCostUsd?: number;
  abortSignal?: AbortSignal;
}

export interface RunEventListener {
  (type: AgentEventType, payload: Record<string, unknown>): void | Promise<void>;
}

export class AgentOrchestrator {
  private stateMachine: RunStateMachine;
  private agents: Map<RunStatus, BaseAgent> = new Map();
  private llmGateway: LLMGateway;
  private toolRegistry: ToolRegistry;
  private eventListeners: RunEventListener[] = [];
  private decisions: AgentDecision[] = [];

  constructor(runId: string, llmGateway?: LLMGateway, toolRegistry?: ToolRegistry) {
    this.stateMachine = new RunStateMachine(runId);
    this.llmGateway = llmGateway || new LLMGateway();
    this.toolRegistry = toolRegistry || new ToolRegistry();

    // Register phase handlers
    this.registerAgent(new ProjectAnalyzerAgent());
    this.registerAgent(new ArchitectureAgent());
    this.registerAgent(new EdsDeveloperAgent());
    this.registerAgent(new UniversalEditorAgent());
    this.registerAgent(new QAValidationAgent());
    this.registerAgent(new FixAgent());
    this.registerAgent(new DeploymentAgent());
  }

  public registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.phase, agent);
  }

  public onEvent(listener: RunEventListener): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  private async emit(type: AgentEventType, payload: Record<string, unknown>): Promise<void> {
    if (this.eventListeners.length === 0) return;
    await Promise.allSettled(
      this.eventListeners.map(async (listener) => {
        try {
          await listener(type, payload);
        } catch (err) {
          console.error('Error in agent event listener:', err);
        }
      })
    );
  }

  /**
   * Executes the autonomous development pipeline from end to end
   */
  public async execute(options: OrchestratorRunOptions): Promise<{
    runId: string;
    finalStatus: RunStatus;
    files: GeneratedFile[];
    decisions: AgentDecision[];
    previewUrl?: string;
  }> {
    const { runId, projectId, repoOwner, repoName } = options;
    const baseBranch = options.baseBranch || 'main';
    const workBranch = options.workBranch || `aeds/run-${runId}`;

    const context: RunExecutionContext = {
      runId,
      projectId,
      repoOwner,
      repoName,
      baseBranch,
      workBranch,
      sourceType: options.sourceType,
      sourceUrl: options.sourceUrl,
      llmGateway: this.llmGateway,
      toolRegistry: this.toolRegistry,
      generatedFiles: new Map(),
      bugs: [],
      log: (msg) => {
        void this.emit(AgentEventType.AGENT_STEP_STARTED, { runId, message: msg });
      },
    };

    await this.emit(AgentEventType.AGENT_STARTED, { runId, projectId, workBranch });

    // Canonical execution sequence
    const pipelineSequence: RunStatus[] = [
      RunStatus.ANALYZING,
      RunStatus.PLANNING,
      RunStatus.IMPLEMENTING,
      RunStatus.BUILDING,
      RunStatus.DEPLOYING_PREVIEW,
      RunStatus.UE_AUTHORING,
      RunStatus.FUNCTIONAL_TESTING,
      RunStatus.VISUAL_VALIDATION,
      RunStatus.ACCESSIBILITY,
      RunStatus.PERFORMANCE,
      RunStatus.QUALITY_GATE,
      RunStatus.PR_CREATED,
    ];

    const startTime = Date.now();

    try {
      for (const targetPhase of pipelineSequence) {
        // Enforce cancellation signal
        if (options.abortSignal?.aborted) {
          throw new Error(`Execution aborted by cancellation signal for run ${runId}`);
        }

        // Enforce runtime timeout limit
        if (options.maxRuntimeMinutes && (Date.now() - startTime) > options.maxRuntimeMinutes * 60 * 1000) {
          throw new Error(`Execution aborted: Max runtime limit of ${options.maxRuntimeMinutes} minute(s) exceeded`);
        }

        if (!this.stateMachine.canTransitionTo(targetPhase)) {
          const currentStatus = this.stateMachine.getStatus();
          if (
            currentStatus === RunStatus.WAITING_APPROVAL ||
            currentStatus === RunStatus.PAUSED ||
            currentStatus === RunStatus.CANCELLED ||
            currentStatus === RunStatus.LIMIT_REACHED
          ) {
            break;
          }
          throw new Error(`Invalid state transition: Cannot transition agent run ${runId} from ${currentStatus} to ${targetPhase}`);
        }

        await this.stateMachine.transition(targetPhase);
        await this.emit(AgentEventType.AGENT_STEP_STARTED, {
          runId,
          phase: targetPhase,
          status: targetPhase,
        });

        const agent = this.agents.get(targetPhase);
        if (agent) {
          const result = await agent.execute(context);
          if (result.decision) {
            this.decisions.push(result.decision);
          }
          if (!result.success) {
            throw new Error(result.error || `Agent ${agent.name} failed at phase ${targetPhase}`);
          }
        }

        await this.emit(AgentEventType.AGENT_STEP_COMPLETED, {
          runId,
          phase: targetPhase,
        });
      }

      const finalStatus = this.stateMachine.getStatus();

      if (finalStatus === RunStatus.PR_CREATED) {
        await this.emit(AgentEventType.AGENT_COMPLETED, {
          runId,
          filesGenerated: Array.from(context.generatedFiles.keys()),
          status: finalStatus,
        });
      }

      // Format RFC 1123 compliant preview URL (sanitize slashes/underscores for DNS subdomains)
      const cleanBranch = workBranch.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const cleanRepo = repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const cleanOwner = repoOwner.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const previewUrl = `https://${cleanBranch}--${cleanRepo}--${cleanOwner}.hlx.page/`;

      return {
        runId,
        finalStatus,
        files: Array.from(context.generatedFiles.values()),
        decisions: this.decisions,
        previewUrl,
      };
    } catch (err: any) {
      try {
        if (this.stateMachine.canTransitionTo(RunStatus.FAILED)) {
          await this.stateMachine.transition(RunStatus.FAILED, err?.message);
        }
      } catch (smErr) {
        console.warn('Failed to transition state machine to FAILED:', smErr);
      }
      await this.emit(AgentEventType.AGENT_FAILED, {
        runId,
        error: err?.message || 'Agent pipeline execution failed',
      });
      throw err;
    }
  }
}
