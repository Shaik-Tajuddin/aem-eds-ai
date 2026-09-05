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

### Phase 8 — AEM Cloud & Universal Editor Adapter 🚀 (Current)
- `@aeds/aem`: Authenticated AEM Cloud Client (preview/publish dispatch, Content Fragments, JCR query).
- Universal Editor Model Generator (`_component-definition.json`, `_component-models.json`, `_component-filters.json`).
- DOM Instrumentation Validator (`data-aue-*` compliance).
- Authoring Cycle Tester (Add → Edit → Save → Reopen → Rendered DOM check).
- Universal Editor Dashboard (`/dashboard/ue`).

### Phase 9 — Figma REST Client & Design IR Converter 📋
- `@aeds/figma`: Figma REST API integration.
- Design IR extraction: color palettes, typography tokens, layout trees, and asset manifests.

### Phase 10 — RAG & Knowledge Retrieval Engine 📋
- `@aeds/rag`: pgvector semantic embeddings for official Adobe EDS docs and Franklin block patterns.

### Phase 11 — Distributed BullMQ Queue Workers 📋
- Out-of-process job execution workers in `workers/` for long-running agent orchestration and browser audits.
