# MVP Gap Plan (Master Build Prompt §66)

## Verdict

Phase 8.14 migrates build + AEM preview onto the tool registry and strengthens UE content reopen for partial MCP trees. Core MVP evidence loop remains complete for the current scope.

## Completed (through 8.14)

- Evidence-backed pipeline, tools, evaluation, deployment approval
- Usage + knowledge live APIs
- Durable pending tool approvals
- UE instrumentation + chrome authoring + tenant selectors
- `executeTool` for analyzer/deployment/QA/visual/UE/build (+ optional `aem.previewPage`)
- `/dashboard/ue` ← `GET /api/ue/authoring-tests` (no invented PASS)
- Optional `reopenContent` via MCP/JCR (`UE_CONTENT_PAGE_URL`) with deep leaf scan + JCR fallback on partial MCP

## Optional polish

| Item | Status |
|---|---|
| Broader allowlisted build cmds beyond artifact validate | 📋 Optional |

## Docs index

See [docs/README.md](./README.md).
