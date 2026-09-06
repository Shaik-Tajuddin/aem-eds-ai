import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '@aeds/database';
import { projects, projectConfigs, repositories, environments } from '@aeds/database';
import { eq, and, desc } from '@aeds/database';


// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  source: z.object({
    type: z.enum(['FIGMA', 'EXISTING_WEBSITE', 'EXISTING_AEM_PAGE', 'EXISTING_EDS_PROJECT', 'SCREENSHOT', 'NATURAL_LANGUAGE']),
    url: z.string().url().optional(),
  }),
  github: z.object({
    repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
    defaultBranch: z.string().default('main'),
    token: z.string().optional(), // stored encrypted, never returned
  }),
  aem: z.object({
    authorUrl: z.string().url(),
    previewUrl: z.string().url(),
    environment: z.string(),
    authoringPath: z.string().optional(),
  }).optional(),
  figma: z.object({
    fileUrl: z.string().url(),
    token: z.string().optional(), // stored encrypted
  }).optional(),
  llm: z.object({
    provider: z.string(),
    apiUrl: z.string().url().optional(),
    apiKey: z.string().optional(), // stored encrypted
    model: z.string(),
    embeddingModel: z.string().optional(),
  }).optional(),
  quality: z.object({
    visualThreshold: z.number().min(0).max(100).default(95),
    accessibilityThreshold: z.number().min(0).max(100).default(95),
    performanceThreshold: z.number().min(0).max(100).default(90),
    maxFixIterations: z.number().min(1).max(20).default(5),
  }).optional(),
  limits: z.object({
    maxRuntimeMinutes: z.number().min(1).max(120).default(30),
    maxToolCalls: z.number().min(1).max(1000).default(250),
    maxLLMCalls: z.number().min(1).max(500).default(100),
  }).optional(),
});

// ─── Projects Plugin ──────────────────────────────────────────────────────────

export const projectsPlugin: FastifyPluginAsync = async (server) => {
  const db = getDatabase();

  // GET /api/projects — list all projects for the authenticated user
  server.get(
    '/',
    {
      schema: {
        tags: ['projects'],
        summary: 'List projects',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const rows = await db
          .select()
          .from(projects)
          .orderBy(desc(projects.updatedAt))
          .limit(100);

        return reply.send({ projects: rows });
      } catch (err) {
        request.log.error({ err }, 'Failed to list projects');
        return reply.code(500).send({ error: 'Failed to list projects' });
      }
    }
  );

  // POST /api/projects — create a new project
  server.post(
    '/',
    {
      schema: {
        tags: ['projects'],
        summary: 'Create project',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const body = CreateProjectSchema.parse(request.body);
        const userId = request.userId ?? 'system';

        // Import security module for encryption
        const { encryptSecret } = await import('../services/secrets.js');

        // Create the project record
        const [project] = await db
          .insert(projects)
          .values({
            name: body.name,
            description: body.description,
            ownerId: userId,
            health: 'UNKNOWN',
          })
          .returning();

        if (!project) {
          return reply.code(500).send({ error: 'Failed to create project' });
        }

        // Create repository record
        await db.insert(repositories).values({
          projectId: project.id,
          fullName: body.github.repository,
          defaultBranch: body.github.defaultBranch,
          encryptedToken: body.github.token
            ? await encryptSecret(body.github.token)
            : undefined,
        });

        // Create AEM environment if provided
        if (body.aem) {
          await db.insert(environments).values({
            projectId: project.id,
            type: 'aem',
            name: body.aem.environment,
            authorUrl: body.aem.authorUrl,
            previewUrl: body.aem.previewUrl,
            authoringPath: body.aem.authoringPath,
          });
        }

        // Create project config
        await db.insert(projectConfigs).values({
          projectId: project.id,
          sourceType: body.source.type,
          sourceUrl: body.source.url,
          figmaFileUrl: body.figma?.fileUrl,
          encryptedFigmaToken: body.figma?.token
            ? await encryptSecret(body.figma.token)
            : undefined,
          llmProvider: body.llm?.provider,
          llmApiUrl: body.llm?.apiUrl,
          encryptedLlmApiKey: body.llm?.apiKey
            ? await encryptSecret(body.llm.apiKey)
            : undefined,
          llmModel: body.llm?.model,
          llmEmbeddingModel: body.llm?.embeddingModel,
          visualThreshold: body.quality?.visualThreshold ?? 95,
          accessibilityThreshold: body.quality?.accessibilityThreshold ?? 95,
          performanceThreshold: body.quality?.performanceThreshold ?? 90,
          maxFixIterations: body.quality?.maxFixIterations ?? 5,
          maxRuntimeMinutes: body.limits?.maxRuntimeMinutes ?? 30,
          maxToolCalls: body.limits?.maxToolCalls ?? 250,
          maxLLMCalls: body.limits?.maxLLMCalls ?? 100,
        });

        return reply.code(201).send({
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            health: project.health,
            createdAt: project.createdAt,
          },
          message: 'Project created successfully',
        });
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Validation failed', details: err.errors });
        }
        request.log.error({ err }, 'Failed to create project');
        return reply.code(500).send({ error: 'Failed to create project' });
      }
    }
  );

  // GET /api/projects/:id — get project detail
  server.get<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['projects'],
        summary: 'Get project detail',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const [project] = await db
          .select()
          .from(projects)
          .where(eq(projects.id, id))
          .limit(1);

        if (!project) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        return reply.send({ project });
      } catch (err) {
        request.log.error({ err }, 'Failed to get project');
        return reply.code(500).send({ error: 'Failed to get project' });
      }
    }
  );

  // DELETE /api/projects/:id — archive a project
  server.delete<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['projects'],
        summary: 'Archive project',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        await db
          .update(projects)
          .set({ archivedAt: new Date() })
          .where(eq(projects.id, id));

        return reply.send({ message: 'Project archived' });
      } catch (err) {
        request.log.error({ err }, 'Failed to archive project');
        return reply.code(500).send({ error: 'Failed to archive project' });
      }
    }
  );
};
