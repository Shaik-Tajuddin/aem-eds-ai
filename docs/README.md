# AI EDS Developer — Technical Documentation & Walkthroughs

> **Autonomous AI engineering platform for AEM Edge Delivery Services (EDS)**  
> *From design to production-ready EDS — autonomously.*

Welcome to the technical reference and walkthrough documentation for the **AI EDS Developer** platform. This directory contains detailed architectural specifications, implementation walkthroughs, test results, and verified UI screenshots for every completed phase of the platform.

---

## 📚 Table of Contents

| Document | Description | Status |
|---|---|---|
| [**Master Walkthrough**](./walkthrough.md) | Comprehensive overview of all completed phases, architecture, test results, and live views | ✅ Verified |
| [**Master Implementation Plan**](./implementation-plan.md) | Full phased execution roadmap and architectural milestones | 📋 Reference |
| [**Phase 0 & 1 — Foundation & Dashboard UI**](./phase-0-1-foundation-and-ui.md) | Monorepo setup, Turborepo, Docker stack, Drizzle ORM (25 tables), Next.js 15 UI, 7-step wizard | ✅ Complete |
| [**Phase 2 — GitHub Integration**](./phase-2-github-integration.md) | `@aeds/github` adapter, atomic Git commits via Git Data API, EDS auto-detection, preview PRs | ✅ Complete |
| [**Phase 3 — LLM Gateway**](./phase-3-llm-gateway.md) | `@aeds/llm` multi-provider gateway (OpenAI, Anthropic, Gemini), pricing matrix, error handling | ✅ Complete |
| [**Phase 4 — Agent Orchestrator & State Machine**](./phase-4-agent-orchestrator.md) | `@aeds/agent`, 18-state deterministic lifecycle, specialized agents, runaway loop guards | ✅ Complete |
| [**Phase 5 — Tool Registry & Security Engine**](./phase-5-tools-and-policies.md) | `@aeds/tools`, risk-level approval gating, secret redactor (`ghp_******`, `sk-******`), timeouts | ✅ Complete |
| [**Phase 6 — Browser Automation & Testing**](./phase-6-browser-automation.md) | `@aeds/browser`, Playwright controller, block decoration detection, console/network error listeners | ✅ Complete |
| [**Phase 7 — Visual Regression & Comparison**](./phase-7-visual-regression.md) | `@aeds/visual`, pixelmatch differential engine, bounding box clustering, visual heatmap overlays | ✅ Complete |
| [**Phase 8 — AEM Cloud & Universal Editor Adapter**](./phase-8-aem-universal-editor.md) | `@aeds/aem`, Universal Editor schema generator, DOM instrumentation validator, authoring tester | ✅ Complete |
| [**Phase 9 — Figma REST Client & Design IR**](./phase-9-figma-design-ir.md) | `@aeds/figma`, Figma URL parser, REST API client, Design IR converter (tokens, components, assets) | ✅ Complete |
| [**Phase 10 — RAG & Knowledge Retrieval Engine**](./phase-10-rag-retrieval.md) | `@aeds/rag`, 768-dim embeddings, pgvector store, hierarchical source weights (1.25x code), prompt injector | ✅ Complete |
| [**Observatory & Runs Manager**](./observatory-and-runs-manager.md) | `/dashboard/activity` (claim vs evidence, diff snippets) & `/dashboard/runs` (inspector modal) | ✅ Complete |

---

## 🏛️ System Architecture Summary

```
                           AI EDS Developer
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│  apps/web    │          │  apps/api    │          │ workers/     │
│  Next.js 15  │ ◄──────► │  Fastify 5   │ ◄──────► │ BullMQ queue │
│  App Router  │          │  REST & SSE  │          │ Worker jobs  │
└──────────────┘          └──────────────┘          └──────────────┘
                                  │
   ┌──────────────┬───────────────┼──────────────┬──────────────┐
   ▼              ▼               ▼              ▼              ▼
┌──────────┐ ┌──────────┐  ┌──────────────┐ ┌──────────┐ ┌──────────┐
│@aeds/    │ │@aeds/    │  │@aeds/agent   │ │@aeds/rag │ │@aeds/    │
│github    │ │llm       │  │Orchestrator  │ │pgvector  │ │database  │
│Octokit & │ │OpenAI /  │  │18-State Mach │ │RAG Engine│ │Drizzle   │
│Atomic Git│ │Claude /  │  │Specialized   │ │768-dim   │ │25 Tables │
│PR engine │ │Gemini    │  │Agents        │ │Retrieval │ │pgvector  │
└──────────┘ └──────────┘  └──────────────┘ └──────────┘ └──────────┘
```

---

## 🧪 Current Verification Status

- **Automated Tests**: **63/63 passing (100%)** across 10 packages (`@aeds/tools`, `@aeds/visual`, `@aeds/figma`, `@aeds/github`, `@aeds/aem`, `@aeds/llm`, `@aeds/agent`, `@aeds/browser`, `@aeds/rag`, and `apps/api`).
- **Typechecks & Builds**: `npm run typecheck` and `npm run build` pass cleanly with zero errors across all 19 workspace tasks.
- **Frontend Server**: Next.js 15 dev server running at `http://localhost:3000`.
- **Complete Navigation**: All 12 sidebar items have dedicated pages with zero 404s.

