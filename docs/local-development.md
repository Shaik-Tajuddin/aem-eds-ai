# Local Development

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Docker Desktop (PostgreSQL + Redis + MinIO)
- Git
- Optional: [Ollama](https://ollama.com) for local LLMs

## Install

```bash
git clone <repo>
cd aem-eds-ai   # or your checkout path
npm install --legacy-peer-deps
```

## Environment

```bash
cp .env.example apps/web/.env.local
cp .env.example apps/api/.env
```

Generate encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set `ENCRYPTION_KEY` (64 hex chars) in both env files.

## Infrastructure

```bash
docker compose up -d postgres redis minio
```

| Service | Port |
|---|---|
| PostgreSQL 16 + pgvector | 5432 |
| Redis 7 | 6379 |
| MinIO S3 | 9000 |
| MinIO console | 9001 |

## Database

Push schema (dev):

```bash
npm run db:push
```

Or apply committed migrations:

```bash
npm run db:migrate
```

Migrations live in `packages/database/src/migrations/` and are mirrored under `database/migrations/`.

## Run the platform

```bash
npm run dev
```

| App | URL |
|---|---|
| Web dashboard | http://localhost:3000 |
| Fastify API | http://localhost:3001 |
| OpenAPI docs | http://localhost:3001/docs |

## Optional workers

```bash
npm run start --workspace=@aeds/agent-worker
npm run start --workspace=@aeds/browser-worker
npm run start --workspace=@aeds/visual-worker
npm run start --workspace=@aeds/build-worker
npm run start --workspace=@aeds/test-worker
```

Requires Redis. In-process agent execution still works from the API without workers for local demos.

## LLM (Ollama default)

```bash
ollama pull llama3.3
# .env: LLM_PROVIDER=ollama LLM_API_URL=http://localhost:11434
```

## Live browser / visual

```bash
ENABLE_LIVE_BROWSER=true
ENABLE_LIVE_VISUAL=true
VISUAL_BASELINE_URL=https://example.com/baseline.png
```

Unit tests always skip live Playwright (`VITEST` / `NODE_ENV=test`).

## Useful scripts

| Script | Purpose |
|---|---|
| `npm test` | Vitest across workspaces |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Turbo build |
| `npm run demo` | Simulated pipeline demo (labeled simulation) |

## Project layout

```
apps/web          Next.js dashboard
apps/api          Fastify API + SSE
packages/*        Domain libraries
workers/*         BullMQ consumers
database/         Mirrored migrations + seeds
docs/             This documentation set
```
