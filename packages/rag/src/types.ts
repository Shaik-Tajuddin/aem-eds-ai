import { z } from 'zod';

export const KnowledgeSourceTypeSchema = z.enum([
  'project-code',
  'project-docs',
  'standards',
  'aem-docs',
  'eds-docs',
  'custom',
  'general',
]);

export type KnowledgeSourceType = z.infer<typeof KnowledgeSourceTypeSchema>;

/**
 * Hierarchical source priority multipliers as specified in system design:
 * project-code (1.25x) > project-docs (1.15x) > standards (1.10x) > aem/eds docs (1.05x) > general/custom (1.0x)
 */
export const SOURCE_PRIORITY_WEIGHTS: Record<KnowledgeSourceType, number> = {
  'project-code': 1.25,
  'project-docs': 1.15,
  standards: 1.10,
  'aem-docs': 1.05,
  'eds-docs': 1.05,
  custom: 1.0,
  general: 1.0,
};

export interface ChunkMetadata {
  heading?: string;
  subheading?: string;
  sourceFile?: string;
  language?: string;
  isCode?: boolean;
  startLine?: number;
  endLine?: number;
  tokenCount?: number;
  [key: string]: unknown;
}

export interface Chunk {
  id?: string;
  documentId?: string;
  projectId?: string | null;
  content: string;
  chunkIndex: number;
  embedding?: number[];
  metadata: ChunkMetadata;
  sourceType: KnowledgeSourceType;
  title: string;
  source: string;
}

export interface DocumentIngestInput {
  projectId?: string | null;
  title: string;
  source: string;
  sourceType: KnowledgeSourceType;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface IngestionResult {
  documentId: string;
  title: string;
  source: string;
  sourceType: KnowledgeSourceType;
  chunksCount: number;
  totalTokens: number;
}

export interface RetrievalOptions {
  projectId?: string | null;
  topK?: number;
  minSimilarity?: number;
  sourceTypes?: KnowledgeSourceType[];
  applySourceWeights?: boolean;
  maxTokens?: number;
}

export interface RetrievalResult {
  chunk: Chunk;
  rawSimilarity: number;
  weightedScore: number;
  sourceWeight: number;
}

export interface RagRepository {
  createDocument(doc: {
    id?: string;
    projectId?: string | null;
    title: string;
    source: string;
    sourceType: string;
    content: string;
    metadata?: Record<string, unknown>;
    chunksCount: number;
  }): Promise<{ id: string }>;

  createChunks(chunks: Array<{
    documentId: string;
    projectId?: string | null;
    content: string;
    chunkIndex: number;
    embedding: number[];
    metadata: Record<string, unknown>;
  }>): Promise<void>;

  searchSimilarChunks(
    queryEmbedding: number[],
    options: RetrievalOptions
  ): Promise<Array<{
    chunkId: string;
    documentId: string;
    projectId?: string | null;
    content: string;
    chunkIndex: number;
    embedding?: number[];
    metadata: Record<string, unknown>;
    documentTitle: string;
    documentSource: string;
    documentSourceType: KnowledgeSourceType;
    similarity: number;
  }>>;
}
