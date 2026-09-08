# Documentation Index — AEM EDS Engineering Intelligence Platform

Working name: **AI EDS Developer** (renameable).

> From design to production-ready AEM Edge Delivery Services — autonomously.

## Core reference (Master Build Prompt §64)

| Document | Description |
|---|---|
| [architecture.md](./architecture.md) | System topology, evidence principle, system of record |
| [mvp-gap-plan.md](./mvp-gap-plan.md) | Honest MVP status vs master prompt |
| [local-development.md](./local-development.md) | Prerequisites, Docker, env, running locally |
| [cloud-deployment.md](./cloud-deployment.md) | Docker Compose prod topology, Cloud Manager |
| [llm-providers.md](./llm-providers.md) | Provider abstraction, routing, capabilities |
| [agent-system.md](./agent-system.md) | State machine, agents, evidence, self-healing |
| [skills.md](./skills.md) | Versioned agent skills |
| [rag.md](./rag.md) | pgvector knowledge retrieval |
| [tools.md](./tools.md) | Tool registry, policy engine, allowlists |
| [security.md](./security.md) | Auth, secrets, redaction, isolation |
| [aem-integration.md](./aem-integration.md) | AEM Cloud client + Cloud Manager adapter |
| [github-integration.md](./github-integration.md) | Octokit, branches, PRs, EDS detection |
| [figma-integration.md](./figma-integration.md) | Figma REST → Design IR |
| [universal-editor.md](./universal-editor.md) | Models, validators, authoring tester |
| [aem-cloud-mcp-authoring-plan.md](./aem-cloud-mcp-authoring-plan.md) | AEM Cloud MCP Content Authoring Plan & MCP Configuration |
| [testing.md](./testing.md) | Vitest, Playwright, axe, workers |
| [visual-validation.md](./visual-validation.md) | pixelmatch flow and evidence rules |
| [evaluation.md](./evaluation.md) | Benchmark tasks + evidence scoring |
| [troubleshooting.md](./troubleshooting.md) | Common failures and fixes |

## Environment & product

| Document | Description |
|---|---|
| [environment-variables-setup.md](./environment-variables-setup.md) | Full credentials acquisition guide |
| [implementation-plan.md](./implementation-plan.md) | Phased roadmap |
| [Product Vision.md](./Product\ Vision.md) | Product vision |
| [MASTER BUILD PROMPT.md](./MASTER%20BUILD%20PROMPT.md) | Master specification |
| [walkthrough.md](./walkthrough.md) | Capability walkthrough |

## Phase notes (historical)

Phase 0–12 write-ups remain under `docs/phase-*.md` for changelog detail. Prefer the §64 reference docs above for day-to-day engineering.

## Evidence principle

Never claim build / test / visual / a11y / performance / deployment success unless a system tool produced evidence. Distinguish:

AI DECISION · AI RECOMMENDATION · SYSTEM ACTION · SYSTEM RESULT · SYSTEM EVIDENCE
