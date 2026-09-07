# MVP Gap Plan (Master Build Prompt §66)

## Verdict

Evidence loop, workers, migrations, and reference docs are in place. Remaining focus: deeper tool wiring, live UE, and production auth rollout validation.

## Completed

### P0
- Evidence-backed stages; no fake PASS
- Browser worker fails loudly
- Deployment agent fails on pre-push failure
- LLMProvider contract + Azure/Ollama/compatible
- EDSComponentIR + skills
- Resume API

### P1 (this continuation)
- Live Playwright + axe injection
- Visual pixelmatch path + `visual-worker`
- `build-worker` + `test-worker` (allowlisted commands)
- Lighthouse adapter (`ENABLE_LIGHTHOUSE`, unavailable when not installed)
- Cloud Manager adapter
- Drizzle `0000_init_mvp` migrations
- Production-oriented API auth (API secret / HS256 JWT)
- Full `docs/` reference set (§64)

## Remaining

| Item | Status |
|---|---|
| Register production tools into `ToolRegistry` | 📋 |
| Live Universal Editor browser authoring | 📋 |
| Evaluation harness (§53) | 📋 P2 |
| Knowledge/Usage dashboards live binding | 📋 P2 |

## Docs index

See [docs/README.md](./README.md).
