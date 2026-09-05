# Phase 4 — Agent Orchestrator & State Machine

## Overview
Phase 4 implemented `@aeds/agent`, the central orchestrator and deterministic state machine driving autonomous EDS development. It coordinates specialized agents through an 18-state pipeline, enforces fix cycle limits to avoid runaway loops, and emits real-time Server-Sent Events (SSE).

---

## 🛠️ Components Implemented

### 1. The 18-State Deterministic State Machine (`src/state-machine.ts`)
The lifecycle follows strict, validated state transitions:
```
RECEIVED ──► ANALYZING ──► PLANNING ──► IMPLEMENTING ──►
BUILDING ──► DEPLOYING_PREVIEW ──► UE_AUTHORING ──►
FUNCTIONAL_TESTING ──► VISUAL_VALIDATION ──►
ACCESSIBILITY ──► PERFORMANCE ──► QUALITY_GATE ──►
PR_CREATED ──► WAITING_APPROVAL ──► DEPLOYED
```
If quality checks fail at any validation stage:
```
... ──► DIAGNOSING ──► FIXING ──► REGRESSION_TESTING ──► QUALITY_GATE
```
- **Runaway Guard**: The state machine tracks fix cycle iterations. If iterations exceed `maxFixIterations` (default: 5), it immediately transitions to `LIMIT_REACHED`, pausing for human review.

### 2. Specialized Agents (`src/agents/`)
- **`ProjectAnalyzerAgent`** (`RunStatus.ANALYZING`): Scans EDS repository structure, checks for `fstab.yaml`, `scripts/scripts.js`, and catalogues existing block types.
- **`ArchitectureAgent`** (`RunStatus.PLANNING`): Deconstructs the design into semantic EDS sections, establishes CSS custom property design tokens, and defines authoring schemas.
- **`EdsDeveloperAgent`** (`RunStatus.IMPLEMENTING`): Generates vanilla JavaScript block decorators (`export default function decorate(block)`) and scoped CSS. Zero external frontend framework dependencies.
- **`UniversalEditorAgent`** (`RunStatus.UE_AUTHORING`): Generates `_component-definition.json` and `_component-models.json` for AEM Universal Editor authoring.
- **`QAValidationAgent`** (`RunStatus.FUNCTIONAL_TESTING`): Audits block decorator signatures, DOM queries, and styling scoping.
- **`FixAgent`** (`RunStatus.FIXING`): Analyzes defects filed in `context.bugs`, diagnoses the root cause, and applies targeted code repairs.
- **`DeploymentAgent`** (`RunStatus.PR_CREATED`): Packages accumulated files, commits to the target branch, and opens the evidence-backed GitHub Pull Request.

### 3. Master Orchestrator (`src/orchestrator.ts`)
Coordinates the pipeline execution:
- Initializes run execution context with LLMGateway and ToolRegistry.
- Transitions states sequentially through the state machine.
- Emits typed `AgentEventType` events for live SSE streaming to the dashboard.
- Delivers the live EDS Preview URL (`https://{branch}--{repo}--{owner}.hlx.page/`).

### 4. API & Real-time SSE Integration (`apps/api/src/routes/runs.ts`)
- In `POST /api/runs`, launching a run instantiates the `AgentOrchestrator` in the background.
- Captures all emitted events and persists them into the `agent_events` database table.
- Clients streaming `/api/runs/:id/events` receive real-time updates as each specialized agent completes its work.

---

## 🧪 Unit Tests (`packages/agent/test/orchestrator.test.ts`)
5 passing tests validating initial states, legal sequence transitions, rejection of illegal jumps, fix iteration limits, and full end-to-end pipeline file generation.
