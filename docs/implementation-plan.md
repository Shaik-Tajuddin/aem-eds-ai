# AI EDS Developer — Master Implementation Plan

## Overview
This document contains the engineering blueprint and phased execution roadmap for the **AI EDS Developer** autonomous AI engineering platform for AEM Edge Delivery Services.

---

## 🏗️ Phased Roadmap

### Phase 0 — Monorepo & Infrastructure Foundation ✅
- Turborepo + npm workspaces monorepo structure.
- Docker Compose stack: PostgreSQL 16 + pgvector, Redis 7, MinIO.
- Drizzle ORM schema with 25 tables.
- Standardized shared types and contracts (`@aeds/shared`).
- Unified TypeScript base configuration (`tsconfig.base.json`).

### Phase 1 — Project Management & Dashboard UI ✅
- Next.js 15 App Router engineering control center (`apps/web`).
- KPI strip, active runs monitor, attention alerts, and projects grid.
- Guided 7-step New Project creation wizard (`/dashboard/projects/new`).
- Fastify 5 REST API with OpenAPI documentation (`apps/api`).

### Phase 2 — GitHub Integration & Atomic Commits ✅
- `@aeds/github`: Octokit adapter.
- Atomic multi-file commits via GitHub Git Data API (`createBlob` → `createTree` → `createCommit` → `updateRef`).
- Automatic AEM EDS characteristic detection (`fstab.yaml`, `scripts.js`).
- Evidence-backed Pull Request creation with preview URLs.

### Phase 3 — Multi-Provider LLM Gateway ✅
- `@aeds/llm`: OpenAI, Anthropic Claude 3.5/3.7, and Google Gemini 1.5/2.0.
- Dynamic prefix routing and fallback.
- Real-time token economics matrix tracking dollar cost per million tokens.
- Exponential backoff for rate limits and timeouts.

### Phase 4 — Deterministic Agent Orchestrator & State Machine ✅
- `@aeds/agent`: 18-state deterministic state machine (`RunStateMachine`).
- Specialized agents: Project Analyzer, Architecture, EDS Developer, Universal Editor, QA, Fix, Deployment.
- Runaway loop guards (`LIMIT_REACHED`) and state serialization for crash-resilience.
- Real-time SSE dispatch to engineering dashboard.

### Phase 5 — Tool Registry & Risk-Gated Security Engine ✅
- `@aeds/tools`: Tool registry with schema validation via Zod.
- Multi-tier risk gating (`low`, `medium`, `high`, `critical`) with human approval interception.
- Automated secret redactor recursively masking tokens (`ghp_*`, `sk-*`).

### Phase 6 — Browser Automation & Page Auditing ✅
- `@aeds/browser`: Headless Chromium controller powered by Playwright.
- EDS block decoration lifecycle waiting (`data-block-status="loaded"`).
- Console log and network failure interception.
- Responsive viewport matrix (`desktop`, `tablet`, `mobile`).
- Automated accessibility heuristics and full-page screenshots.

### Phase 7 — Visual Regression & Comparison Engine ✅
- `@aeds/visual`: Pixel-level differential comparator using `pixelmatch` and `pngjs`.
- Bounding box clustering (`BoundingBox` coordinates) providing spatial defect localization.
- Differential heatmap overlay generation.

### Phase 8 — AEM Cloud & Universal Editor Adapter ✅ (partial)
- `@aeds/aem`: Authenticated AEM Cloud Client (preview/publish dispatch, Content Fragments, JCR query).
- Universal Editor Model Generator (`_component-definition.json`, `_component-models.json`, `_component-filters.json`).
- DOM Instrumentation Validator (`data-aue-*` compliance).
- Authoring Cycle Tester (simulation; live UE browser loop still feature-flagged).
- Universal Editor Dashboard (`/dashboard/ue`).

### Phase 8.5 — MVP Hardening (Evidence Loop) ✅
- Honest architecture docs: `docs/architecture.md`, `docs/mvp-gap-plan.md`.
- Full `LLMProviderContract`: `chat` / `stream` / `generateStructured` / `supports` + Azure / Ollama / openai-compatible.
- `EDSComponentIR` + Zod schemas (`@aeds/schemas`).
- Versioned skills (`@aeds/agent-skills`).
- Evidence-backed Build / Visual / A11y / Performance / Quality Gate agents (no fake PASS).
- Browser worker fails loudly (no invented decorated blocks).
- `POST /api/runs/:id/resume` checkpoint restore.
- Packages: `@aeds/accessibility`, `@aeds/performance`.

### Phase 8.6 — Live QA / Visual Worker / Cloud Manager / Migrations ✅
- Live Playwright helper (`runLiveBrowserAudit`) wired into QA agent.
- axe-core injection in `BrowserController` (heuristic fallback, mode labeled).
- VisualValidationAgent uses `@aeds/visual` pixelmatch when baseline + screenshot exist.
- `workers/visual-worker` for `visual-tests` queue.
- `CloudManagerClient` adapter behind `ENABLE_CLOUD_MANAGER`.
- Drizzle migration `0000_init_mvp.sql` (+ mirrored under `database/migrations/`).

### Phase 8.7 — Build/Test Workers, Lighthouse, Auth, Reference Docs ✅
- `workers/build-worker` + `workers/test-worker` with allowlisted command runner.
- Queues: `build-jobs`, `test-jobs`.
- `runLighthouseAudit` in `@aeds/performance` (feature-flagged; unavailable without packages).
- API auth: production requires `API_SECRET_KEY` Bearer or HS256 JWT (`NEXTAUTH_SECRET`).
- Full §64 documentation set under `docs/` (see `docs/README.md`).

### Phase 8.8 — Tool Catalog, Live UE Instrumentation, Evaluation ✅
- `createDefaultToolRegistry()` wires GitHub/Browser/Visual/Figma/AEM/testing tools.
- Orchestrator uses populated registry by default; `executeTool` helper.
- Project Analyzer + Deployment Agent publish path use registry tools.
- High-risk auto-approve for trusted agent context; critical tools still gated.
- `ENABLE_LIVE_UE` → Playwright `data-aue-*` instrumentation evidence.
- `@aeds/evaluation` benchmark tasks + scoring from system evidence.
- API: `GET /api/tools`, evaluation list/score endpoints.

### Phase 8.9 — Human Approval Completion ✅
- `POST /api/runs/:id/approve-deployment` / `reject-deployment` with system evidence events.
- Optional GitHub merge via critical `github.mergePR` when `mergePullRequest=true` (honors `ENABLE_GITHUB_MERGE`).
- `forceApprove` policy + `ToolRegistry.approveAndExecute` / `POST /api/tools/execute-approved`.
- Run detail UI calls real APIs; UE dashboard no longer invents PASS.

### Phase 8.10 — Usage / Knowledge Live Binding + UE Authoring Gate ✅
- Persist LLM/tool telemetry into `llm_calls` / `tool_calls`; `GET /api/usage`.
- Usage dashboard reads live aggregates (zeros when empty — no invented spend).
- Knowledge `POST /search` + indexer-aware ingest; UI prefers live results.
- `ENABLE_LIVE_UE_AUTHORING` + Playwright `UE_STORAGE_STATE_PATH` authoring cycle (UNAVAILABLE without session).

### Phase 8.11 — Durable Tool Approvals + UE Authoring Persistence ✅
- Pending tool approvals survive restart via `agent_runs.state_snapshot.pendingToolApprovals`.
- Approve/deny APIs restore and complete or deny pending calls with evidence events.
- Live UE paths write `ue_authoring_tests`; exposed on `GET /api/runs/:id`.

### Phase 8.12 — executeTool Migration + UE Selector Config ✅
- QA live browser, visual compare, and UE GitHub file reads go through ToolRegistry.
- Tenant UE chrome selectors via env (`UE_FIELD_SELECTOR`, `UE_SAVE_SELECTOR`, `UE_CHROME_SELECTOR`, `UE_LOGIN_HINTS`).

### Phase 8.13 — UE Dashboard Live Binding + Content Reopen ✅
- `GET /api/ue/authoring-tests` aggregates `ue_authoring_tests` for the dashboard.
- `/dashboard/ue` shows live PASS/FAIL/UNAVAILABLE only from DB evidence.
- Optional MCP/JCR reopen content verify (`verifyUeReopenViaContent`, `UE_CONTENT_PAGE_URL`).

### Phase 8.14 — Build Tool + AEM Preview + Deep Reopen ✅
- `build.validateArtifacts` tool; BuildValidationAgent uses shared validator (+ tool outside tests).
- Optional post-PR `aem.previewPage` when `ENABLE_AEM_PREVIEW=true` (evidence PASS/FAIL only from tool result).
- UE reopen: recursive string-leaf + JSON scan; partial/empty MCP falls through to JCR before FAIL/UNAVAILABLE.

### Phase 9 — Figma REST Client & Design IR Converter 📋
- `@aeds/figma`: Figma REST API integration.
- Design IR extraction: color palettes, typography tokens, layout trees, and asset manifests.

### Phase 10 — RAG & Knowledge Retrieval Engine 📋
- `@aeds/rag`: pgvector semantic embeddings for official Adobe EDS docs and Franklin block patterns.

### Phase 11 — Distributed BullMQ Queue Workers 📋
- Out-of-process job execution workers in `workers/` for long-running agent orchestration and browser audits.
- Partial: `build-worker`, `test-worker`, `visual-worker`, `browser-worker` exist; expand coverage and orchestration jobs.
