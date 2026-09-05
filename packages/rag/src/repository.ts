import { Chunk, KnowledgeSourceType, RagRepository, RetrievalOptions } from './types';
import { EmbeddingGenerator } from './embedder';
import { knowledgeDocuments, knowledgeChunks, sql, eq, type Database } from '@aeds/database';

/**
 * In-memory repository for fast unit testing and offline local execution.
 */
export class InMemoryRagRepository implements RagRepository {
  private documents: Map<string, {
    id: string;
    projectId?: string | null;
    title: string;
    source: string;
    sourceType: KnowledgeSourceType;
    content: string;
    metadata?: Record<string, unknown>;
    chunksCount: number;
  }> = new Map();

  private chunks: Array<{
    id: string;
    documentId: string;
    projectId?: string | null;
    content: string;
    chunkIndex: number;
    embedding: number[];
    metadata: Record<string, unknown>;
  }> = [];

  private embedder: EmbeddingGenerator;

  constructor(embedder?: EmbeddingGenerator) {
    this.embedder = embedder ?? new EmbeddingGenerator();
  }

  async createDocument(doc: {
    id?: string;
    projectId?: string | null;
    title: string;
    source: string;
    sourceType: string;
    content: string;
    metadata?: Record<string, unknown>;
    chunksCount: number;
  }): Promise<{ id: string }> {
    const id = doc.id ?? `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.documents.set(id, {
      ...doc,
      id,
      sourceType: doc.sourceType as KnowledgeSourceType,
    });
    return { id };
  }

  async createChunks(chunks: Array<{
    documentId: string;
    projectId?: string | null;
    content: string;
    chunkIndex: number;
    embedding: number[];
    metadata: Record<string, unknown>;
  }>): Promise<void> {
    for (const c of chunks) {
      this.chunks.push({
        ...c,
        id: `chunk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      });
    }
  }

  async searchSimilarChunks(
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
  }>> {
    const results: Array<{
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
    }> = [];

    for (const chunk of this.chunks) {
      // Filter by projectId (allow global where projectId is null)
      if (options.projectId && chunk.projectId && chunk.projectId !== options.projectId) {
        continue;
      }

      const doc = this.documents.get(chunk.documentId);
      if (!doc) continue;

      // Filter by sourceTypes if specified
      if (options.sourceTypes && options.sourceTypes.length > 0) {
        if (!options.sourceTypes.includes(doc.sourceType)) {
          continue;
        }
      }

      const sim = this.embedder.computeCosineSimilarity(queryEmbedding, chunk.embedding);
      if (options.minSimilarity !== undefined && sim < options.minSimilarity) {
        continue;
      }

      results.push({
        chunkId: chunk.id,
        documentId: chunk.documentId,
        projectId: chunk.projectId,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
        documentTitle: doc.title,
        documentSource: doc.source,
        documentSourceType: doc.sourceType,
        similarity: sim,
      });
    }

    return results;
  }

  // Helper inspection methods for tests
  getAllDocuments() {
    return Array.from(this.documents.values());
  }

  getAllChunks() {
    return [...this.chunks];
  }

  clear() {
    this.documents.clear();
    this.chunks = [];
  }
}

/**
 * Production Drizzle + PostgreSQL (pgvector) repository.
 */
export class DrizzleRagRepository implements RagRepository {
  constructor(private db: Database) {}

  async createDocument(doc: {
    id?: string;
    projectId?: string | null;
    title: string;
    source: string;
    sourceType: string;
    content: string;
    metadata?: Record<string, unknown>;
    chunksCount: number;
  }): Promise<{ id: string }> {
    const inserted = await this.db.insert(knowledgeDocuments).values({
      ...(doc.id ? { id: doc.id } : {}),
      projectId: doc.projectId ?? null,
      title: doc.title,
      source: doc.source,
      sourceType: doc.sourceType,
      content: doc.content,
      metadata: doc.metadata ?? {},
      chunksCount: doc.chunksCount,
    }).returning({ id: knowledgeDocuments.id });

    return { id: inserted[0]!.id };
  }

  async createChunks(chunks: Array<{
    documentId: string;
    projectId?: string | null;
    content: string;
    chunkIndex: number;
    embedding: number[];
    metadata: Record<string, unknown>;
  }>): Promise<void> {
    if (chunks.length === 0) return;

    await this.db.insert(knowledgeChunks).values(
      chunks.map((c) => ({
        documentId: c.documentId,
        projectId: c.projectId ?? null,
        content: c.content,
        chunkIndex: c.chunkIndex,
        embedding: c.embedding,
        metadata: c.metadata,
      }))
    );
  }

  async searchSimilarChunks(
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
  }>> {
    if (
      !Array.isArray(queryEmbedding) ||
      queryEmbedding.length === 0 ||
      queryEmbedding.some((n) => typeof n !== 'number' || !Number.isFinite(n))
    ) {
      throw new Error('Invalid query embedding: must be a non-empty array of finite numbers');
    }

    // Format query vector as pgvector literal string '[v1,v2,...]'
    const vectorString = `[${queryEmbedding.join(',')}]`;
    const similarityExpr = sql<number>`1 - (${knowledgeChunks.embedding} <=> ${vectorString}::vector)`;

    const query = this.db
      .select({
        chunkId: knowledgeChunks.id,
        documentId: knowledgeChunks.documentId,
        projectId: knowledgeChunks.projectId,
        content: knowledgeChunks.content,
        chunkIndex: knowledgeChunks.chunkIndex,
        metadata: knowledgeChunks.metadata,
        documentTitle: knowledgeDocuments.title,
        documentSource: knowledgeDocuments.source,
        documentSourceType: knowledgeDocuments.sourceType,
        similarity: similarityExpr,
      })
      .from(knowledgeChunks)
      .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id));

    const rows: any[] = await query;

    return rows.map((r) => ({
      chunkId: String(r.chunkId),
      documentId: String(r.documentId),
      projectId: r.projectId ? String(r.projectId) : undefined,
      content: String(r.content),
      chunkIndex: Number(r.chunkIndex),
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      documentTitle: String(r.documentTitle),
      documentSource: String(r.documentSource),
      documentSourceType: r.documentSourceType as KnowledgeSourceType,
      similarity: Number(r.similarity),
    }));
  }
}
