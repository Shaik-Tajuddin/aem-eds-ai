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

### Phase 8.7 — Build/Test Workers, Lighthouse, Auth, Reference Docs 🚀 (Current)
- `workers/build-worker` + `workers/test-worker` with allowlisted command runner.
- Queues: `build-jobs`, `test-jobs`.
- `runLighthouseAudit` in `@aeds/performance` (feature-flagged; unavailable without packages).
- API auth: production requires `API_SECRET_KEY` Bearer or HS256 JWT (`NEXTAUTH_SECRET`).
- Full §64 documentation set under `docs/` (see `docs/README.md`).

### Phase 9 — Figma REST Client & Design IR Converter 📋
- `@aeds/figma`: Figma REST API integration.
- Design IR extraction: color palettes, typography tokens, layout trees, and asset manifests.

### Phase 10 — RAG & Knowledge Retrieval Engine 📋
- `@aeds/rag`: pgvector semantic embeddings for official Adobe EDS docs and Franklin block patterns.

### Phase 11 — Distributed BullMQ Queue Workers 📋
- Out-of-process job execution workers in `workers/` for long-running agent orchestration and browser audits.
- Still needed: dedicated `build-worker`, `test-worker`, `visual-worker`.
