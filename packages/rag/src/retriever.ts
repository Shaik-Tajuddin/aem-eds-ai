import {
  KnowledgeSourceType,
  RagRepository,
  RetrievalOptions,
  RetrievalResult,
  SOURCE_PRIORITY_WEIGHTS,
} from './types';
import { EmbeddingGenerator } from './embedder';
import { RagError, RagErrorCode } from './errors';

export class KnowledgeRetriever {
  constructor(
    private readonly repository: RagRepository,
    private readonly embedder: EmbeddingGenerator = new EmbeddingGenerator()
  ) {}

  /**
   * Retrieve semantically relevant knowledge chunks for a query, applying hierarchical source weighting.
   */
  async retrieve(
    query: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult[]> {
    if (!query || !query.trim()) {
      return [];
    }

    const topK = options.topK ?? 5;
    const applyWeights = options.applySourceWeights ?? true;

    try {
      // 1. Generate query embedding
      const queryEmbedding = await this.embedder.embed(query);

      // 2. Fetch candidates from repository
      const candidates = await this.repository.searchSimilarChunks(
        queryEmbedding,
        options
      );

      // 3. Compute weighted scores based on source hierarchy
      const results: RetrievalResult[] = candidates.map((item) => {
        const sourceWeight = applyWeights
          ? (SOURCE_PRIORITY_WEIGHTS[item.documentSourceType] ?? 1.0)
          : 1.0;
        const weightedScore = item.similarity * sourceWeight;

        return {
          chunk: {
            id: item.chunkId,
            documentId: item.documentId,
            projectId: item.projectId,
            content: item.content,
            chunkIndex: item.chunkIndex,
            embedding: item.embedding,
            metadata: item.metadata,
            title: item.documentTitle,
            source: item.documentSource,
            sourceType: item.documentSourceType,
          },
          rawSimilarity: Math.round(item.similarity * 10000) / 10000,
          weightedScore: Math.round(weightedScore * 10000) / 10000,
          sourceWeight,
        };
      });

      // 4. Sort descending by weighted score
      results.sort((a, b) => b.weightedScore - a.weightedScore);

      // 5. Deduplicate and return topK
      const uniqueResults: RetrievalResult[] = [];
      const seenContent = new Set<string>();

      for (const res of results) {
        // Simple deduplication on first 100 chars
        const key = res.chunk.content.substring(0, 100).trim();
        if (seenContent.has(key)) continue;
        seenContent.add(key);
        uniqueResults.push(res);

        if (uniqueResults.length >= topK) break;
      }

      return uniqueResults;
    } catch (err: unknown) {
      if (err instanceof RagError) throw err;
      throw new RagError(
        RagErrorCode.RETRIEVAL_FAILED,
        `Knowledge retrieval failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  /**
   * Formats retrieved chunks into an LLM-ready context block for system / agent prompts.
   */
  formatForPrompt(results: RetrievalResult[], maxTokens = 3000): string {
    if (results.length === 0) {
      return '';
    }

    const lines: string[] = [
      '### AEM / EDS Knowledge & Standards Context',
      'The following authoritative project code, standards, and documentation should inform the implementation:',
      '',
    ];

    let estimatedTokens = 20;

    for (let i = 0; i < results.length; i++) {
      const res = results[i]!;
      const chunk = res.chunk;
      const heading = chunk.metadata.heading ? ` > ${chunk.metadata.heading}` : '';
      const chunkTokens = Math.ceil(chunk.content.length / 4);

      if (estimatedTokens + chunkTokens > maxTokens) {
        lines.push('*(Additional context truncated to satisfy token budget)*');
        break;
      }

      lines.push(
        `#### [${i + 1}] Source: ${chunk.title}${heading} (Type: ${chunk.sourceType}, Relevance: ${(res.weightedScore * 100).toFixed(1)}%)`
      );
      lines.push(`Reference: \`${chunk.source}\``);
      lines.push('```' + (chunk.metadata.language ?? '') + '\n' + chunk.content + '\n```');
      lines.push('');

      estimatedTokens += chunkTokens + 30;
    }

    return lines.join('\n');
  }
}
