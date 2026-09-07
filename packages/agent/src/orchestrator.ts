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
import { BuildValidationAgent } from './agents/build-agent.js';
import {
  VisualValidationAgent,
  AccessibilityAgent,
  PerformanceAgent,
  QualityGateAgent,
} from './agents/validation-agents.js';
import {
  PIPELINE_STAGE_ORDER,
  PIPELINE_STAGE_LABELS,
  stageProgressPercent,
} from './pipeline-stages.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface OrchestratorRunOptions {
  runId: string;
  projectId: string;
  repoOwner: string;
  repoName: string;
  baseBranch?: string;
  workBranch?: string;
  sourceType: string;
  sourceUrl?: string;
  /** AEM author host for MCP/JCR structured capture */
  authorUrl?: string;
  /** Optional MCP pageId when known */
  aemPageId?: string;
  maxRuntimeMinutes?: number;
  maxLLMCalls?: number;
  maxToolCalls?: number;
  maxCostUsd?: number;
  maxFixIterations?: number;
  abortSignal?: AbortSignal;
  /** Skip real GitHub branch/commit/PR (used in unit tests) */
  skipGitHubPublish?: boolean;
}

export interface RunEventListener {
  (type: AgentEventType, payload: Record<string, unknown>): void | Promise<void>;
}

function createLlmGatewayFromEnv(): LLMGateway {
  const providerId = LLMGateway.normalizeProviderId(process.env.LLM_PROVIDER);
  const apiUrl = process.env.LLM_API_URL;
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  const model = process.env.LLM_MODEL || 'gpt-4o';
  const maxTokens = Number(process.env.LLM_MAX_TOKENS || 8000);
  const temperature = Number(process.env.LLM_TEMPERATURE || 0.2);

  const providerConfig = {
    provider: providerId,
    apiUrl,
    model,
    embeddingModel: process.env.LLM_EMBEDDING_MODEL || process.env.EMBEDDING_MODEL,
    maxTokens: Number.isFinite(maxTokens) ? maxTokens : 8000,
    temperature: Number.isFinite(temperature) ? temperature : 0.2,
    timeoutMs: 120000,
    azureDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    azureApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  };

  const gateway = new LLMGateway({
    defaultProvider: providerId,
    providers: [providerConfig],
  });

  gateway.registerProvider(providerConfig, apiKey);
  return gateway;
}

export class AgentOrchestrator {
  private stateMachine: RunStateMachine;
  private agents: Map<RunStatus, BaseAgent> = new Map();
  private llmGateway: LLMGateway;
  private toolRegistry: ToolRegistry;
  private eventListeners: RunEventListener[] = [];
  private decisions: AgentDecision[] = [];

  constructor(runId: string, llmGateway?: LLMGateway, toolRegistry?: ToolRegistry, maxFixIterations = 5) {
    this.stateMachine = new RunStateMachine(runId, RunStatus.RECEIVED, maxFixIterations);
    this.llmGateway = llmGateway || createLlmGatewayFromEnv();
    this.toolRegistry = toolRegistry || new ToolRegistry();

    // Register phase handlers
    this.registerAgent(new ProjectAnalyzerAgent());
    this.registerAgent(new ArchitectureAgent());
    this.registerAgent(new EdsDeveloperAgent());
    this.registerAgent(new UniversalEditorAgent());
    this.registerAgent(new BuildValidationAgent());
    this.registerAgent(new QAValidationAgent());
    this.registerAgent(new VisualValidationAgent());
    this.registerAgent(new AccessibilityAgent());
    this.registerAgent(new PerformanceAgent());
    this.registerAgent(new QualityGateAgent());
    this.registerAgent(new FixAgent());
    this.registerAgent(new DeploymentAgent());
  }

  public getStateMachine(): RunStateMachine {
    return this.stateMachine;
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
    pullRequestUrl?: string;
    pullRequestNumber?: number;
    gitCommit?: string;
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
      authorUrl: options.authorUrl,
      aemPageId: options.aemPageId,
      llmGateway: this.llmGateway,
      toolRegistry: this.toolRegistry,
      generatedFiles: new Map(),
      bugs: [],
      evidence: [],
      skipGitHubPublish: options.skipGitHubPublish,
      log: (msg) => {
        const phase = this.stateMachine.getStatus();
        void this.emit(AgentEventType.AGENT_STEP_STARTED, {
          runId,
          message: msg,
          phase,
          status: phase,
          currentStage: PIPELINE_STAGE_LABELS[phase] || phase,
        });
      },
      emit: (type, payload = {}) => {
        const phase = this.stateMachine.getStatus();
        void this.emit(type as AgentEventType, {
          runId,
          phase,
          status: phase,
          currentStage: PIPELINE_STAGE_LABELS[phase] || phase,
          ...payload,
        });
      },
    };

    await this.emit(AgentEventType.AGENT_STARTED, {
      runId,
      projectId,
      workBranch,
      status: RunStatus.RECEIVED,
      phase: RunStatus.RECEIVED,
      currentStage: PIPELINE_STAGE_LABELS[RunStatus.RECEIVED] || 'Received',
      progress: 0,
    });

    // Canonical execution sequence (13 user-visible stages including waiting approval)
    const pipelineSequence: RunStatus[] = [...PIPELINE_STAGE_ORDER];

    const startTime = Date.now();

    try {
      for (let i = 0; i < pipelineSequence.length; i++) {
        const targetPhase = pipelineSequence[i]!;

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
        const progress = stageProgressPercent(targetPhase);
        const label = PIPELINE_STAGE_LABELS[targetPhase] || targetPhase;

        await this.emit(AgentEventType.AGENT_STEP_STARTED, {
          runId,
          phase: targetPhase,
          status: targetPhase,
          currentStage: label,
          progress,
          stageIndex: i + 1,
          totalStages: pipelineSequence.length,
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
        } else {
          // Stages without a dedicated agent — emit explicit SKIPPED evidence, never fake PASS
          const skipPhases: Partial<Record<RunStatus, string>> = {
            [RunStatus.DEPLOYING_PREVIEW]:
              'Preview deploy stage has no dedicated agent in this run; GitHub branch/PR evidence is recorded at PR_CREATED when configured.',
            [RunStatus.WAITING_APPROVAL]: 'Waiting for human approval before production merge / AEM live publish.',
          };
          const msg = skipPhases[targetPhase] || `Completed stage ${label} (no dedicated agent)`;
          context.log(msg);
          await sleep(200);
        }

        await this.emit(AgentEventType.AGENT_STEP_COMPLETED, {
          runId,
          phase: targetPhase,
          status: targetPhase,
          currentStage: label,
          progress,
          stageIndex: i + 1,
          totalStages: pipelineSequence.length,
          filesGenerated: Array.from(context.generatedFiles.keys()),
        });

        // Dynamic Multi-Pass Self-Healing Loop:
        // If unresolved bugs are detected during testing/quality gate, loop through diagnosing -> fixing -> regression testing
        if (targetPhase === RunStatus.QUALITY_GATE && context.bugs.some((b) => !b.resolved)) {
          while (context.bugs.some((b) => !b.resolved)) {
            if (!this.stateMachine.canTransitionTo(RunStatus.DIAGNOSING)) {
              break;
            }

            await this.stateMachine.transition(RunStatus.DIAGNOSING);
            await this.emit(AgentEventType.AGENT_STEP_STARTED, {
              runId,
              phase: RunStatus.DIAGNOSING,
              status: RunStatus.DIAGNOSING,
              currentStage: PIPELINE_STAGE_LABELS[RunStatus.DIAGNOSING],
              progress: stageProgressPercent(RunStatus.QUALITY_GATE),
            });
            context.log(`Self-healing: Diagnosing ${context.bugs.filter((b) => !b.resolved).length} defect(s)...`);
            await this.emit(AgentEventType.AGENT_STEP_COMPLETED, {
              runId,
              phase: RunStatus.DIAGNOSING,
              status: RunStatus.DIAGNOSING,
              currentStage: PIPELINE_STAGE_LABELS[RunStatus.DIAGNOSING],
            });

            await this.stateMachine.transition(RunStatus.FIXING);
            if (this.stateMachine.getStatus() === RunStatus.LIMIT_REACHED) {
              context.log('Self-healing: Exceeded maximum fix iterations. Halting repairs.');
              break;
            }

            await this.emit(AgentEventType.AGENT_STEP_STARTED, {
              runId,
              phase: RunStatus.FIXING,
              status: RunStatus.FIXING,
              currentStage: PIPELINE_STAGE_LABELS[RunStatus.FIXING],
            });
            const fixAgent = this.agents.get(RunStatus.FIXING);
            if (fixAgent) {
              const fixResult = await fixAgent.execute(context);
              if (fixResult.decision) {
                this.decisions.push(fixResult.decision);
              }
            }
            await this.emit(AgentEventType.AGENT_STEP_COMPLETED, {
              runId,
              phase: RunStatus.FIXING,
              status: RunStatus.FIXING,
              currentStage: PIPELINE_STAGE_LABELS[RunStatus.FIXING],
            });

            await this.stateMachine.transition(RunStatus.REGRESSION_TESTING);
            await this.emit(AgentEventType.AGENT_STEP_STARTED, {
              runId,
              phase: RunStatus.REGRESSION_TESTING,
              status: RunStatus.REGRESSION_TESTING,
              currentStage: PIPELINE_STAGE_LABELS[RunStatus.REGRESSION_TESTING],
            });
            const qaAgent = this.agents.get(RunStatus.FUNCTIONAL_TESTING);
            if (qaAgent) {
              await qaAgent.execute(context);
            }
            await this.emit(AgentEventType.AGENT_STEP_COMPLETED, {
              runId,
              phase: RunStatus.REGRESSION_TESTING,
              status: RunStatus.REGRESSION_TESTING,
              currentStage: PIPELINE_STAGE_LABELS[RunStatus.REGRESSION_TESTING],
            });

            if (!context.bugs.some((b) => !b.resolved)) {
              await this.stateMachine.transition(RunStatus.QUALITY_GATE);
              context.log('Self-healing: Regression tests verified repairs. Returned to Quality Gate.');
              break;
            }
          }
        }
      }

      const finalStatus = this.stateMachine.getStatus();

      await this.emit(AgentEventType.AGENT_COMPLETED, {
        runId,
        filesGenerated: Array.from(context.generatedFiles.keys()),
        status: finalStatus,
        phase: finalStatus,
        currentStage: PIPELINE_STAGE_LABELS[finalStatus] || finalStatus,
        progress: 100,
        pullRequestUrl: context.pullRequestUrl,
        pullRequestNumber: context.pullRequestNumber,
        gitCommit: context.gitCommit,
        previewUrl: context.previewUrl,
      });

      // Format RFC 1123 compliant preview URL (sanitize slashes/underscores for DNS subdomains)
      const cleanBranch = workBranch.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const cleanRepo = repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const cleanOwner = repoOwner.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const previewUrl =
        context.previewUrl || `https://${cleanBranch}--${cleanRepo}--${cleanOwner}.aem.live/`;

      return {
        runId,
        finalStatus,
        files: Array.from(context.generatedFiles.values()),
        decisions: this.decisions,
        previewUrl,
        pullRequestUrl: context.pullRequestUrl,
        pullRequestNumber: context.pullRequestNumber,
        gitCommit: context.gitCommit,
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
        status: RunStatus.FAILED,
        currentStage: 'Failed',
        progress: stageProgressPercent(this.stateMachine.getStatus()),
      });
      throw err;
    }
  }
}
