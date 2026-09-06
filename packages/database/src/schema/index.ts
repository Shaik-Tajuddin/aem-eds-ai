// ============================================================
// Full Database Schema — AI EDS Developer
// PostgreSQL + Drizzle ORM
// ============================================================

import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uuid,
  index,
  uniqueIndex,
  primaryKey,
  vector,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── USERS ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubId: text('github_id').unique(),
  email: text('email').unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  githubUsername: text('github_username'),
  // GitHub OAuth token stored encrypted
  encryptedGithubToken: text('encrypted_github_token'),
  role: text('role').notNull().default('user'), // 'admin' | 'user'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  health: text('health').notNull().default('UNKNOWN'), // ProjectHealth enum
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastRunAt: timestamp('last_run_at'),
  archivedAt: timestamp('archived_at'),
}, (t) => ({
  ownerIdx: index('project_owner_idx').on(t.ownerId),
}));

// ─── REPOSITORIES ─────────────────────────────────────────────────────────────

export const repositories = pgTable('repositories', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull().default('github'), // 'github'
  fullName: text('full_name').notNull(), // owner/repo
  defaultBranch: text('default_branch').notNull().default('main'),
  isPrivate: boolean('is_private').default(false),
  encryptedToken: text('encrypted_token'), // per-project token
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  projectIdx: index('repo_project_idx').on(t.projectId),
  uniqueProjectRepo: uniqueIndex('repo_project_unique').on(t.projectId),
}));

// ─── ENVIRONMENTS ─────────────────────────────────────────────────────────────

export const environments = pgTable('environments', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // 'aem' | 'eds-preview' | 'eds-production'
  name: text('name').notNull(),
  authorUrl: text('author_url'),
  previewUrl: text('preview_url'),
  productionUrl: text('production_url'),
  authoringPath: text('authoring_path'), // e.g. '/content/mysite/us/en'
  encryptedCredentials: text('encrypted_credentials'), // JSON blob, encrypted
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  projectIdx: index('env_project_idx').on(t.projectId),
}));

// ─── PROJECT CONFIGURATIONS ───────────────────────────────────────────────────

export const projectConfigs = pgTable('project_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull().unique(),
  sourceType: text('source_type').notNull(), // SourceType enum
  sourceUrl: text('source_url'),
  figmaFileUrl: text('figma_file_url'),
  encryptedFigmaToken: text('encrypted_figma_token'),
  // LLM config
  llmProvider: text('llm_provider'),
  llmApiUrl: text('llm_api_url'),
  encryptedLlmApiKey: text('encrypted_llm_api_key'),
  llmModel: text('llm_model'),
  llmEmbeddingModel: text('llm_embedding_model'),
  // Quality gates
  visualThreshold: real('visual_threshold').default(95),
  accessibilityThreshold: real('accessibility_threshold').default(95),
  performanceThreshold: real('performance_threshold').default(90),
  maxFixIterations: integer('max_fix_iterations').default(5),
  requiredGates: text('required_gates').array(),
  // Agent limits
  maxRuntimeMinutes: integer('max_runtime_minutes').default(30),
  maxToolCalls: integer('max_tool_calls').default(250),
  maxLLMCalls: integer('max_llm_calls').default(100),
  maxEstimatedCostUsd: real('max_estimated_cost_usd'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── AGENT RUNS ───────────────────────────────────────────────────────────────

export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  status: text('status').notNull().default('RECEIVED'), // RunStatus enum
  source: text('source').notNull(), // SourceType enum
  sourceUrl: text('source_url'),
  branch: text('branch'),
  gitCommit: text('git_commit'),
  model: text('model'),
  provider: text('provider'),
  progress: real('progress').default(0),
  currentStage: text('current_stage'),
  iteration: integer('iteration').default(0),
  maxIterations: integer('max_iterations').default(5),
  // Counts
  totalToolCalls: integer('total_tool_calls').default(0),
  totalLLMCalls: integer('total_llm_calls').default(0),
  estimatedCostUsd: real('estimated_cost_usd').default(0),
  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
  // Who triggered it
  triggeredBy: uuid('triggered_by').references(() => users.id),
  // State snapshot for resumability
  stateSnapshot: jsonb('state_snapshot'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectIdx: index('run_project_idx').on(t.projectId),
  statusIdx: index('run_status_idx').on(t.status),
  createdIdx: index('run_created_idx').on(t.createdAt),
}));

// ─── AGENT STEPS ──────────────────────────────────────────────────────────────

export const agentSteps = pgTable('agent_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  stepName: text('step_name').notNull(),
  agentId: text('agent_id').notNull(),
  status: text('status').notNull().default('pending'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
  // Structured decision summary (NOT raw LLM output)
  intent: text('intent'),
  planSummary: text('plan_summary'),
  decisionSummary: text('decision_summary'),
  errorMessage: text('error_message'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  runIdx: index('step_run_idx').on(t.runId),
}));

// ─── AGENT EVENTS ─────────────────────────────────────────────────────────────

export const agentEvents = pgTable('agent_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  type: text('type').notNull(), // AgentEventType enum
  actor: text('actor').notNull(), // EventActor enum
  step: text('step').notNull(),
  status: text('status').notNull(),
  data: jsonb('data').notNull().default({}),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (t) => ({
  runIdx: index('event_run_idx').on(t.runId),
  timestampIdx: index('event_timestamp_idx').on(t.timestamp),
  typeIdx: index('event_type_idx').on(t.type),
}));

// ─── TOOL CALLS ───────────────────────────────────────────────────────────────

export const toolCalls = pgTable('tool_calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  toolName: text('tool_name').notNull(),
  namespace: text('namespace').notNull(),
  status: text('status').notNull(), // ToolStatus enum
  riskLevel: text('risk_level').notNull(),
  // Input/output are sanitized before storage (no secrets)
  sanitizedInput: jsonb('sanitized_input'),
  sanitizedOutput: jsonb('sanitized_output'),
  error: text('error'),
  durationMs: integer('duration_ms'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (t) => ({
  runIdx: index('toolcall_run_idx').on(t.runId),
  toolIdx: index('toolcall_tool_idx').on(t.toolName),
}));

// ─── LLM CALLS ────────────────────────────────────────────────────────────────

export const llmCalls = pgTable('llm_calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  latencyMs: integer('latency_ms').notNull(),
  status: text('status').notNull(), // 'success' | 'failed' | 'retried'
  estimatedCostUsd: real('estimated_cost_usd'),
  retryCount: integer('retry_count').default(0),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  // NEVER store: prompt, response content, API keys
}, (t) => ({
  runIdx: index('llmcall_run_idx').on(t.runId),
  providerIdx: index('llmcall_provider_idx').on(t.provider),
}));

// ─── DESIGN SOURCES ───────────────────────────────────────────────────────────

export const designSources = pgTable('design_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // SourceType enum
  url: text('url'),
  storagePath: text('storage_path'), // path in object storage
  designIR: jsonb('design_ir'), // normalized Design IR
  analyzedAt: timestamp('analyzed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── BLOCKS ───────────────────────────────────────────────────────────────────

export const blocks = pgTable('blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  name: text('name').notNull(),
  htmlPath: text('html_path'),
  cssPath: text('css_path'),
  jsPath: text('js_path'),
  modelPath: text('model_path'),
  definitionPath: text('definition_path'),
  filterPath: text('filter_path'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
});

// ─── FILE CHANGES ─────────────────────────────────────────────────────────────

export const fileChanges = pgTable('file_changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  path: text('path').notNull(),
  operation: text('operation').notNull(), // 'create' | 'modify' | 'delete'
  reason: text('reason'),
  linesAdded: integer('lines_added'),
  linesRemoved: integer('lines_removed'),
  diffStoragePath: text('diff_storage_path'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (t) => ({
  runIdx: index('filechange_run_idx').on(t.runId),
}));

// ─── BUILDS ───────────────────────────────────────────────────────────────────

export const builds = pgTable('builds', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull(), // 'running' | 'passed' | 'failed'
  durationMs: integer('duration_ms'),
  previewUrl: text('preview_url'),
  logStoragePath: text('log_storage_path'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
});

// ─── TEST RUNS ────────────────────────────────────────────────────────────────

export const testRuns = pgTable('test_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(), // TestType
  status: text('status').notNull(),
  total: integer('total').default(0),
  passed: integer('passed').default(0),
  failed: integer('failed').default(0),
  skipped: integer('skipped').default(0),
  durationMs: integer('duration_ms'),
  results: jsonb('results').default([]),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
}, (t) => ({
  runIdx: index('testrun_run_idx').on(t.runId),
}));

// ─── VISUAL RUNS ──────────────────────────────────────────────────────────────

export const visualRuns = pgTable('visual_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  iteration: integer('iteration').notNull(),
  score: real('score'),
  threshold: real('threshold').notNull(),
  passed: boolean('passed'),
  referenceScreenshot: text('reference_screenshot'),
  implementationScreenshot: text('implementation_screenshot'),
  diffScreenshot: text('diff_screenshot'),
  differences: jsonb('differences').default([]),
  visionAnalysis: jsonb('vision_analysis'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (t) => ({
  runIdx: index('visualrun_run_idx').on(t.runId),
}));

// ─── ACCESSIBILITY RUNS ───────────────────────────────────────────────────────

export const accessibilityRuns = pgTable('accessibility_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  url: text('url').notNull(),
  status: text('status').notNull(),
  score: real('score'),
  violations: jsonb('violations').default([]),
  passes: integer('passes').default(0),
  incomplete: integer('incomplete').default(0),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// ─── PERFORMANCE RUNS ─────────────────────────────────────────────────────────

export const performanceRuns = pgTable('performance_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  url: text('url').notNull(),
  status: text('status').notNull(),
  performanceScore: real('performance_score'),
  accessibilityScore: real('accessibility_score'),
  bestPracticesScore: real('best_practices_score'),
  seoScore: real('seo_score'),
  cls: real('cls'),
  lcp: real('lcp'),
  fcp: real('fcp'),
  ttfb: real('ttfb'),
  tbt: real('tbt'),
  lighthouseReport: jsonb('lighthouse_report'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// ─── BUGS ─────────────────────────────────────────────────────────────────────

export const bugs = pgTable('bugs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  severity: text('severity').notNull(), // BugSeverity enum
  category: text('category').notNull(), // BugCategory enum
  source: jsonb('source').notNull(),
  evidence: jsonb('evidence').default({}),
  rootCause: text('root_cause'),
  affectedFiles: text('affected_files').array().default([]),
  status: text('status').notNull().default('open'),
  fixAttempts: integer('fix_attempts').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
}, (t) => ({
  runIdx: index('bug_run_idx').on(t.runId),
  statusIdx: index('bug_status_idx').on(t.status),
}));

// ─── FIX ATTEMPTS ─────────────────────────────────────────────────────────────

export const fixAttempts = pgTable('fix_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  bugId: uuid('bug_id').references(() => bugs.id, { onDelete: 'cascade' }).notNull(),
  runId: uuid('run_id').references(() => agentRuns.id).notNull(),
  iteration: integer('iteration').notNull(),
  diagnosis: text('diagnosis'),
  proposedFix: text('proposed_fix'),
  filesModified: text('files_modified').array().default([]),
  buildPassed: boolean('build_passed'),
  testsPassed: boolean('tests_passed'),
  visualScore: real('visual_score'),
  regressionPassed: boolean('regression_passed'),
  succeeded: boolean('succeeded').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// ─── PULL REQUESTS ────────────────────────────────────────────────────────────

export const pullRequests = pgTable('pull_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  provider: text('provider').notNull().default('github'),
  prNumber: integer('pr_number'),
  title: text('title').notNull(),
  body: text('body'),
  url: text('url'),
  headBranch: text('head_branch').notNull(),
  baseBranch: text('base_branch').notNull(),
  status: text('status').notNull().default('open'),
  evidenceSummary: jsonb('evidence_summary'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  mergedAt: timestamp('merged_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── DEPLOYMENTS ──────────────────────────────────────────────────────────────

export const deployments = pgTable('deployments', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id).notNull(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  environment: text('environment').notNull(), // 'preview' | 'production'
  status: text('status').notNull(),
  url: text('url'),
  triggeredBy: uuid('triggered_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  projectIdx: index('deployment_project_idx').on(t.projectId),
}));

// ─── KNOWLEDGE DOCUMENTS ──────────────────────────────────────────────────────

export const knowledgeDocuments = pgTable('knowledge_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id), // null = global
  title: text('title').notNull(),
  source: text('source').notNull(), // URL or file path
  sourceType: text('source_type').notNull(), // 'aem-docs' | 'eds-docs' | 'project-code' | 'custom'
  content: text('content').notNull(),
  metadata: jsonb('metadata').default({}),
  chunksCount: integer('chunks_count').default(0),
  ingestedAt: timestamp('ingested_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── KNOWLEDGE CHUNKS (with pgvector embeddings) ──────────────────────────────

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => knowledgeDocuments.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id), // null = global
  content: text('content').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  embedding: vector('embedding', { dimensions: 768 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  documentIdx: index('chunk_document_idx').on(t.documentId),
  // Vector index created separately via migration
}));

// ─── UE AUTHORING TESTS ───────────────────────────────────────────────────────

export const ueAuthoringTests = pgTable('ue_authoring_tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').references(() => agentRuns.id, { onDelete: 'cascade' }).notNull(),
  pageUrl: text('page_url').notNull(),
  blockName: text('block_name').notNull(),
  action: text('action').notNull(),
  status: text('status').notNull(),
  evidencePath: text('evidence_path'),
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  repository: one(repositories, { fields: [projects.id], references: [repositories.projectId] }),
  config: one(projectConfigs, { fields: [projects.id], references: [projectConfigs.projectId] }),
  environments: many(environments),
  runs: many(agentRuns),
  bugs: many(bugs),
  deployments: many(deployments),
  knowledgeDocs: many(knowledgeDocuments),
}));

export const agentRunsRelations = relations(agentRuns, ({ one, many }) => ({
  project: one(projects, { fields: [agentRuns.projectId], references: [projects.id] }),
  triggeredBy: one(users, { fields: [agentRuns.triggeredBy], references: [users.id] }),
  steps: many(agentSteps),
  events: many(agentEvents),
  toolCalls: many(toolCalls),
  llmCalls: many(llmCalls),
  testRuns: many(testRuns),
  visualRuns: many(visualRuns),
  bugs: many(bugs),
  pullRequest: one(pullRequests, { fields: [agentRuns.id], references: [pullRequests.runId] }),
}));

// ─── END OF SCHEMA ────────────────────────────────────────────────────────────

