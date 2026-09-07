-- ============================================================
-- Complete PostgreSQL DDL for AI EDS Developer
-- Matches packages/database/src/schema/index.ts
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  github_username TEXT,
  encrypted_github_token TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Seed a default system/admin user
INSERT INTO users (id, email, name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'developer@aeds.local', 'EDS Developer', 'admin')
ON CONFLICT (id) DO NOTHING;

-- PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  health TEXT NOT NULL DEFAULT 'UNKNOWN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_run_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS project_owner_idx ON projects (owner_id);

-- REPOSITORIES
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'github',
  full_name TEXT NOT NULL,
  default_branch TEXT NOT NULL DEFAULT 'main',
  is_private BOOLEAN DEFAULT FALSE,
  encrypted_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT repo_project_unique UNIQUE (project_id)
);
CREATE INDEX IF NOT EXISTS repo_project_idx ON repositories (project_id);

-- ENVIRONMENTS
CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  author_url TEXT,
  preview_url TEXT,
  production_url TEXT,
  authoring_path TEXT,
  encrypted_credentials TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS env_project_idx ON environments (project_id);

-- PROJECT CONFIGS
CREATE TABLE IF NOT EXISTS project_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  source_type TEXT NOT NULL,
  source_url TEXT,
  figma_file_url TEXT,
  encrypted_figma_token TEXT,
  llm_provider TEXT,
  llm_api_url TEXT,
  encrypted_llm_api_key TEXT,
  llm_model TEXT,
  llm_embedding_model TEXT,
  visual_threshold REAL DEFAULT 95,
  accessibility_threshold REAL DEFAULT 95,
  performance_threshold REAL DEFAULT 90,
  max_fix_iterations INTEGER DEFAULT 5,
  required_gates TEXT[],
  max_runtime_minutes INTEGER DEFAULT 30,
  max_tool_calls INTEGER DEFAULT 250,
  max_llm_calls INTEGER DEFAULT 100,
  max_estimated_cost_usd REAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- AGENT RUNS
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  source TEXT NOT NULL,
  source_url TEXT,
  branch TEXT,
  git_commit TEXT,
  model TEXT,
  provider TEXT,
  progress REAL DEFAULT 0,
  current_stage TEXT,
  iteration INTEGER DEFAULT 0,
  max_iterations INTEGER DEFAULT 5,
  total_tool_calls INTEGER DEFAULT 0,
  total_llm_calls INTEGER DEFAULT 0,
  estimated_cost_usd REAL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  triggered_by UUID REFERENCES users(id),
  state_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS run_project_idx ON agent_runs (project_id);
CREATE INDEX IF NOT EXISTS run_status_idx ON agent_runs (status);
CREATE INDEX IF NOT EXISTS run_created_idx ON agent_runs (created_at);

-- AGENT STEPS
CREATE TABLE IF NOT EXISTS agent_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  intent TEXT,
  plan_summary TEXT,
  decision_summary TEXT,
  error_message TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS step_run_idx ON agent_steps (run_id);

-- AGENT EVENTS
CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor TEXT NOT NULL,
  step TEXT NOT NULL,
  status TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS event_run_idx ON agent_events (run_id);
CREATE INDEX IF NOT EXISTS event_timestamp_idx ON agent_events (timestamp);
CREATE INDEX IF NOT EXISTS event_type_idx ON agent_events (type);

-- TOOL CALLS
CREATE TABLE IF NOT EXISTS tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  namespace TEXT NOT NULL,
  status TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  sanitized_input JSONB,
  sanitized_output JSONB,
  error TEXT,
  duration_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS toolcall_run_idx ON tool_calls (run_id);
CREATE INDEX IF NOT EXISTS toolcall_tool_idx ON tool_calls (tool_name);

-- LLM CALLS
CREATE TABLE IF NOT EXISTS llm_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER NOT NULL,
  status TEXT NOT NULL,
  estimated_cost_usd REAL,
  retry_count INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS llmcall_run_idx ON llm_calls (run_id);
CREATE INDEX IF NOT EXISTS llmcall_provider_idx ON llm_calls (provider);

-- DESIGN SOURCES
CREATE TABLE IF NOT EXISTS design_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT,
  storage_path TEXT,
  design_ir JSONB,
  analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- BLOCKS
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  html_path TEXT,
  css_path TEXT,
  js_path TEXT,
  model_path TEXT,
  definition_path TEXT,
  filter_path TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- FILE CHANGES
CREATE TABLE IF NOT EXISTS file_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  operation TEXT NOT NULL,
  reason TEXT,
  lines_added INTEGER,
  lines_removed INTEGER,
  diff_storage_path TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS filechange_run_idx ON file_changes (run_id);

-- BUILDS
CREATE TABLE IF NOT EXISTS builds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  preview_url TEXT,
  log_storage_path TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- TEST RUNS
CREATE TABLE IF NOT EXISTS test_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  total INTEGER DEFAULT 0,
  passed INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  duration_ms INTEGER,
  results JSONB DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS testrun_run_idx ON test_runs (run_id);

-- VISUAL RUNS
CREATE TABLE IF NOT EXISTS visual_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  iteration INTEGER NOT NULL,
  score REAL,
  threshold REAL NOT NULL,
  passed BOOLEAN,
  reference_screenshot TEXT,
  implementation_screenshot TEXT,
  diff_screenshot TEXT,
  differences JSONB DEFAULT '[]',
  vision_analysis JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS visualrun_run_idx ON visual_runs (run_id);

-- ACCESSIBILITY RUNS
CREATE TABLE IF NOT EXISTS accessibility_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  score REAL,
  violations JSONB DEFAULT '[]',
  passes INTEGER DEFAULT 0,
  incomplete INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- PERFORMANCE RUNS
CREATE TABLE IF NOT EXISTS performance_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL,
  performance_score REAL,
  accessibility_score REAL,
  best_practices_score REAL,
  seo_score REAL,
  cls REAL,
  lcp REAL,
  fcp REAL,
  ttfb REAL,
  tbt REAL,
  lighthouse_report JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- BUGS
CREATE TABLE IF NOT EXISTS bugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  source JSONB NOT NULL,
  evidence JSONB DEFAULT '{}',
  root_cause TEXT,
  affected_files TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open',
  fix_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS bug_run_idx ON bugs (run_id);
CREATE INDEX IF NOT EXISTS bug_status_idx ON bugs (status);

-- FIX ATTEMPTS
CREATE TABLE IF NOT EXISTS fix_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id UUID NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  iteration INTEGER NOT NULL,
  diagnosis TEXT,
  proposed_fix TEXT,
  files_modified TEXT[] DEFAULT '{}',
  build_passed BOOLEAN,
  tests_passed BOOLEAN,
  visual_score REAL,
  regression_passed BOOLEAN,
  succeeded BOOLEAN NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- PULL REQUESTS
CREATE TABLE IF NOT EXISTS pull_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'github',
  pr_number INTEGER,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  head_branch TEXT NOT NULL,
  base_branch TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  evidence_summary JSONB,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  merged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- DEPLOYMENTS
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  environment TEXT NOT NULL,
  status TEXT NOT NULL,
  url TEXT,
  triggered_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS deployment_project_idx ON deployments (project_id);

-- KNOWLEDGE DOCUMENTS
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  source_type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  chunks_count INTEGER DEFAULT 0,
  ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- KNOWLEDGE CHUNKS
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(768),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS chunk_document_idx ON knowledge_chunks (document_id);

-- UE AUTHORING TESTS
CREATE TABLE IF NOT EXISTS ue_authoring_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  block_name TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  evidence_path TEXT,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
