# Agent System

## Orchestrator

`AgentOrchestrator` (`packages/agent`) runs a persistent state machine (`RunStateMachine`) with ordered pipeline stages.

## Run states (subset)

`RECEIVED` → `ANALYZING` → `PLANNING` → `IMPLEMENTING` → `BUILDING` → `DEPLOYING_PREVIEW` → `UE_AUTHORING` → `FUNCTIONAL_TESTING` → `VISUAL_VALIDATION` → `ACCESSIBILITY` → `PERFORMANCE` → (`DIAGNOSING` → `FIXING` → `REGRESSION_TESTING`)* → `QUALITY_GATE` → `PR_CREATED` → `WAITING_APPROVAL` → …

Terminals: `FAILED`, `CANCELLED`, `LIMIT_REACHED`, `PAUSED`, `DEPLOYED`, `COMPLETED`.

## Specialized agents

| Agent | Phase |
|---|---|
| ProjectAnalyzerAgent | ANALYZING |
| ArchitectureAgent | PLANNING (emits validated `EDSArchitectureIR`) |
| EdsDeveloperAgent | IMPLEMENTING |
| UniversalEditorAgent | UE_AUTHORING |
| BuildValidationAgent | BUILDING |
| QAValidationAgent | FUNCTIONAL_TESTING (+ live Playwright) |
| VisualValidationAgent | VISUAL_VALIDATION |
| AccessibilityAgent | ACCESSIBILITY |
| PerformanceAgent | PERFORMANCE |
| QualityGateAgent | QUALITY_GATE |
| FixAgent | FIXING |
| DeploymentAgent | PR_CREATED |

Stages without an agent (e.g. `WAITING_APPROVAL`) log explicitly — they do **not** fake PASS.

## Evidence

`SystemEvidence` on `RunExecutionContext.evidence`:

- `kind`: build | browser | visual | accessibility | performance | quality-gate | …
- `status`: PASS | FAIL | SKIPPED | UNAVAILABLE
- `mode`: live | static | unavailable

## Self-healing

When quality gate sees open bugs: `DIAGNOSING` → `FIXING` → `REGRESSION_TESTING` up to `AGENT_MAX_FIX_ITERATIONS` (default 5), then `LIMIT_REACHED`.

## Limits

```bash
AGENT_MAX_RUNTIME_MINUTES=30
AGENT_MAX_FIX_ITERATIONS=5
AGENT_MAX_TOOL_CALLS=250
AGENT_MAX_LLM_CALLS=100
AGENT_MAX_ESTIMATED_COST_USD=
```

On limit: STOP, SAVE STATE, require human intervention.

## Resume

`POST /api/runs/:id/resume` restores `state_snapshot` for `PAUSED` | `FAILED` | `LIMIT_REACHED` | `WAITING_APPROVAL` and re-enqueues when Redis is available.

## Events

Durable events in PostgreSQL (`agent_events`); live UI via SSE `GET /api/runs/:id/events`.
