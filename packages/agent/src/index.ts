// ============================================================
// @aeds/agent — Package Exports
// ============================================================

export { AgentOrchestrator } from './orchestrator.js';
export type { OrchestratorRunOptions, RunEventListener } from './orchestrator.js';
export { RunStateMachine } from './state-machine.js';
export type { StateTransitionEvent, StateTransitionListener } from './state-machine.js';
export {
  PIPELINE_STAGE_ORDER,
  PIPELINE_STAGE_LABELS,
  stageProgressPercent,
  stagesCompletedThrough,
} from './pipeline-stages.js';
export { BaseAgent } from './agents/base.js';
export type { RunExecutionContext, AgentExecutionResult, GeneratedFile } from './agents/base.js';
export { ProjectAnalyzerAgent } from './agents/project-analyzer.js';
export { ArchitectureAgent } from './agents/architecture-agent.js';
export { EdsDeveloperAgent } from './agents/eds-developer.js';
export { UniversalEditorAgent } from './agents/ue-agent.js';
export { QAValidationAgent } from './agents/qa-agent.js';
export { FixAgent } from './agents/fix-agent.js';
export { DeploymentAgent } from './agents/deployment-agent.js';
export {
  preparePublishWorkspace,
  cleanupPublishWorkspace,
} from './publish-workspace.js';
export type { PublishWorkspaceResult } from './publish-workspace.js';
