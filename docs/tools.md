# Tool Registry

Package: `@aeds/tools` (+ default catalog in `@aeds/agent`)

## Flow

```
LLM / Agent → executeTool / ToolRegistry.execute
  → Policy Engine → Validation → Handler → Sanitized audit record
```

## Default registered tools

Created by `createDefaultToolRegistry()`:

| Tool | Namespace | Risk |
|---|---|---|
| `github.getRepository` | github | low |
| `github.readFile` | github | low |
| `github.createBranch` | github | high |
| `github.commitFiles` | github | high |
| `github.createPR` | github | high (audited; merge is separate human gate) |
| `github.mergePR` | github | critical (requires approval completion) |
| `browser.auditPage` | browser | medium |
| `visual.compare` | visual | low |
| `testing.runCommand` | testing | high (allowlisted) |
| `build.validateArtifacts` | build | low |
| `figma.getFile` | figma | low |
| `aem.previewPage` | aem | high (opt-in via `ENABLE_AEM_PREVIEW`) |

List via `GET /api/tools`.

## Human approval completion

| Endpoint | Purpose |
|---|---|
| `POST /api/runs/:id/approve-deployment` | `WAITING_APPROVAL` → `DEPLOYED` (+ optional merge) |
| `POST /api/runs/:id/reject-deployment` | `WAITING_APPROVAL` → `CANCELLED` |
| `POST /api/tools/execute-approved` | Run a gated tool with `forceApprove` after human sign-off |
| `GET /api/tools/pending?runId=` | List durable pending approvals from `state_snapshot` |
| `POST /api/tools/calls/:callId/approve` | Restore pending + execute |
| `POST /api/tools/calls/:callId/deny` | Remove pending + record DENIED |

When `executeTool` hits `APPROVAL_REQUIRED`, the API/worker persists the pending payload into `agent_runs.state_snapshot.pendingToolApprovals` (survives process restart). `ToolRegistry.approveAndExecute(callId)` completes in-process pending approvals after `restorePendingApproval`.

## Agent usage

```ts
import { executeTool } from '@aeds/agent';
await executeTool(context, 'github.getRepository', { owner, repo });
```

`ProjectAnalyzerAgent`, `DeploymentAgent`, live browser QA (`browser.auditPage`), visual validation (`visual.compare`), and UE GitHub reads (`github.readFile`) call tools through the registry.

Trusted agent pipelines pass `autoApproveHighRisk` so high-risk tools execute with audit records. Tools marked `critical` or `requiresApproval: true` still return `APPROVAL_REQUIRED`.

## Security

- Secrets redacted in tool I/O records
- Allowlisted shell commands only for `testing.runCommand`
- Critical / `requiresApproval` tools return `APPROVAL_REQUIRED` / `PENDING` until a human approval path completes
- High-risk tools require confirmation outside trusted agent context (`autoApproveHighRisk`)
