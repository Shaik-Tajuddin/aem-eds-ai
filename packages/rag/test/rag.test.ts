import { describe, it, expect, beforeEach } from 'vitest';
import {
  DocumentChunker,
  EmbeddingGenerator,
  InMemoryRagRepository,
  KnowledgeIndexer,
  KnowledgeRetriever,
  SOURCE_PRIORITY_WEIGHTS,
  RagError,
  RagErrorCode,
} from '../src';

describe('@aeds/rag - RAG & Knowledge Retrieval System', () => {
  describe('DocumentChunker', () => {
    it('splits markdown documents along headings while capturing hierarchy', () => {
      const chunker = new DocumentChunker({ maxChunkSize: 500, chunkOverlap: 50 });
      const markdown = `
# EDS Boilerplate Standards
This document outlines core principles for building Edge Delivery Services blocks.

## Block Architecture
Blocks in EDS are self-contained folders with a JavaScript file and CSS file.

### Decorator Function
Every block exports a default function called decorate(block).
`;

      const chunks = chunker.chunkDocument({
        title: 'EDS Standards',
        source: 'docs/standards.md',
        sourceType: 'standards',
        content: markdown,
      });

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks[0]!.title).toBe('EDS Standards');
      expect(chunks[0]!.metadata.heading).toBe('EDS Boilerplate Standards');
      expect(chunks.some((c) => c.metadata.subheading === 'Decorator Function')).toBe(true);
    });

    it('preserves code blocks without dissecting code arbitrarily', () => {
      const chunker = new DocumentChunker({ maxChunkSize: 400, chunkOverlap: 50 });
      const docWithCode = `
# Hero Block Implementation

\`\`\`javascript
export default function decorate(block) {
  const container = document.createElement('div');
  container.className = 'hero-container';
  [...block.children].forEach((row) => {
    container.appendChild(row);
  });
  block.textContent = '';
  block.appendChild(container);
}
\`\`\`
`;

      const chunks = chunker.chunkDocument({
        title: 'Hero Block',
        source: 'blocks/hero/hero.js',
        sourceType: 'project-code',
        content: docWithCode,
      });

      expect(chunks.length).toBeGreaterThan(0);
      const codeChunk = chunks.find((c) => c.metadata.isCode);
      expect(codeChunk).toBeDefined();
      expect(codeChunk?.metadata.language).toBe('javascript');
      expect(codeChunk?.content).toContain('export default function decorate');
    });

    it('validates invalid overlap options', () => {
      expect(() => {
        new DocumentChunker({ maxChunkSize: 100, chunkOverlap: 120 });
      }).toThrowError(RagError);
    });
  });

  describe('EmbeddingGenerator', () => {
    const embedder = new EmbeddingGenerator({ dimensions: 768 });

    it('generates 768-dimensional normalized unit vectors', async () => {
      const vec = await embedder.embed('AEM Edge Delivery Services block decoration');
      expect(vec).toHaveLength(768);

      // Verify L2 norm = 1.0
      const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
      expect(norm).toBeCloseTo(1.0, 4);
    });

    it('calculates high cosine similarity for semantically identical/similar texts', async () => {
      const textA = 'AEM Edge Delivery Services block decoration in scripts.js';
      const textB = 'AEM Edge Delivery Services block decoration in scripts.js';
      const textC = 'Edge Delivery Services block decorator with scripts';

      const vecA = await embedder.embed(textA);
      const vecB = await embedder.embed(textB);
      const vecC = await embedder.embed(textC);

      const simIdentical = embedder.computeCosineSimilarity(vecA, vecB);
      expect(simIdentical).toBeCloseTo(1.0, 3);

      const simSimilar = embedder.computeCosineSimilarity(vecA, vecC);
      expect(simSimilar).toBeGreaterThan(0.65);
    });

    it('yields low cosine similarity for completely unrelated texts', async () => {
      const textA = 'AEM Edge Delivery Services hero banner block CSS layout';
      const textUnrelated = 'Photosynthesis chlorophyll carbon dioxide light reaction cellular biology';

      const vecA = await embedder.embed(textA);
      const vecUnrelated = await embedder.embed(textUnrelated);

      const sim = embedder.computeCosineSimilarity(vecA, vecUnrelated);
      expect(sim).toBeLessThan(0.35);
    });

    it('throws error when computing similarity on mismatched dimensions', () => {
      const vec768 = new Array(768).fill(0.1);
      const vec128 = new Array(128).fill(0.1);
      expect(() => embedder.computeCosineSimilarity(vec768, vec128)).toThrowError(RagError);
    });
  });

  describe('KnowledgeIndexer & KnowledgeRetriever Integration', () => {
    let repo: InMemoryRagRepository;
    let embedder: EmbeddingGenerator;
    let indexer: KnowledgeIndexer;
    let retriever: KnowledgeRetriever;

    beforeEach(async () => {
      embedder = new EmbeddingGenerator({ dimensions: 768 });
      repo = new InMemoryRagRepository(embedder);
      indexer = new KnowledgeIndexer(repo, embedder, { maxChunkSize: 500, chunkOverlap: 50 });
      retriever = new KnowledgeRetriever(repo, embedder);

      // Ingest sample documents of different source types
      await indexer.ingestBatch([
        {
          title: 'Hero Block Implementation',
          source: 'blocks/hero/hero.js',
          sourceType: 'project-code',
          content: `
# Hero Block
export default function decorate(block) {
  const heading = block.querySelector('h1, h2');
  if (heading) heading.classList.add('hero-title');
}
`,
        },
        {
          title: 'EDS Style Guide',
          source: 'docs/styles.md',
          sourceType: 'standards',
          content: `
# Typography Standards
All headings must use brand tokens and CSS variable --heading-font-family.
Buttons inside hero blocks must have primary variant styling.
`,
        },
        {
          title: 'General Web Design Notes',
          source: 'docs/notes.txt',
          sourceType: 'general',
          content: `
# Hero Concept
Hero sections typically display a banner with an image and heading.
`,
        },
      ]);
    });

    it('indexes documents and creates persistent chunks with embeddings', () => {
      const docs = repo.getAllDocuments();
      expect(docs).toHaveLength(3);

      const chunks = repo.getAllChunks();
      expect(chunks.length).toBeGreaterThanOrEqual(3);
      expect(chunks[0]?.embedding).toHaveLength(768);
    });

    it('retrieves relevant chunks for query and applies hierarchical source weighting', async () => {
      const results = await retriever.retrieve('Hero block heading decoration', {
        topK: 3,
        applySourceWeights: true,
      });

      expect(results.length).toBeGreaterThan(0);
      const topMatch = results[0]!;

      // Project code has 1.25x weight multiplier
      expect(SOURCE_PRIORITY_WEIGHTS['project-code']).toBe(1.25);
      expect(topMatch.sourceWeight).toBeGreaterThanOrEqual(1.0);
      expect(topMatch.weightedScore).toBeGreaterThanOrEqual(topMatch.rawSimilarity);
    });

    it('prioritizes project-code higher when similarity is comparable', async () => {
      // Ingest identical phrasing in project-code vs general
      await indexer.ingestDocument({
        title: 'Cards Block Implementation',
        source: 'blocks/cards/cards.js',
        sourceType: 'project-code',
        content: 'Cards block grid layout implementation for product showcase',
      });
      await indexer.ingestDocument({
        title: 'General Article on Cards',
        source: 'notes/cards.md',
        sourceType: 'general',
        content: 'Cards block grid layout implementation for product showcase',
      });

      const results = await retriever.retrieve('Cards block grid layout implementation', {
        topK: 2,
        applySourceWeights: true,
      });

      expect(results.length).toBe(2);
      expect(results[0]?.chunk.sourceType).toBe('project-code');
      expect(results[0]?.weightedScore).toBeGreaterThan(results[1]?.weightedScore ?? 0);
    });

    it('formats retrieved knowledge into context block for LLM prompts', async () => {
      const results = await retriever.retrieve('Hero block title', { topK: 2 });
      const promptContext = retriever.formatForPrompt(results, 1500);

      expect(promptContext).toContain('### AEM / EDS Knowledge & Standards Context');
      expect(promptContext).toContain('Source:');
      expect(promptContext).toContain('Reference:');
    });

    it('filters by source types when requested', async () => {
      const results = await retriever.retrieve('Hero', {
        sourceTypes: ['standards'],
        topK: 5,
      });

      for (const res of results) {
        expect(res.chunk.sourceType).toBe('standards');
      }
    });
  });
});
