# AI EDS Developer

> **Autonomous AI engineering platform for AEM Edge Delivery Services (EDS)**  
> *From design to production-ready EDS — autonomously.*

[![CI](https://github.com/Shaik-Tajuddin/aem-eds-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Shaik-Tajuddin/aem-eds-ai/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-74%20passed-brightgreen.svg)](https://github.com/Shaik-Tajuddin/aem-eds-ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/monorepo-turborepo-orange.svg)](https://turbo.build/)

---

## What is this?

**AI EDS Developer** is an autonomous AI engineering platform designed specifically for Adobe Experience Manager Edge Delivery Services (EDS). Unlike generic code generators or chatbots, it executes an end-to-end engineering lifecycle:

1. **Ingests & Analyzes** designs (Figma frames, screenshots, existing websites, AEM pages, or prompts) into a normalized **Design Intermediate Representation (IR)**.
2. **Retrieves Domain Knowledge** using a **pgvector semantic RAG engine** with hierarchical source weighting (1.25x project code, 1.10x standards, 1.05x EDS docs).
3. **Plans Architecture & Conventions** against EDS block standards, authoring contracts, and CSS custom property design tokens.
4. **Generates Pure EDS Code** — dependency-free vanilla JavaScript block decorators (`export default function decorate(block)`), mobile-first scoped CSS, and HTML test harnesses.
5. **Instruments Universal Editor Contracts & Authoring Paths** — maps AEM Cloud authoring page paths (`/content/<site>/...`), synthesizes XWalk sources (`blocks/<id>/_<id>.json`, `models/_section.json`) that `build:json` compiles into `component-definition.json`, `component-models.json`, `component-filters.json`, and injects `data-aue-*` DOM attributes (`data-aue-resource="urn:aemconnection:..."`).
6. **Executes Headless Browser Testing** using Playwright across desktop and mobile viewports, tracking block decoration lifecycle, console errors, network 4xx/5xx responses, and Core Web Vitals (LCP, CLS).
7. **Performs Visual Regression Auditing** using Pixelmatch with semantic bounding box clustering and differential heatmap overlays.
8. **Engages Dynamic Multi-Pass Self-Healing** — when defects or visual regressions occur, it loops deterministically through `DIAGNOSING ➔ FIXING ➔ REGRESSION_TESTING ➔ QUALITY_GATE` up to configurable iterations.
9. **Evaluates Quality Gates** — strictly enforces TypeScript compilation (0 errors), visual fidelity (≥ 95%), WCAG 2.1 AA accessibility (100%), performance (LCP < 2.5s), and security policies.
10. **Opens Evidence-Backed GitHub Pull Requests** with atomic Git Data API commits, live `.hlx.page` preview links, test reports, and visual proof, then waits for human approval before production deployment.

Every step is fully observable in real time through the Engineering Command Center Dashboard (`apps/web`).

---

## Architecture Overview

```
apps/
├── web/              Next.js 15 App Router engineering dashboard (React 19, Tailwind v4)
└── api/              Fastify 5 REST & Server-Sent Events (SSE) API with BullMQ dispatch

packages/
├── shared/           Core TypeScript contracts, 18-state lifecycle enums, and event schemas
├── database/         PostgreSQL 16 schema (25 tables, Drizzle ORM) + pgvector embeddings
├── github/           Octokit adapter with atomic multi-file commits & EDS detection
├── llm/              Multi-provider LLM gateway (OpenAI, Anthropic Claude, Gemini) with pricing matrix
├── tools/            Tool registry, 4-tier risk policy gating, and recursive secret redaction
├── agent/            Deterministic 18-state machine, orchestrator, and dynamic self-healing loop
├── browser/          Playwright controller, DOM inspection, a11y audits, and CWV measurements
├── visual/           Pixelmatch visual regression comparator, bounding boxes, and heatmap overlays
├── aem/              AEM Cloud client, Universal Editor contract generator, and authoring tester
├── figma/            Figma REST client, URL parser, and Design IR converter (tokens, components)
├── rag/              pgvector RAG retrieval engine with hierarchical source weighting
└── queue/            BullMQ job queues, Redis connection manager, and queue telemetry

workers/
├── agent-worker/     BullMQ background worker executing 18-state Agent Orchestrator pipelines
└── browser-worker/   BullMQ background worker executing Playwright audits & visual diffs

docker/
├── Dockerfile.api    Multi-stage Dockerfile for Fastify API
├── Dockerfile.web    Multi-stage Dockerfile for Next.js Web
├── Dockerfile.worker Multi-stage Dockerfile for BullMQ workers
├── postgres/         PostgreSQL init script with pgvector extension
└── docker-compose.yml Full container topology (Postgres, Redis, MinIO, API, Web, Workers)
```

---

## Monorepo Workspaces & Packages

| Workspace | Role | Primary Dependencies | Status |
|---|---|---|---|
| **`@aeds/shared`** | Shared types, interfaces, enums, events | TypeScript 5.8 | ✅ Built & Typechecked |
| **`@aeds/database`** | Drizzle ORM, PostgreSQL schema (25 tables), pgvector | drizzle-orm, postgres | ✅ Built & Typechecked |
| **`@aeds/github`** | Atomic Git commits, PR creation, EDS detection | @octokit/rest | ✅ 9 tests passing |
| **`@aeds/llm`** | Multi-LLM gateway (OpenAI, Claude, Gemini) & pricing | native fetch, zod | ✅ 7 tests passing |
| **`@aeds/tools`** | Tool catalog, risk policy engine, secret redactor | zod | ✅ 5 tests passing |
| **`@aeds/agent`** | 18-state machine, orchestrator & self-healing | @aeds/shared | ✅ 6 tests passing |
| **`@aeds/browser`** | Playwright browser automation & inspection | playwright | ✅ 3 tests passing |
| **`@aeds/visual`** | Pixelmatch diff, bounding box clustering | pixelmatch, pngjs | ✅ 3 tests passing |
| **`@aeds/aem`** | Universal Editor contracts & DOM validation | zod | ✅ 10 tests passing |
| **`@aeds/figma`** | Figma API client & Design IR converter | zod | ✅ 8 tests passing |
| **`@aeds/rag`** | Semantic RAG retrieval & hierarchical weighting | drizzle-orm, pgvector | ✅ 12 tests passing |
| **`@aeds/queue`** | BullMQ Redis queues & telemetry metrics | bullmq, ioredis | ✅ 7 tests passing |
| **`workers/agent-worker`** | Distributed agent pipeline worker daemon | bullmq, @aeds/agent | ✅ 1 test passing |
| **`workers/browser-worker`** | Distributed browser audit worker daemon | bullmq, @aeds/browser | ✅ 1 test passing |
| **`apps/api`** | Fastify 5 REST API & SSE streaming | fastify, @fastify/swagger | ✅ 2 tests passing |
| **`apps/web`** | Next.js 15 command center dashboard | React 19, Tailwind v4 | ✅ Built & Typechecked |

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- **Docker Desktop** (for PostgreSQL, Redis, MinIO)
- **Git**

### 1. Clone and Install

```bash
git clone https://github.com/Shaik-Tajuddin/aem-eds-ai.git
cd aem-eds-ai
npm install --legacy-peer-deps
```

### 2. Configure Environment

```bash
cp .env.example apps/web/.env.local
cp .env.example apps/api/.env
```

Key environment variables:
- `DATABASE_URL` — Defaults to PostgreSQL on `localhost:5432`
- `REDIS_URL` — Defaults to Redis on `localhost:6379`
- `S3_ENDPOINT` — Defaults to MinIO on `http://localhost:9000`
- `LLM_PROVIDER` — `OPENAI`, `ANTHROPIC`, `GEMINI`, or `CUSTOM`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth credentials

### 3. Start Infrastructure via Docker Compose

```bash
docker compose up -d postgres redis minio
```

Services:
- **PostgreSQL 16 with pgvector**: `localhost:5432`
- **Redis 7**: `localhost:6379`
- **MinIO S3 Console**: `http://localhost:9001` (Credentials: `minioadmin` / `minioadmin`)

### 4. Push Database Schema

```bash
npm run db:push
```

### 5. Start Development Servers

```bash
npm run dev
```

- **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Fastify API**: [http://localhost:3001](http://localhost:3001)
- **API Swagger Docs**: [http://localhost:3001/docs](http://localhost:3001/docs)

### 6. Run Autonomous E2E Demo

```bash
npm run demo
```
Executes all 10 autonomous stages in ~4.7s with simulated defect injection and self-healing.

---

## Verification & Testing

Run all 74 unit and integration tests across the monorepo:

```bash
npm test
```

Run TypeScript compilation check across all 25 workspaces:

```bash
npm run typecheck
```

---

## Documentation

Full architectural specifications and reference guides are under [`docs/`](./docs/):

- [Documentation index](./docs/README.md) — start here
- [Architecture](./docs/architecture.md)
- [Local development](./docs/local-development.md)
- [LLM providers](./docs/llm-providers.md)
- [Agent system](./docs/agent-system.md)
- [MVP Gap Plan](./docs/mvp-gap-plan.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [Phase 0 & 1 — Foundation & Web Dashboard](./docs/phase-0-1-foundation-and-ui.md)
- [Phase 2 — GitHub Integration](./docs/phase-2-github-integration.md)
- [Phase 3 — LLM Gateway](./docs/phase-3-llm-gateway.md)
- [Phase 4 — Agent Orchestrator & State Machine](./docs/phase-4-agent-orchestrator.md)
- [Phase 5 — Tool Registry & Security Policies](./docs/phase-5-tools-and-policies.md)
- [Phase 6 — Browser Automation & Testing](./docs/phase-6-browser-automation.md)
- [Phase 7 — Visual Regression Engine](./docs/phase-7-visual-regression.md)
- [Phase 8 — AEM Universal Editor Integration](./docs/phase-8-aem-universal-editor.md)
- [Phase 9 — Figma Design IR Engine](./docs/phase-9-figma-design-ir.md)
- [Phase 10 — RAG & Knowledge Retrieval](./docs/phase-10-rag-retrieval.md)
- [AI Activity Observatory & Runs Manager](./docs/observatory-and-runs-manager.md)

---

## License

Internal / Proprietary — All rights reserved.
