import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '@aeds/database';
import { knowledgeDocuments, knowledgeChunks } from '@aeds/database';
import { eq, desc } from '@aeds/database';

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

  // POST /api/knowledge — ingest a document
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

        return reply.code(201).send({ document: doc, message: 'Document ingested successfully' });
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
