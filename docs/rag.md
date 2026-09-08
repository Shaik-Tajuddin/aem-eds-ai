# RAG & Knowledge Engine

Package: `@aeds/rag`  
Storage: PostgreSQL + **pgvector**

## Components

| Class | Role |
|---|---|
| `DocumentChunker` | Split docs (~1000 chars, overlap) |
| `EmbeddingGenerator` | deterministic / openai / gemini embeddings |
| `KnowledgeIndexer` | Chunk → embed → persist |
| `KnowledgeRetriever` | Similarity search + source weights |
| `DrizzleRagRepository` | Postgres persistence |
| `InMemoryRagRepository` | Tests / offline |

## Retrieval priority (weights)

1. Project code (`project-code` ~1.25×)  
2. Project docs  
3. Engineering standards (~1.10×)  
4. Official Adobe / EDS docs (~1.05×)  
5. General model knowledge (lowest)

## Knowledge layers (product model)

1. EDS fundamentals  
2. Universal Editor  
3. EDS architecture  
4. Project standards  
5. Official Adobe documentation  
6. Release notes  

Source metadata (product, version, path, topic) is required. Old docs are not automatically authoritative.

## Chunk metadata

`KnowledgeChunk`: id, source, product, version, projectId?, path?, topic, content, embedding.

## API

| Endpoint | Behavior |
|---|---|
| `POST /api/knowledge` | Prefer `KnowledgeIndexer`; falls back to document-only insert if embed/index fails |
| `POST /api/knowledge/search` | Prefer RAG retrieve; keyword fallback labeled `keyword_fallback` when empty/unavailable |
| `GET /api/usage` | Aggregates persisted `llm_calls` / `tool_calls` (honest zeros when empty) |

## Ops

- Enable extension: `docker/postgres/init.sql` (`CREATE EXTENSION vector`)
- Prefer updating documentation over fine-tuning when Adobe APIs change
- Bulk ingest local markdown into knowledge:

```bash
# Direct DB (needs DATABASE_URL in .env) — docs/*.md + README + MASTER BUILD PROMPT
npm run knowledge:ingest

# Re-ingest (delete same source paths first)
npm run knowledge:ingest:replace

# Via running API instead of direct DB
npm run knowledge:ingest -- --api --api-url http://localhost:3001

# Preview only
npm run knowledge:ingest -- --dry-run
```

Default Docker DB URL: `postgresql://aeds:aeds_password@localhost:5432/aeds_dev`.
If ingest fails with password auth errors, align `.env` `DATABASE_URL` with that and restart the API.
API body limit for `--api` mode is 10MB (`API_BODY_LIMIT_BYTES`).
