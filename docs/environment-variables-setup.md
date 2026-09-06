# Environment Variables & Configuration Setup Guide

> **AI EDS Developer Platform**  
> *Comprehensive guide to environment variables, credentials acquisition, and configuration management.*

This document provides a complete reference for all variables defined in [`.env.example`](file:///d:/eds%20personal/aem%20ai/.env.example), categorized by requirement status and system layer, accompanied by step-by-step instructions for acquiring and generating each credential.

---

## 📋 Table of Contents

1. [Quick Start (3-Minute Local Setup)](#1-quick-start-3-minute-local-setup)
2. [Variable Inventory & Requirement Matrix](#2-variable-inventory--requirement-matrix)
3. [Step-by-Step Acquisition & Generation Guide](#3-step-by-step-acquisition--generation-guide)
   - [3.1 Cryptographic Keys (Required)](#31-cryptographic-keys-required)
   - [3.2 Local Infrastructure (Docker Compose)](#32-local-infrastructure-docker-compose)
   - [3.3 GitHub OAuth App (NextAuth User Authentication)](#33-github-oauth-app-nextauth-user-authentication)
   - [3.4 GitHub Personal Access Token (Agent Automation & PRs)](#34-github-personal-access-token-agent-automation--prs)
   - [3.5 Figma Personal Access Token (Design Ingestion)](#35-figma-personal-access-token-design-ingestion)
   - [3.6 Adobe Experience Manager / Adobe IMS (Enterprise)](#36-adobe-experience-manager--adobe-ims-enterprise)
   - [3.7 LLM & Embedding Models (Local Ollama vs Cloud)](#37-llm--embedding-models-local-ollama-vs-cloud)
   - [3.8 Observability & Execution Limits](#38-observability--execution-limits)
4. [Ready-to-Use Environment Templates](#4-ready-to-use-environment-templates)
   - [Local Development Template (.env / .env.local)](#local-development-template-env--envlocal)
   - [Production / Cloud Integration Template](#production--cloud-integration-template)
5. [Troubleshooting & Common Pitfalls](#5-troubleshooting--common-pitfalls)

---

## 1. Quick Start (3-Minute Local Setup)

To get the platform running locally without creating any third-party developer accounts:

### 1. Generate Local Secrets
Run this single command in PowerShell or terminal to generate cryptographically secure keys:
```powershell
node -e "const crypto = require('crypto'); console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex')); console.log('NEXTAUTH_SECRET=' + crypto.randomBytes(32).toString('base64')); console.log('API_SECRET_KEY=' + crypto.randomBytes(24).toString('hex'));"
```

### 2. Start Supporting Infrastructure
Launch PostgreSQL with `pgvector`, Redis 7, and MinIO S3 via Docker:
```bash
docker compose up -d postgres redis minio minio-init
```

### 3. Copy Environment Files
Create root `.env` and `apps/web/.env.local`:
```bash
# Windows PowerShell
Copy-Item .env.example .env
Copy-Item .env.example apps/web/.env.local
```
Paste your generated `ENCRYPTION_KEY`, `NEXTAUTH_SECRET`, and `API_SECRET_KEY`, and set `SKIP_AUTH=true` for local development.

---

## 2. Variable Inventory & Requirement Matrix

| Variable | Category | Required? | Default / Local Value | Description & Target Service |
| :--- | :--- | :---: | :--- | :--- |
| `DATABASE_URL` | Infrastructure | **YES** | `postgresql://aeds:aeds_password@localhost:5432/aeds_dev` | PostgreSQL 16 + `pgvector` connection string (Drizzle ORM) |
| `DATABASE_POOL_SIZE` | Infrastructure | Optional | `10` | Max concurrent connection pool size |
| `REDIS_URL` | Infrastructure | **YES** | `redis://localhost:6379` | Redis 7 connection string for BullMQ queues & cache |
| `REDIS_PREFIX` | Infrastructure | Optional | `aeds:` | Key prefix namespace for BullMQ queues |
| `S3_ENDPOINT` | Storage | Optional | `http://localhost:9000` | S3 API endpoint (MinIO or AWS S3) |
| `S3_BUCKET` | Storage | Optional | `aeds-artifacts` | Destination bucket for screenshots & artifacts |
| `S3_ACCESS_KEY` | Storage | Optional | `minioadmin` | S3 Access Key ID |
| `S3_SECRET_KEY` | Storage | Optional | `minioadmin` | S3 Secret Access Key |
| `S3_REGION` | Storage | Optional | `us-east-1` | S3 AWS region string |
| `S3_FORCE_PATH_STYLE`| Storage | Optional | `true` | Required for MinIO path-style bucket URLs |
| `ENCRYPTION_KEY` | Security | **YES** | *(Generate 32-byte hex)* | AES-256-GCM key used to encrypt customer tokens in DB |
| `API_SECRET_KEY` | Security | **YES** | *(Generate random string)*| Bearer token protecting Fastify internal API endpoints |
| `NEXTAUTH_SECRET` | Auth | **YES** | *(Generate 32-byte base64)*| Session encryption secret for NextAuth.js |
| `NEXTAUTH_URL` | Auth | Optional | `http://localhost:3000` | Canonical frontend URL for OAuth callback redirects |
| `SKIP_AUTH` | Auth | Optional | `false` (Set `true` for dev)| Bypasses GitHub OAuth login in local dev mode |
| `GITHUB_CLIENT_ID` | Auth | Conditional | *(From GitHub OAuth App)* | GitHub OAuth client ID for dashboard sign-in |
| `GITHUB_CLIENT_SECRET`| Auth | Conditional | *(From GitHub OAuth App)* | GitHub OAuth client secret for dashboard sign-in |
| `NEXT_PUBLIC_API_URL`| Frontend | Optional | `http://localhost:3001` | Public Fastify API URL consumed by Next.js client |
| `API_PORT` | Backend | Optional | `3001` | Port Fastify HTTP server binds to |
| `API_HOST` | Backend | Optional | `0.0.0.0` | Host IP interface Fastify binds to |
| `GITHUB_TOKEN` | Integration | Conditional | `ghp_...` | GitHub Personal Access Token (PAT) for git/PR automation |
| `FIGMA_TOKEN` | Integration | Conditional | `figd_...` | Figma Personal Access Token for extracting Design IR |
| `AEM_CLIENT_ID` | AEM / IMS | Conditional | *(From Adobe Developer Console)* | Adobe IMS Client ID |
| `AEM_CLIENT_SECRET` | AEM / IMS | Conditional | *(From Adobe Developer Console)* | Adobe IMS Client Secret |
| `AEM_ORGANIZATION_ID`| AEM / IMS | Conditional | `...@AdobeOrg` | Adobe IMS Organization ID |
| `AEM_TECHNICAL_ACCOUNT_ID` | AEM / IMS | Conditional | `...@techacct.adobe.com` | Adobe IMS Technical Account ID |
| `AEM_PRIVATE_KEY_PATH`| AEM / IMS | Conditional | `/path/to/private.key` | Filesystem path to Adobe IMS private key |
| `AEM_DEFAULT_AUTHORING_PATH` | AEM / IMS | Optional | `/content/mysite/us/en` | Default JCR authoring page path in AEM Cloud |
| `LLM_PROVIDER` | LLM | **YES** | `ollama` | Provider: `ollama`, `openai`, `anthropic`, or `gemini` |
| `LLM_API_URL` | LLM | Conditional | `http://localhost:11434` | Base URL for LLM API (required for Ollama / Custom) |
| `LLM_API_KEY` | LLM | Conditional | *(Empty for Ollama)* | API Key for OpenAI, Anthropic, or Gemini |
| `LLM_MODEL` | LLM | **YES** | `llama3.3` (or `gpt-4o`) | Primary code generation and reasoning model |
| `LLM_EMBEDDING_MODEL`| LLM | **YES** | `nomic-embed-text` | 768-dimensional embedding model for RAG vector search |
| `LLM_MAX_TOKENS` | LLM | Optional | `8192` | Maximum generation token limit per inference step |
| `LLM_TEMPERATURE` | LLM | Optional | `0.1` | Temperature for deterministic code generation |
| `LOG_LEVEL` | Logging | Optional | `info` | Logging verbosity: `fatal`, `error`, `warn`, `info`, `debug`, `trace` |
| `OTEL_SERVICE_NAME` | Telemetry | Optional | `ai-eds-developer-api` | OpenTelemetry reporting service name |
| `OTEL_EXPORTER_OTLP_ENDPOINT`| Telemetry | Optional | `http://localhost:4318` | OpenTelemetry OTLP collector endpoint |
| `PLAYWRIGHT_HEADLESS`| Browser | Optional | `true` | Headless execution toggle for Chromium verification |
| `PLAYWRIGHT_TIMEOUT_MS`| Browser | Optional | `30000` | Browser navigation and assertion timeout in ms |
| `AGENT_MAX_RUNTIME_MINUTES`| Agent | Optional | `30` | Execution safeguard timeout per autonomous run |
| `AGENT_MAX_FIX_ITERATIONS`| Agent | Optional | `5` | Maximum iterations for self-healing repair loop |
| `QG_VISUAL_THRESHOLD`| Quality Gate | Optional | `95` | Required visual regression similarity percentage |
| `QG_ACCESSIBILITY_THRESHOLD`| Quality Gate| Optional | `95` | Required Lighthouse/Axe accessibility score |
| `QG_PERFORMANCE_THRESHOLD`| Quality Gate| Optional | `90` | Required Lighthouse performance score |

---

## 3. Step-by-Step Acquisition & Generation Guide

### 3.1 Cryptographic Keys (Required)

The platform secures customer access tokens (GitHub, Figma, AEM) at rest in PostgreSQL using AES-256-GCM authenticated encryption. It also signs user sessions via NextAuth.js.

1. Run the following command in your terminal:
   ```bash
   node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('NEXTAUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
   node -e "console.log('API_SECRET_KEY=' + require('crypto').randomBytes(24).toString('hex'))"
   ```
2. **Requirements**:
   - `ENCRYPTION_KEY`: **Must be exactly 64 hexadecimal characters** (32 bytes). An invalid length will throw a startup error.
   - `NEXTAUTH_SECRET`: Any high-entropy string (base64 recommended).
   - `API_SECRET_KEY`: High-entropy string used for Fastify server-to-server authorization.

---

### 3.2 Local Infrastructure (Docker Compose)

All core persistent data stores are pre-configured to run locally without external cloud dependencies:

```bash
docker compose up -d postgres redis minio minio-init
```

1. **PostgreSQL 16 (`pgvector/pgvector:pg16`)**:
   - Port: `5432`
   - User: `aeds`
   - Password: `aeds_password`
   - Database: `aeds_dev`
   - Extension: `vector` enabled automatically via `docker/postgres/init.sql`.
2. **Redis 7 (`redis:7-alpine`)**:
   - Port: `6379`
   - Memory policy: `noeviction` for resilient BullMQ queues.
3. **MinIO Object Storage (`minio/minio`)**:
   - API Port: `9000`
   - Console Port: `9001`
   - Default User / Pass: `minioadmin` / `minioadmin`
   - Initialized Bucket: `aeds-artifacts` (automatically configured by `minio-init` container).

---

### 3.3 GitHub OAuth App (NextAuth User Authentication)

If you wish to log into the web dashboard using your GitHub identity:

1. Visit **[GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)**.
2. Click **New OAuth App**.
3. Complete the form:
   - **Application name**: `AI EDS Developer`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**.
5. Copy the **Client ID** → `GITHUB_CLIENT_ID`.
6. Under **Client secrets**, click **Generate a new client secret** → `GITHUB_CLIENT_SECRET`.

> [!TIP]
> **Bypass Authentication for Local Development:**  
> Add `SKIP_AUTH=true` to your `.env.local`. The dashboard will automatically sign in as a mock developer user without contacting GitHub.

---

### 3.4 GitHub Personal Access Token (Agent Automation & PRs)

The Agent Orchestrator requires a Personal Access Token to clone EDS boilerplates, push generated code branches, and open Pull Requests.

1. Navigate to **[GitHub Settings > Developer Settings > Personal access tokens (classic)](https://github.com/settings/tokens)**.
2. Click **Generate new token (classic)**.
3. Set Note to: `AI EDS Developer Automation`.
4. Check the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `read:org` (Read org membership for team checks)
5. Click **Generate token**.
6. Copy the token string (begins with `ghp_...`) → `GITHUB_TOKEN`.

---

### 3.5 Figma Personal Access Token (Design Ingestion)

Required when importing design frames from Figma URLs into the Design Intermediate Representation (IR).

1. Open **[Figma](https://www.figma.com)** in your browser and sign in.
2. Click on your profile picture in the top left corner and choose **Settings**.
3. Scroll to the **Personal access tokens** section.
4. Click **Generate new token**.
5. Specify a name: `AEDS Design Ingestion`.
6. Select expiration period and assign the `File content (read-only)` scope.
7. Click **Generate token** and copy the resulting string (begins with `figd_...`) → `FIGMA_TOKEN`.

---

### 3.6 Adobe Experience Manager / Adobe IMS (Enterprise)

Required only when deploying directly to AEM Cloud Service environments or validating Universal Editor remote authoring contracts.

1. Navigate to the **[Adobe Developer Console](https://developer.adobe.com/console)**.
2. Select your enterprise organization.
3. Click **Create new project** → **Add API**.
4. Select **Experience Cloud Services** → **AEM Cloud Service**.
5. Select **Server-to-Server OAuth** (or JWT Service Account):
   - **Client ID**: Copy the API Key → `AEM_CLIENT_ID`
   - **Client Secret**: Copy the generated secret → `AEM_CLIENT_SECRET`
   - **Organization ID**: Copy your org identifier (`...@[AdobeOrg]`) → `AEM_ORGANIZATION_ID`
   - **Technical Account ID**: Copy the technical account ID (`...@[techacct.adobe.com]`) → `AEM_TECHNICAL_ACCOUNT_ID`
   - **Private Key**: Download the private key certificate to a secure directory (e.g. `certs/adobe-private.key`) and set `AEM_PRIVATE_KEY_PATH=./certs/adobe-private.key`.

---

### 3.7 LLM & Embedding Models (Local Ollama vs Cloud)

The platform supports both local zero-cost models and commercial cloud APIs.

#### Option A: Local Ollama (Free, Zero Data Exfiltration)
1. Download and install **[Ollama](https://ollama.com)**.
2. Open your terminal and pull the models:
   ```bash
   ollama pull llama3.3
   ollama pull nomic-embed-text
   ```
3. Set variables:
   ```env
   LLM_PROVIDER=ollama
   LLM_API_URL=http://localhost:11434
   LLM_API_KEY=
   LLM_MODEL=llama3.3
   LLM_EMBEDDING_MODEL=nomic-embed-text
   ```

#### Option B: OpenAI
1. Register or log in at **[platform.openai.com](https://platform.openai.com)**.
2. Create an API key in **API Keys** section.
3. Set variables:
   ```env
   LLM_PROVIDER=openai
   LLM_API_URL=https://api.openai.com/v1
   LLM_API_KEY=sk-proj-...
   LLM_MODEL=gpt-4o
   LLM_EMBEDDING_MODEL=text-embedding-3-small
   ```

#### Option C: Anthropic Claude
1. Log in at **[console.anthropic.com](https://console.anthropic.com)**.
2. Generate an API Key under **API Keys**.
3. Set variables:
   ```env
   LLM_PROVIDER=anthropic
   LLM_API_URL=https://api.anthropic.com/v1
   LLM_API_KEY=sk-ant-...
   LLM_MODEL=claude-3-7-sonnet-20250219
   LLM_EMBEDDING_MODEL=nomic-embed-text
   ```

#### Option D: Google Gemini
1. Visit **[Google AI Studio](https://aistudio.google.com)**.
2. Click **Get API Key** and create a project key.
3. Set variables:
   ```env
   LLM_PROVIDER=gemini
   LLM_API_KEY=AIzaSy...
   LLM_MODEL=gemini-2.5-pro
   LLM_EMBEDDING_MODEL=text-embedding-004
   ```

---

### 3.8 Observability & Execution Limits

These variables come with sensible production defaults and rarely need modification during local development:

- `PLAYWRIGHT_HEADLESS=true`: Runs headless Playwright Chromium. Set to `false` if you want to visually observe the browser viewport during testing.
- `PLAYWRIGHT_TIMEOUT_MS=30000`: 30-second ceiling for page load and block decoration assertions.
- `AGENT_MAX_FIX_ITERATIONS=5`: Limits self-healing retries before marking an execution run as requiring human intervention.
- `QG_VISUAL_THRESHOLD=95`: Quality Gate requires at least 95% visual match against Figma or baseline screenshots.

---

## 4. Ready-to-Use Environment Templates

### Local Development Template (`.env` / `.env.local`)

Copy this configuration directly into `.env` (at root) and `apps/web/.env.local`:

```env
# ==============================================================================
# AI EDS DEVELOPER — LOCAL DEVELOPMENT CONFIGURATION
# ==============================================================================

# Database & Redis (Local Docker Stack)
DATABASE_URL=postgresql://aeds:aeds_password@localhost:5432/aeds_dev
DATABASE_POOL_SIZE=10
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=aeds:

# MinIO Object Storage
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=aeds-artifacts
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

# Cryptographic Keys (Replace with your generated keys)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
API_SECRET_KEY=development_internal_api_secret_key_2026
NEXTAUTH_SECRET=local_nextauth_development_secret_32bytes_min

# Authentication & API Endpoints
NEXTAUTH_URL=http://localhost:3000
SKIP_AUTH=true
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001
API_HOST=0.0.0.0

# LLM Gateway (Default: Local Ollama)
LLM_PROVIDER=ollama
LLM_API_URL=http://localhost:11434
LLM_API_KEY=
LLM_MODEL=llama3.3
LLM_EMBEDDING_MODEL=nomic-embed-text
LLM_MAX_TOKENS=8192
LLM_TEMPERATURE=0.1

# Observability & Browser Controls
LOG_LEVEL=info
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT_MS=30000
AGENT_MAX_RUNTIME_MINUTES=30
AGENT_MAX_FIX_ITERATIONS=5
QG_VISUAL_THRESHOLD=95
QG_ACCESSIBILITY_THRESHOLD=95
QG_PERFORMANCE_THRESHOLD=90
```

---

### Production / Cloud Integration Template

When deploying to a staging/production Kubernetes cluster or cloud VMs:

```env
# Managed PostgreSQL (e.g. AWS RDS / Supabase with pgvector)
DATABASE_URL=postgresql://db_user:StrongPassword@db-host.rds.amazonaws.com:5432/aeds_prod?sslmode=require
DATABASE_POOL_SIZE=25

# Managed Redis (e.g. AWS ElastiCache / Redis Cloud)
REDIS_URL=rediss://default:StrongPassword@redis-host.cache.amazonaws.com:6379
REDIS_PREFIX=aeds_prod:

# AWS S3 Object Storage
S3_ENDPOINT=https://s3.us-east-1.amazonaws.com
S3_BUCKET=prod-aeds-pipeline-artifacts
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=false

# Secrets (From HashiCorp Vault / AWS Secrets Manager)
ENCRYPTION_KEY=64_HEX_CHARACTERS_PROD_ENCRYPTION_KEY_MANAGED_VAULT
API_SECRET_KEY=STRONG_PRODUCTION_INTERNAL_SECRET
NEXTAUTH_SECRET=STRONG_PRODUCTION_NEXTAUTH_SECRET

# GitHub Production OAuth
GITHUB_CLIENT_ID=Ov23liProductionID
GITHUB_CLIENT_SECRET=ProductionSecretFromGitHub
NEXTAUTH_URL=https://aeds.yourcompany.com
SKIP_AUTH=false

# Automation Tokens
GITHUB_TOKEN=ghp_ProductionMachineUserPAT
FIGMA_TOKEN=figd_ProductionFigmaToken

# LLM Gateway (Enterprise Tier)
LLM_PROVIDER=openai
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=sk-proj-ProductionOpenAIKey
LLM_MODEL=gpt-4o
LLM_EMBEDDING_MODEL=text-embedding-3-small
```

---

## 5. Troubleshooting & Common Pitfalls

### 1. `Error: Invalid ENCRYPTION_KEY length`
- **Cause**: AES-256-GCM requires a 256-bit key. In hexadecimal, this must be **exactly 64 characters long**.
- **Fix**: Run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and verify the string is 64 characters long.

### 2. `Connection refused on localhost:5432 or localhost:6379`
- **Cause**: Docker containers for PostgreSQL or Redis are not running.
- **Fix**: Check container status with `docker compose ps`. If stopped, restart with `docker compose up -d postgres redis`.

### 3. `NextAuth Callback URL Mismatch (redirect_uri_mismatch)`
- **Cause**: The redirect URL configured in GitHub OAuth App does not match your browser address.
- **Fix**: Ensure the GitHub OAuth application's **Authorization callback URL** is set precisely to: `http://localhost:3000/api/auth/callback/github`.

### 4. `MinIO S3 Bucket NotFound`
- **Cause**: The `aeds-artifacts` bucket was not initialized.
- **Fix**: Run `docker compose up minio-init` to auto-create and apply the anonymous read policy for screenshots.
