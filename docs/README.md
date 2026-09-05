# AI EDS Developer — Technical Documentation & Walkthroughs

> **Autonomous AI engineering platform for AEM Edge Delivery Services (EDS)**  
> *From design to production-ready EDS — autonomously.*

Welcome to the technical reference and walkthrough documentation for the **AI EDS Developer** platform. This directory contains detailed architectural specifications, implementation walkthroughs, test results, and verified UI screenshots for every completed phase of the platform.

---

## 📚 Table of Contents

| Document | Description | Status |
|---|---|---|
| [**Master Walkthrough**](./walkthrough.md) | Comprehensive overview of all 14 completed capabilities, architecture, test results, and live views | ✅ Verified |
| [**Environment Variables Guide**](./environment-variables-setup.md) | Complete inventory, requirements matrix, and step-by-step credentials acquisition guide | 🔐 Reference |
| [**Master Implementation Plan**](./implementation-plan.md) | Phased execution roadmap, non-negotiable requirements, and architectural milestones | 📋 Reference |
| [**Master Vision & Gap Analysis**](./master-vision-gap-analysis-implementation-plan.md) | Capability comparison matrix against `MASTER BUILD PROMPT.md` and `Product Vision.md` | ✅ Complete |
| [**Phase 0 & 1 — Foundation & Dashboard UI**](./phase-0-1-foundation-and-ui.md) | Monorepo setup, Turborepo, Docker stack, Drizzle ORM (25 tables), Next.js 15 UI, 7-step wizard | ✅ Complete |
| [**Phase 2 — GitHub Integration**](./phase-2-github-integration.md) | `@aeds/github` adapter, atomic Git commits via Git Data API, EDS auto-detection, preview PRs | ✅ Complete |
| [**Phase 3 — LLM Gateway**](./phase-3-llm-gateway.md) | `@aeds/llm` multi-provider gateway (OpenAI, Anthropic, Gemini), pricing matrix, error handling | ✅ Complete |
| [**Phase 4 — Agent Orchestrator & State Machine**](./phase-4-agent-orchestrator.md) | `@aeds/agent`, 18-state deterministic lifecycle, specialized agents, dynamic self-healing loop | ✅ Complete |
| [**Phase 5 — Tool Registry & Security Engine**](./phase-5-tools-and-policies.md) | `@aeds/tools`, risk-level approval gating, secret redactor (`ghp_******`, `sk-******`), timeouts | ✅ Complete |
| [**Phase 6 — Browser Automation & Testing**](./phase-6-browser-automation.md) | `@aeds/browser`, Playwright controller, block decoration detection, console/network error listeners | ✅ Complete |
| [**Phase 7 — Visual Regression & Comparison**](./phase-7-visual-regression.md) | `@aeds/visual`, pixelmatch differential engine, bounding box clustering, visual heatmap overlays | ✅ Complete |
| [**Phase 8 — AEM Cloud & Universal Editor Adapter**](./phase-8-aem-universal-editor.md) | `@aeds/aem`, Universal Editor schema generator, DOM instrumentation validator, authoring tester | ✅ Complete |
| [**Phase 9 — Figma REST Client & Design IR**](./phase-9-figma-design-ir.md) | `@aeds/figma`, Figma URL parser, REST API client, Design IR converter (tokens, components, assets) | ✅ Complete |
| [**Phase 10 — RAG & Knowledge Retrieval Engine**](./phase-10-rag-retrieval.md) | `@aeds/rag`, 768-dim embeddings, pgvector store, hierarchical source weights (1.25x code), prompt injector | ✅ Complete |
| [**Phase 11 & 12 — Distributed Queues & Production Docker**](./phase-11-implementation-plan.md) | BullMQ Redis queues, worker daemons, and multi-service Docker Compose topology | ✅ Complete |
| [**Observatory & Runs Manager**](./observatory-and-runs-manager.md) | `/dashboard/activity` (claim vs evidence), `/dashboard/runs` (inspector & dispatch modal), and `/dashboard/runs/compare` | ✅ Complete |

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
│Atomic Git│ │Claude /  │  │Self-Healing  │ │768-dim   │ │25 Tables │
│PR engine │ │Gemini    │  │Agents Guild  │ │Retrieval │ │pgvector  │
└──────────┘ └──────────┘  └──────────────┘ └──────────┘ └──────────┘
```

---

## 🧪 Current Verification Status

- **Automated Tests**: **74/74 passing (100%)** across 13 test files (`@aeds/tools`, `@aeds/visual`, `@aeds/figma`, `@aeds/github`, `@aeds/aem`, `@aeds/llm`, `@aeds/agent`, `@aeds/browser`, `@aeds/rag`, `@aeds/queue`, `workers/agent-worker`, `workers/browser-worker`, and `apps/api`).
- **Typechecks & Builds**: `npm run typecheck` passes cleanly with zero errors across all 25 workspace tasks.
- **Production Server**: Next.js 15 dev server running at `http://localhost:3000`.
- **Complete Navigation**: All sidebar and dashboard routes (including `/dashboard/runs/compare`) resolve cleanly with zero 404s.
- **Autonomous Pipeline**: `npm run demo` completes the 10-step autonomous pipeline in ~4.7s.
