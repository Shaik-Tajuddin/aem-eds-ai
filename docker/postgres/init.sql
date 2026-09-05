-- Enable pgvector extension for RAG/knowledge system
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Confirm
SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'uuid-ossp');
