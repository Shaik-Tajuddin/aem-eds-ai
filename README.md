# AI EDS Developer

> **Autonomous AI engineering platform for AEM Edge Delivery Services**
> 
> *From design to production-ready EDS — autonomously.*

[![CI](https://github.com/your-org/ai-eds-developer/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/ai-eds-developer/actions/workflows/ci.yml)

---

## What is this?

AI EDS Developer is an autonomous AI engineering platform that takes a design (Figma, screenshot, existing website, or AEM page) and autonomously:

1. **Analyzes** the design and existing EDS project conventions
2. **Plans** the EDS block architecture
3. **Generates** EDS HTML, CSS, JavaScript, and Universal Editor models
4. **Builds** and deploys to a preview environment
5. **Tests** with Playwright (functional + Universal Editor authoring)
6. **Compares** the implementation against the reference (visual regression)
7. **Fixes** detected issues automatically (up to configured iterations)
8. **Validates** accessibility (axe-core) and performance (Lighthouse)
9. **Creates** a GitHub Pull Request with full evidence attached
10. **Waits** for human approval before production deployment

Every step is observable through the engineering command center dashboard.

---

## Architecture

```
apps/
├── web/          Next.js 15 dashboard (engineering command center)
└── api/          Fastify 5 API (agent orchestration backend)

packages/
├── agent/        Agent orchestrator + state machine + specialized agents
├── llm/          LLM gateway (OpenAI, Anthropic, Gemini, Azure, Ollama)
├── tools/        Tool registry + security policy engine
├── github/       GitHub adapter (clone, branch, commit, PR)
├── aem/          AEM Cloud + Universal Editor adapter
├── figma/        Figma API adapter + Design IR builder
├── browser/      Playwright browser automation wrapper
├── visual/       Screenshot diff + visual scoring
├── rag/          pgvector knowledge retrieval
├── database/     PostgreSQL schema (Drizzle ORM) + migrations
└── shared/       TypeScript types, enums, events (shared across all packages)

workers/
├── agent-worker/ BullMQ worker: runs agent state machine
├── browser-worker/ BullMQ worker: Playwright jobs
└── build-worker/ BullMQ worker: EDS build jobs
```

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | ≥ 20 | Runtime |
| npm | ≥ 10 | Package manager |
| Docker Desktop | Latest | PostgreSQL, Redis, MinIO |
| Git | Any | Repository operations |
| Ollama (optional) | Latest | Local LLM for zero-cost dev |

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-org/ai-eds-developer.git
cd ai-eds-developer
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp .env.example apps/web/.env.local
cp .env.example apps/api/.env
```

Edit the `.env` files and set at minimum:
- `DATABASE_URL` — already defaults to local Docker
- `ENCRYPTION_KEY` — generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `NEXTAUTH_SECRET` — generate with: `openssl rand -base64 32`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — from GitHub OAuth app
- `LLM_PROVIDER` and `LLM_MODEL` — set to `ollama` + `llama3.3` for zero-cost local dev

### 3. Start Docker services

```bash
docker compose up -d postgres redis minio
```

Verify services:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO Console: `http://localhost:9001` (user: `minioadmin` / `minioadmin`)

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. Start the development servers

```bash
npm run dev
```

This starts:
- **Dashboard**: `http://localhost:3000`
- **API**: `http://localhost:3001`
- **API Docs**: `http://localhost:3001/docs` (dev only)

---

## External Integrations

### GitHub OAuth (Required for auth)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App:
   - Homepage: `http://localhost:3000`
   - Callback: `http://localhost:3000/api/auth/callback/github`
3. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

### GitHub Token (Required for agent operations)

Personal Access Token with scopes: `repo`, `workflow`, `read:org`

### Figma (Required for Figma source type)

Generate a personal access token at [figma.com/developers](https://www.figma.com/developers/api#access-tokens)

### AEM Cloud (Required for AEM integration)

Configure via Adobe Developer Console:
- Service Account (JWT) or OAuth Server-to-Server credentials
- Set `AEM_CLIENT_ID`, `AEM_CLIENT_SECRET`, `AEM_ORGANIZATION_ID`

### LLM Provider

| Provider | Config |
|---|---|
| Ollama (local, free) | `LLM_PROVIDER=ollama`, `LLM_API_URL=http://localhost:11434` |
| OpenAI | `LLM_PROVIDER=OPENAI`, `LLM_API_KEY=sk-...` |
| Anthropic | `LLM_PROVIDER=ANTHROPIC`, `LLM_API_KEY=sk-ant-...` |
| Azure OpenAI | `LLM_PROVIDER=AZURE_OPENAI`, `LLM_API_URL=https://...` |
| Custom | `LLM_PROVIDER=CUSTOM`, `LLM_API_URL=https://your-endpoint` |

---

## Development Phases

| Phase | Status | Description |
|---|---|---|
| 0 — Foundation | ✅ Complete | Monorepo, Docker, shared types, database schema |
| 1 — Project Management | ✅ Complete | Dashboard UI, New Project wizard, API routes |
| 2 — GitHub Integration | 🔲 Planned | Clone, branch, commit, PR |
| 3 — EDS Analyzer | 🔲 Planned | Project structure detection |
| 4 — Agent Orchestrator | 🔲 Planned | State machine, tool registry, BullMQ |
| 5 — Figma/Website Analyzer | 🔲 Planned | Design IR, Playwright crawler |
| 6 — EDS Code Generator | 🔲 Planned | Block/CSS/JS/UE generation |
| 7 — Preview & Deploy | 🔲 Planned | EDS build + preview URL |
| 8 — Playwright Testing | 🔲 Planned | Functional + UE authoring tests |
| 9 — Visual QA | 🔲 Planned | Screenshot diff + scoring |
| 10 — AI Fix Loop | 🔲 Planned | Debug + fix + retest |
| 11 — Universal Editor | 🔲 Planned | UE authoring automation |
| 12 — A11y + Performance | 🔲 Planned | axe-core + Lighthouse |
| 13 — PR + Deployment | 🔲 Planned | Evidence report + human approval |
| 14 — Dashboard Completion | 🔲 Planned | All 14 dashboard pages |
| 15 — RAG | 🔲 Planned | pgvector knowledge retrieval |

---

## Security

- **Secrets**: All credentials (GitHub tokens, LLM API keys, Figma tokens, AEM secrets) are encrypted at rest using AES-256-GCM with a key from `ENCRYPTION_KEY`.
- **Redaction**: Pino logger redacts all secret fields — they never appear in logs.
- **Browser isolation**: The browser (`apps/web`) never receives raw secrets. API proxies all sensitive operations.
- **Tool policy**: Agent tools are validated through a policy engine before execution (Phase 4).
- **Human approval**: Production deployments and PR merges require explicit human approval.

---

## Known Limitations (Phase 0-1)

- Agent orchestrator is not yet implemented (Phase 4)
- GitHub integration is stubbed (Phase 2)
- Figma and website analysis are not yet implemented (Phase 5)
- Universal Editor automation is not yet implemented (Phase 11)
- RAG knowledge system is not yet implemented (Phase 15)
- Dashboard pages beyond Overview are placeholder stubs

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | System architecture and component communication |
| [Agent Architecture](docs/agent-architecture.md) | Specialized agent design and state machine |
| [Security](docs/security.md) | Security model and credential handling |
| [API Reference](http://localhost:3001/docs) | OpenAPI documentation (running instance) |

---

## License

Internal — all rights reserved.
