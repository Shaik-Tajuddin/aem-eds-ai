# Troubleshooting

## Environment / infra

| Symptom | Fix |
|---|---|
| `Invalid ENCRYPTION_KEY length` | 64 hex chars (32 bytes) |
| Connection refused `:5432` / `:6379` | `docker compose up -d postgres redis` |
| MinIO bucket missing | `docker compose up minio-init` |
| Missing env files | Copy `.env.example` → `apps/web/.env.local` and `apps/api/.env` |

## Auth

| Symptom | Fix |
|---|---|
| NextAuth `redirect_uri_mismatch` | Callback `http://localhost:3000/api/auth/callback/github` |
| Production 401s | Set `API_SECRET_KEY` Bearer or JWT with `NEXTAUTH_SECRET`; never `SKIP_AUTH` in prod |
| Dev wants open API | Non-prod allows unauthenticated access by design |

## LLM

| Symptom | Fix |
|---|---|
| Ollama connection errors | Ensure Ollama running; `LLM_API_URL=http://localhost:11434` |
| Missing API key | Set `LLM_API_KEY` / provider-specific key |
| Wrong provider | Set `LLM_PROVIDER` (`openai`, `anthropic`, `gemini`, `azure-openai`, `ollama`, …) |
| Debug prompts | `LLM_DEBUG=true` (local only; never commit logs with secrets) |

## Agents / QA

| Symptom | Fix |
|---|---|
| Visual always SKIPPED | Capture live screenshots + set `VISUAL_BASELINE_URL` / `ENABLE_LIVE_VISUAL` |
| Browser SKIPPED in tests | Expected under Vitest |
| Live Playwright fails | Valid preview URL; install Chromium (`npx playwright install`) |
| Lighthouse UNAVAILABLE | Install lighthouse + chrome-launcher; `ENABLE_LIGHTHOUSE=true` |
| `LIMIT_REACHED` | Raise `AGENT_MAX_FIX_ITERATIONS` or fix root cause manually |
| Resume no-op | Ensure Redis for enqueue; checkpoint still restores in DB |

## GitHub / AEM

| Symptom | Fix |
|---|---|
| PR not created | `GITHUB_TOKEN` + `ENABLE_GITHUB_PUBLISH` not false |
| AEM auth errors | Complete IMS fields or bearer; never put creds in browser |
| Cloud Manager errors | `ENABLE_CLOUD_MANAGER=true` + client credentials |

## Database

| Symptom | Fix |
|---|---|
| Schema drift | Prefer `npm run db:migrate` with committed SQL |
| pgvector missing | Use compose Postgres image with init extension |

## Evidence honesty

If the UI shows PASS without artifacts, treat it as a bug. Prefer FAIL / SKIPPED / UNAVAILABLE over silent success.
