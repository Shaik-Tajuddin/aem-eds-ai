import {
  DocumentIngestInput,
  IngestionResult,
  RagRepository,
} from './types';
import { DocumentChunker, ChunkerOptions } from './chunker';
import { EmbeddingGenerator } from './embedder';
import { RagError, RagErrorCode } from './errors';

export class KnowledgeIndexer {
  private readonly chunker: DocumentChunker;

  constructor(
    private readonly repository: RagRepository,
    private readonly embedder: EmbeddingGenerator = new EmbeddingGenerator(),
    chunkerOptions?: ChunkerOptions
  ) {
    this.chunker = new DocumentChunker(chunkerOptions);
  }

  /**
   * Ingest, chunk, embed, and persist a single knowledge document.
   */
  async ingestDocument(input: DocumentIngestInput): Promise<IngestionResult> {
    if (!input.title || !input.content || !input.source) {
      throw new RagError(
        RagErrorCode.INVALID_INPUT,
        'Document title, content, and source are required'
      );
    }

    try {
      // 1. Chunk document
      const chunks = this.chunker.chunkDocument({
        title: input.title,
        source: input.source,
        sourceType: input.sourceType,
        content: input.content,
        projectId: input.projectId,
      });

      // 2. Generate embeddings for all chunks in batch
      const textsToEmbed = chunks.map((c) => c.content);
      const embeddings = await this.embedder.embedBatch(textsToEmbed);

      // 3. Create document in repository
      const doc = await this.repository.createDocument({
        projectId: input.projectId ?? null,
        title: input.title,
        source: input.source,
        sourceType: input.sourceType,
        content: input.content,
        metadata: input.metadata ?? {},
        chunksCount: chunks.length,
      });

      // 4. Create chunk records with vectors
      const chunkRecords = chunks.map((c, idx) => ({
        documentId: doc.id,
        projectId: input.projectId ?? null,
        content: c.content,
        chunkIndex: c.chunkIndex,
        embedding: embeddings[idx]!,
        metadata: c.metadata as Record<string, unknown>,
      }));

      await this.repository.createChunks(chunkRecords);

      const totalTokens = chunks.reduce(
        (sum, c) => sum + (c.metadata.tokenCount ?? 0),
        0
      );

      return {
        documentId: doc.id,
        title: input.title,
        source: input.source,
        sourceType: input.sourceType,
        chunksCount: chunks.length,
        totalTokens,
      };
    } catch (err: unknown) {
      if (err instanceof RagError) throw err;
      throw new RagError(
        RagErrorCode.INDEXING_FAILED,
        `Document indexing failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Ingest multiple documents in sequence.
   */
  async ingestBatch(inputs: DocumentIngestInput[]): Promise<IngestionResult[]> {
    const results: IngestionResult[] = [];
    for (const input of inputs) {
      const res = await this.ingestDocument(input);
      results.push(res);
    }
    return results;
  }
}
