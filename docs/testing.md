# Testing

## Platform tests

```bash
npm test          # Vitest across workspaces
npm run typecheck
npm run build
```

## Layers

| Layer | Tooling |
|---|---|
| Unit / integration | Vitest |
| Browser audits | Playwright (`@aeds/browser`) |
| Accessibility | axe-core injection + static HTML heuristics |
| Visual | pixelmatch (`@aeds/visual`) |
| Performance | Static budgets + optional Lighthouse |
| Build/test jobs | Allowlisted npm commands in workers |

## Workers

| Worker | Queue |
|---|---|
| `agent-worker` | `agent-runs` |
| `browser-worker` | `browser-tests` |
| `visual-worker` | `visual-tests` |
| `build-worker` | `build-jobs` |
| `test-worker` | `test-jobs` |

## Live Playwright

`runLiveBrowserAudit` in `@aeds/agent`:

- Skipped in unit tests
- Enabled when preview/source URL present (or `ENABLE_LIVE_BROWSER=true`)
- Captures screenshots, console, network, axe/heuristic a11y, LCP timings

## Evidence rules

- Mocks only in automated unit/integration tests
- Production path must use real integrations or record `SKIPPED`/`UNAVAILABLE`
- `npm run demo` is a **simulation** — not proof of live AEM/GitHub/Playwright success

## Quality gate defaults

```bash
QG_VISUAL_THRESHOLD=95
QG_ACCESSIBILITY_THRESHOLD=95
QG_PERFORMANCE_THRESHOLD=90
QG_MAX_LCP_MS=2500
```
