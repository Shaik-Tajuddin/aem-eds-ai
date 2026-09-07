# Security

## Authentication (API)

Plugin: `apps/api/src/plugins/auth.ts`

| Environment | Behavior |
|---|---|
| Non-production | Dev user allowed without Bearer; Bearer optional |
| Production | Bearer required: `API_SECRET_KEY` **or** HS256 JWT (`NEXTAUTH_SECRET`) |
| `SKIP_AUTH=true` | Explicit bypass (never in production) |

Invalid production tokens return **401** — no silent success.

## Secrets

- `ENCRYPTION_KEY`: 32-byte hex for AES-256-GCM (`apps/api/src/services/secrets.ts`)
- Per-project GitHub/Figma/AEM/LLM secrets stored encrypted in DB
- Env vars are fallbacks only

## Never

- Send secrets to LLM prompts
- Log secrets
- Commit secrets to Git
- Expose secrets to the browser
- Embed secrets in generated EDS client code

## Tool security

- Allowlists + project scope
- Path / command restrictions (build/test workers)
- Timeouts, rate limits, output size limits
- Secret redaction on tool I/O
- Audit logging of tool calls

## Network

- SSRF protection / URL allowlisting for browser fetches (ongoing hardening)
- GitHub / AEM scoped permissions
- Webhook validation where configured

## CSRF / rate limiting

Fastify plugins: helmet, rate-limit, CORS — configured in `apps/api/src/server.ts`.

## Evidence integrity

Simulation and unit tests must never be presented as live execution in the UI. Agents record `SKIPPED` / `UNAVAILABLE` when tools cannot run.
