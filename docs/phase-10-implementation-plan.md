# Phase 10 Implementation Plan — RAG & Knowledge Retrieval Engine (`@aeds/rag`)

## Overview
This document specifies the technical architecture, data contracts, and test plans for **Phase 10: RAG & Knowledge Retrieval Engine (`@aeds/rag`)**.

---

## 🛠️ Architecture & Components

### 1. Types & Data Contracts (`src/types.ts`)
- **`KnowledgeSourceType`**:
  - `project-code`: Code files from target repository (`scripts.js`, `blocks/*`)
  - `project-docs`: Project-specific design documents, READMEs, architectural notes
  - `standards`: Approved corporate engineering and Franklin block standards
  - `aem-docs`: Official Adobe AEM Cloud documentation
  - `eds-docs`: Official AEM Edge Delivery Services developer documentation
  - `general`: General web development and performance patterns
- **`Chunk`**: `index`, `content`, `tokenCount`, `metadata`.
- **`RetrievalResult`**: `chunkId`, `documentId`, `content`, `similarity`, `weightedScore`, `sourceType`, `sourceTitle`, `metadata`.
- **`RetrievalOptions`**: `topK`, `minSimilarity`, `projectId`, `sourceTypes`, `weights`.

### 2. Error Classes (`src/errors.ts`)
- `RagError` with typed `RagErrorCode`:
  - `EMBEDDING_FAILED`: Vector calculation failure.
  - `DOCUMENT_NOT_FOUND`: Target document missing.
  - `RETRIEVAL_FAILED`: Query execution error.
  - `INVALID_DIMENSIONS`: Vector dimension mismatch (expected 768).
  - `DATABASE_UNAVAILABLE`: Connection failure.

### 3. Document Chunker (`src/chunker.ts`)
- **`DocumentChunker`**:
  - `chunkMarkdown(content)`: Splits markdown respecting headings (`#`, `##`, `###`) and code blocks (` ``` `).
  - `chunkText(content, maxChunkSize, overlap)`: Window sliding algorithm with boundary preservation.

### 4. Embedding Generator (`src/embedder.ts`)
- **`EmbeddingGenerator`**:
  - 768-dimensional vector generator supporting Google Gemini (`text-embedding-004`) and OpenAI (`text-embedding-3-small`).
  - Includes deterministic local tokenizer/vectorizer for offline unit tests.
  - Fast vector cosine similarity calculator.

### 5. Hierarchical Knowledge Retriever (`src/retriever.ts`)
- **`KnowledgeRetriever`**:
  - Executes pgvector queries using cosine distance (`<=>`).
  - Applies Product Vision §53 priority weighting:
    - `project-code`: 1.25x
    - `project-docs`: 1.15x
    - `standards`: 1.10x
    - `aem-docs` / `eds-docs`: 1.05x
    - `general`: 1.00x
  - Ranks and filters results by weighted threshold.

### 6. Knowledge Indexer (`src/indexer.ts`)
- Ingests raw markdown and code files, produces chunks, creates embeddings, and saves records into `knowledge_documents` and `knowledge_chunks`.
