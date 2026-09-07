import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '@aeds/database';
import { knowledgeDocuments, knowledgeChunks, eq, desc } from '@aeds/database';
import { LLMGateway } from '@aeds/llm';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'of', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were',
  'be', 'to', 'for', 'in', 'on', 'at', 'by', 'with', 'from', 'as', 'or', 'and', 'it',
  'its', 'into', 'about', 'what', 'how', 'why', 'when', 'where', 'who', 'which', 'do',
  'does', 'did', 'can', 'could', 'should', 'would', 'me', 'my', 'our', 'your', 'their',
]);

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function createLlmGatewayFromEnv(): LLMGateway {
  const providerId = LLMGateway.normalizeProviderId(process.env.LLM_PROVIDER);
  const apiUrl = process.env.LLM_API_URL;
  const apiKey =
    process.env.LLM_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    process.env.AZURE_OPENAI_API_KEY;
  const model = process.env.LLM_MODEL || 'gpt-4o';
  const maxTokens = Number(process.env.LLM_MAX_TOKENS || 2000);
  const temperature = Number(process.env.LLM_TEMPERATURE || 0.2);

  const providerConfig = {
    provider: providerId,
    apiUrl,
    model,
    embeddingModel: process.env.LLM_EMBEDDING_MODEL || process.env.EMBEDDING_MODEL,
    maxTokens: Number.isFinite(maxTokens) ? maxTokens : 2000,
    temperature: Number.isFinite(temperature) ? temperature : 0.2,
    timeoutMs: 90000,
    azureDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    azureApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  };

  const gateway = new LLMGateway({
    defaultProvider: providerId,
    providers: [providerConfig],
  });
  gateway.registerProvider(providerConfig, apiKey);
  return gateway;
}

async function keywordSearchDocs(
  db: ReturnType<typeof getDatabase>,
  query: string,
  topK: number,
) {
  const tokens = tokenizeQuery(query);
  const docs = await db
    .select({
      id: knowledgeDocuments.id,
      title: knowledgeDocuments.title,
      source: knowledgeDocuments.source,
      sourceType: knowledgeDocuments.sourceType,
      content: knowledgeDocuments.content,
    })
    .from(knowledgeDocuments)
    .orderBy(desc(knowledgeDocuments.updatedAt))
    .limit(200);

  const scored = docs
    .map((d) => {
      const hay = `${d.title}\n${d.source}\n${d.content}`.toLowerCase();
      if (tokens.length === 0) {
        const phrase = query.toLowerCase().trim();
        return { ...d, score: phrase && hay.includes(phrase) ? 1 : 0 };
      }
      let hits = 0;
      let titleBoost = 0;
      for (const t of tokens) {
        if (hay.includes(t)) hits += 1;
        if (d.title.toLowerCase().includes(t)) titleBoost += 0.15;
      }
      const score = hits / tokens.length + titleBoost;
      return { ...d, score };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map((d) => ({
    chunkId: d.id,
    documentId: d.id,
    title: d.title,
    source: d.source,
    sourceType: d.sourceType,
    content: d.content.slice(0, 2000),
    rawSimilarity: Number(Math.min(1, d.score).toFixed(3)),
    weightedScore: Number(Math.min(1, d.score).toFixed(3)),
    sourceWeight: 1,
  }));
}

export const knowledgePlugin: FastifyPluginAsync = async (server) => {
  const db = getDatabase();

  // GET /api/knowledge — list all knowledge documents
  server.get(
    '/',
    {
      schema: {
        tags: ['knowledge'],
        summary: 'List knowledge documents',
      },
    },
    async (request, reply) => {
      try {
        const rows = await db
          .select({
            id: knowledgeDocuments.id,
            title: knowledgeDocuments.title,
            source: knowledgeDocuments.source,
            sourceType: knowledgeDocuments.sourceType,
            content: knowledgeDocuments.content,
            chunksCount: knowledgeDocuments.chunksCount,
            metadata: knowledgeDocuments.metadata,
            ingestedAt: knowledgeDocuments.ingestedAt,
            updatedAt: knowledgeDocuments.updatedAt,
          })
          .from(knowledgeDocuments)
          .orderBy(desc(knowledgeDocuments.updatedAt))
          .limit(100);

        return reply.send({ documents: rows });
      } catch (err) {
        request.log.error({ err }, 'Failed to list knowledge documents');
        return reply.code(500).send({ error: 'Failed to list knowledge documents' });
      }
    }
  );

  // POST /api/knowledge/search — semantic (or keyword fallback) retrieval
  server.post<{
    Body: { query: string; topK?: number; projectId?: string; applySourceWeights?: boolean };
  }>(
    '/search',
    {
      schema: {
        tags: ['knowledge'],
        summary: 'Search knowledge chunks (RAG when available; keyword fallback)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const BodySchema = z.object({
        query: z.string().min(1),
        topK: z.number().int().min(1).max(50).optional(),
        projectId: z.string().uuid().optional(),
        applySourceWeights: z.boolean().optional(),
      });

      try {
        const body = BodySchema.parse(request.body);
        const topK = body.topK ?? 5;

        try {
          const rag = await import('@aeds/rag');
          const repository = new rag.DrizzleRagRepository(db as any);
          const retriever = new rag.KnowledgeRetriever(repository);
          const results = await retriever.retrieve(body.query, {
            topK,
            projectId: body.projectId,
            applySourceWeights: body.applySourceWeights ?? true,
          });

          if (results.length > 0) {
            return reply.send({
              mode: 'rag',
              empty: false,
              results: results.map((r) => ({
                chunkId: r.chunk.id,
                documentId: r.chunk.documentId,
                title: r.chunk.title,
                source: r.chunk.source,
                sourceType: r.chunk.sourceType,
                content: r.chunk.content,
                rawSimilarity: r.rawSimilarity,
                weightedScore: r.weightedScore,
                sourceWeight: r.sourceWeight,
              })),
            });
          }
        } catch (ragErr) {
          request.log.warn({ err: ragErr }, 'RAG retrieve unavailable — falling back to keyword search');
        }

        const scored = await keywordSearchDocs(db, body.query, topK);

        return reply.send({
          mode: 'keyword_fallback',
          empty: scored.length === 0,
          message:
            scored.length === 0
              ? 'No matching knowledge documents — ingest content or ensure embeddings are indexed'
              : undefined,
          results: scored,
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Validation failed', details: err.errors });
        }
        request.log.error({ err }, 'Knowledge search failed');
        return reply.code(500).send({ error: 'Knowledge search failed' });
      }
    },
  );

  // POST /api/knowledge/ask — retrieve context + LLM answer
  server.post<{
    Body: { query: string; topK?: number; projectId?: string };
  }>(
    '/ask',
    {
      schema: {
        tags: ['knowledge'],
        summary: 'Ask a question over knowledge docs (retrieve + LLM answer)',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const BodySchema = z.object({
        query: z.string().min(1).max(2000),
        topK: z.number().int().min(1).max(12).optional(),
        projectId: z.string().uuid().optional(),
      });

      try {
        const body = BodySchema.parse(request.body);
        const topK = body.topK ?? 6;

        let mode = 'keyword_fallback';
        let results: Awaited<ReturnType<typeof keywordSearchDocs>> = [];

        try {
          const rag = await import('@aeds/rag');
          const repository = new rag.DrizzleRagRepository(db as any);
          const retriever = new rag.KnowledgeRetriever(repository);
          const ragResults = await retriever.retrieve(body.query, {
            topK,
            projectId: body.projectId,
            applySourceWeights: true,
          });
          if (ragResults.length > 0) {
            mode = 'rag';
            results = ragResults.map((r) => ({
              chunkId: r.chunk.id,
              documentId: r.chunk.documentId,
              title: r.chunk.title || 'Untitled',
              source: r.chunk.source || 'unknown',
              sourceType: r.chunk.sourceType || 'custom',
              content: r.chunk.content,
              rawSimilarity: r.rawSimilarity,
              weightedScore: r.weightedScore,
              sourceWeight: r.sourceWeight,
            }));
          }
        } catch (ragErr) {
          request.log.warn({ err: ragErr }, 'RAG unavailable for /ask — keyword fallback');
        }

        if (results.length === 0) {
          results = await keywordSearchDocs(db, body.query, topK);
        }

        if (results.length === 0) {
          return reply.send({
            mode,
            empty: true,
            answer: null,
            message: 'No matching knowledge documents found for this question.',
            results: [],
          });
        }

        const context = results
          .slice(0, topK)
          .map(
            (r, i) =>
              `### Source [${i + 1}] ${r.title}\nPath: ${r.source}\n\n${r.content.slice(0, 1800)}`,
          )
          .join('\n\n---\n\n');

        try {
          const gateway = createLlmGatewayFromEnv();
          const llmPromise = gateway.executeChat(
            {
              model: process.env.LLM_MODEL || undefined,
              temperature: 0.2,
              maxTokens: Math.min(Number(process.env.LLM_MAX_TOKENS || 1200), 2000),
              messages: [
                {
                  role: 'system',
                  content:
                    'You are the AI EDS Developer knowledge assistant. Answer using ONLY the provided knowledge sources. Be concise and concrete. If sources are incomplete, say what is known and what is missing. Cite sources as [1], [2], etc.',
                },
                {
                  role: 'user',
                  content: `Question: ${body.query}\n\nKnowledge sources:\n\n${context}\n\nWrite a clear answer for the user.`,
                },
              ],
            },
            `knowledge-ask-${Date.now()}`,
          );

          const askTimeoutMs = Math.min(Number(process.env.KNOWLEDGE_ASK_TIMEOUT_MS || 12000), 60000);
          const llm = await Promise.race([
            llmPromise,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`LLM timed out after ${askTimeoutMs}ms`)), askTimeoutMs),
            ),
          ]);

          return reply.send({
            mode: `${mode}+llm`,
            empty: false,
            answer: llm.response.content?.trim() || null,
            model: llm.metrics.model,
            results,
          });
        } catch (llmErr: unknown) {
          const message = llmErr instanceof Error ? llmErr.message : String(llmErr);
          request.log.warn({ err: llmErr }, 'LLM ask failed — returning retrieved sources only');
          const top = results[0]!;
          const extractive = [
            `Based on **${top.title}** (${top.source}):`,
            '',
            top.content.slice(0, 900).trim(),
            results.length > 1
              ? `\n\nAlso related: ${results
                  .slice(1, 4)
                  .map((r) => r.title)
                  .join('; ')}.`
              : '',
            `\n\n_(LLM unavailable: ${message})_`,
          ].join('\n');

          return reply.send({
            mode: `${mode}+extractive`,
            empty: false,
            answer: extractive,
            message: `LLM unavailable — showing retrieved source excerpt. ${message}`,
            results,
          });
        }
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Validation failed', details: err.errors });
        }
        request.log.error({ err }, 'Knowledge ask failed');
        return reply.code(500).send({ error: 'Knowledge ask failed' });
      }
    },
  );

  // GET /api/knowledge/:id — get document detail
  server.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['knowledge'],
        summary: 'Get knowledge document detail',
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const [doc] = await db
          .select()
          .from(knowledgeDocuments)
          .where(eq(knowledgeDocuments.id, id))
          .limit(1);

        if (!doc) {
          return reply.code(404).send({ error: 'Document not found' });
        }

        const chunks = await db
          .select()
          .from(knowledgeChunks)
          .where(eq(knowledgeChunks.documentId, id))
          .limit(50);

        return reply.send({ document: doc, chunks });
      } catch (err) {
        request.log.error({ err }, 'Failed to get knowledge document');
        return reply.code(500).send({ error: 'Failed to get knowledge document' });
      }
    }
  );

  // POST /api/knowledge — ingest a document (+ optional RAG chunk/embed)
  server.post(
    '/',
    {
      schema: {
        tags: ['knowledge'],
        summary: 'Ingest knowledge document',
      },
    },
    async (request, reply) => {
      try {
        const IngestSchema = z.object({
          title: z.string().min(1),
          source: z.string().min(1),
          sourceType: z.enum(['project-code', 'project-docs', 'standards', 'eds-docs', 'aem-docs', 'custom']),
          content: z.string().min(1),
          projectId: z.string().uuid().optional(),
        });

        const body = IngestSchema.parse(request.body);

        try {
          const rag = await import('@aeds/rag');
          const repository = new rag.DrizzleRagRepository(db as any);
          const indexer = new rag.KnowledgeIndexer(repository);
          const result = await indexer.ingestDocument({
            title: body.title,
            source: body.source,
            sourceType: body.sourceType as any,
            content: body.content,
            projectId: body.projectId,
          });
          return reply.code(201).send({
            document: {
              id: result.documentId,
              title: body.title,
              source: body.source,
              sourceType: body.sourceType,
              chunksCount: result.chunksCreated,
            },
            indexed: true,
            message: 'Document ingested and indexed',
          });
        } catch (indexErr) {
          request.log.warn({ err: indexErr }, 'RAG indexer unavailable — storing document without embeddings');
        }

        const [doc] = await db
          .insert(knowledgeDocuments)
          .values({
            title: body.title,
            source: body.source,
            sourceType: body.sourceType,
            content: body.content,
            projectId: body.projectId,
            chunksCount: Math.max(1, Math.ceil(body.content.length / 400)),
          })
          .returning();

        return reply.code(201).send({
          document: doc,
          indexed: false,
          message: 'Document stored without embeddings (indexer unavailable)',
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Validation failed', details: err.errors });
        }
        request.log.error({ err }, 'Failed to ingest knowledge document');
        return reply.code(500).send({ error: 'Failed to ingest knowledge document' });
      }
    }
  );
};
