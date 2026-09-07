# AEM EDS Engineering Intelligence Platform — Architecture

Working product name: **AI EDS Developer** (renameable via branding config).

Positioning: *From design to production-ready AEM Edge Delivery Services — autonomously.*

## Core principle

The AI does not stop when code is generated. It stops when the implementation has been **built, tested, validated, and passed the configured quality gate**, with **system evidence** for every success claim.

| Concept | Meaning |
|---|---|
| AI DECISION | What the agent chose to do |
| AI RECOMMENDATION | Suggested next action (not executed) |
| SYSTEM ACTION | Tool / worker invocation |
| SYSTEM RESULT | Structured tool output |
| SYSTEM EVIDENCE | Artifacts: logs, screenshots, diffs, test reports, PR URLs |

Never represent an AI assumption as system evidence.

## System of record

PostgreSQL + Git + test artifacts + browser evidence + deployment records.

The LLM is a replaceable reasoning engine (planner / coder / diagnostician), not the system of record.

## Topology

```
USER → Next.js Web → Fastify API → Agent Orchestrator
                                         │
                    Architecture / Coding / QA / UE / Debug / Fix agents
                                         │
                              Context Engine (RAG + Skills + Project)
                                         │
                         Tool Registry → Policy → Executor
                                         │
              GitHub · Figma · AEM · Playwright · Build · Visual · A11y · Perf
                                         │
                              Evidence Store → Quality Gate → PR / Approval
```

## Current implementation honesty

This repository already contains substantial Phase 0–12 scaffolding. As of the MVP hardening sprint:

| Area | Status |
|---|---|
| Monorepo, dashboard, API, DB schema, queues | Present |
| LLM chat gateway (OpenAI / Anthropic / Gemini) | Present; stream/structured/supports + Azure/Ollama adapters expanded |
| Agent state machine | Present |
| Real build / Playwright / visual / a11y in orchestrator path | Hardened in this sprint (evidence-backed agents; no fake PASS) |
| Versioned agent skills + `EDSComponentIR` | Added in this sprint |
| Cloud Manager live pipelines | Adapter stubs / feature-flagged (non-MVP) |
| Live Universal Editor browser authoring | Partial (models + validators; live UE cycle feature-flagged) |

See [mvp-gap-plan.md](./mvp-gap-plan.md) for the prioritized gap list.

## Phase delivery rule

After each phase report: Implemented · Files changed · Architecture · Database · APIs · Tests · How to run · Known limitations · Next phase.

Never claim a feature is implemented unless it exists and has been tested.
