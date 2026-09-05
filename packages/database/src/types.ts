// Re-export Drizzle inferred types for use in the app
import type {
  users,
  projects,
  repositories,
  environments,
  projectConfigs,
  agentRuns,
  agentSteps,
  agentEvents,
  toolCalls,
  llmCalls,
  bugs,
  fixAttempts,
  pullRequests,
  deployments,
  testRuns,
  visualRuns,
  accessibilityRuns,
  performanceRuns,
  knowledgeDocuments,
  knowledgeChunks,
  ueAuthoringTests,
  fileChanges,
  builds,
  designSources,
  blocks,
} from './schema/index.js';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;

export type Repository = InferSelectModel<typeof repositories>;
export type NewRepository = InferInsertModel<typeof repositories>;

export type Environment = InferSelectModel<typeof environments>;
export type NewEnvironment = InferInsertModel<typeof environments>;

export type ProjectConfig = InferSelectModel<typeof projectConfigs>;
export type NewProjectConfig = InferInsertModel<typeof projectConfigs>;

export type AgentRun = InferSelectModel<typeof agentRuns>;
export type NewAgentRun = InferInsertModel<typeof agentRuns>;

export type AgentStep = InferSelectModel<typeof agentSteps>;
export type NewAgentStep = InferInsertModel<typeof agentSteps>;

export type AgentEvent = InferSelectModel<typeof agentEvents>;
export type NewAgentEvent = InferInsertModel<typeof agentEvents>;

export type ToolCall = InferSelectModel<typeof toolCalls>;
export type NewToolCall = InferInsertModel<typeof toolCalls>;

export type LLMCall = InferSelectModel<typeof llmCalls>;
export type NewLLMCall = InferInsertModel<typeof llmCalls>;

export type Bug = InferSelectModel<typeof bugs>;
export type NewBug = InferInsertModel<typeof bugs>;

export type FixAttempt = InferSelectModel<typeof fixAttempts>;
export type NewFixAttempt = InferInsertModel<typeof fixAttempts>;

export type PullRequest = InferSelectModel<typeof pullRequests>;
export type NewPullRequest = InferInsertModel<typeof pullRequests>;

export type Deployment = InferSelectModel<typeof deployments>;
export type NewDeployment = InferInsertModel<typeof deployments>;

export type TestRun = InferSelectModel<typeof testRuns>;
export type NewTestRun = InferInsertModel<typeof testRuns>;

export type VisualRun = InferSelectModel<typeof visualRuns>;
export type NewVisualRun = InferInsertModel<typeof visualRuns>;

export type AccessibilityRun = InferSelectModel<typeof accessibilityRuns>;
export type PerformanceRun = InferSelectModel<typeof performanceRuns>;

export type KnowledgeDocument = InferSelectModel<typeof knowledgeDocuments>;
export type KnowledgeChunk = InferSelectModel<typeof knowledgeChunks>;

export type UEAuthoringTest = InferSelectModel<typeof ueAuthoringTests>;
export type FileChange = InferSelectModel<typeof fileChanges>;
export type Build = InferSelectModel<typeof builds>;
export type DesignSource = InferSelectModel<typeof designSources>;
export type Block = InferSelectModel<typeof blocks>;
