# Cloud Deployment

## Modes

| Mode | Description |
|---|---|
| **Local** | Next.js + Fastify + Docker Postgres/Redis/MinIO + Ollama |
| **Cloud** | Same agent architecture; GitHub + AEM Cloud + optional Cloud Manager |

Adapters keep Local and Cloud on the same orchestrator path.

## Docker Compose topology

`docker-compose.yml` / `docker/` Dockerfiles:

- `postgres` (pgvector)
- `redis`
- `minio` (+ init)
- `api` (Fastify)
- `web` (Next.js)
- `agent-worker`
- `browser-worker`

Additional workers (build / test / visual) can be added as Compose services mirroring `workers/*/Dockerfile` patterns.

## Production checklist

1. Set `NODE_ENV=production`
2. Set strong `API_SECRET_KEY`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`
3. Do **not** set `SKIP_AUTH=true`
4. Configure managed Postgres + Redis + object storage
5. Apply migrations (`npm run db:migrate`) — do not rely on `db:push` in shared envs
6. Configure LLM provider credentials server-side only
7. Scope GitHub / AEM / Figma tokens per project (encrypted at rest)
8. Enable OpenTelemetry exporter (`OTEL_EXPORTER_OTLP_ENDPOINT`)

## Cloud Manager

Feature-flagged adapter: `CloudManagerClient` in `@aeds/aem`.

```bash
ENABLE_CLOUD_MANAGER=true
CLOUD_MANAGER_CLIENT_ID=...
CLOUD_MANAGER_CLIENT_SECRET=...
CLOUD_MANAGER_ORG_ID=...
```

When disabled or unconfigured, the client fails loudly — it never fabricates pipeline success.

Deployment state is stored separately from Git state (`deployments` table).

## Preview vs production

- EDS preview URLs follow `{branch}--{repo}--{owner}.aem.live`
- Production publish / Cloud Manager pipelines require human approval unless project policy explicitly enables automation
- Quality gate must PASS with system evidence before READY_FOR_PR

## Scaling

| Component | Scale with |
|---|---|
| API | Stateless replicas behind load balancer |
| agent-worker | BullMQ concurrency |
| browser/visual workers | CPU + Chromium memory |
| Postgres | Vertical + connection pooling |

## Backups

- Postgres: scheduled logical dumps + WAL if available
- MinIO/S3: versioned buckets for screenshots/diffs
- Never back up plaintext secrets in Git
