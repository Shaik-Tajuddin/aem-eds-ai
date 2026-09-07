import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getDatabase } from '@aeds/database';
import { projects, projectConfigs, repositories, environments } from '@aeds/database';
import { eq, and, desc, isNull } from '@aeds/database';


// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  source: z.object({
    type: z.enum(['FIGMA', 'EXISTING_WEBSITE', 'EXISTING_AEM_PAGE', 'EXISTING_EDS_PROJECT', 'SCREENSHOT', 'NATURAL_LANGUAGE']),
    url: z.string().optional(),
  }),
  github: z.object({
    repository: z.string().min(1),
    defaultBranch: z.string().default('main'),
    token: z.string().optional(), // stored encrypted, never returned
  }),
  aem: z.object({
    authorUrl: z.string().optional(),
    previewUrl: z.string().optional(),
    environment: z.string().optional().default('production'),
    authoringPath: z.string().optional(),
  }).optional(),
  figma: z.object({
    fileUrl: z.string().optional(),
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
          .select({
            id: projects.id,
            name: projects.name,
            description: projects.description,
            health: projects.health,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt,
            lastRunAt: projects.lastRunAt,
            repo: repositories.fullName,
            branch: repositories.defaultBranch,
            sourceType: projectConfigs.sourceType,
            sourceUrl: projectConfigs.sourceUrl,
            llmProvider: projectConfigs.llmProvider,
            aemAuthorUrl: environments.authorUrl,
            aemEnvironment: environments.previewUrl,
            aemAuthoringPath: environments.authoringPath,
          })
          .from(projects)
          .leftJoin(repositories, eq(repositories.projectId, projects.id))
          .leftJoin(projectConfigs, eq(projectConfigs.projectId, projects.id))
          .leftJoin(environments, eq(environments.projectId, projects.id))
          .where(isNull(projects.archivedAt))
          .orderBy(desc(projects.updatedAt))
          .limit(100);

        const deduped = Array.from(
          rows.reduce((map, row) => {
            if (!map.has(row.id)) {
              map.set(row.id, row);
            }
            return map;
          }, new Map()).values()
        );

        return reply.send({ projects: deduped });
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
        const rows = await db
          .select({
            id: projects.id,
            name: projects.name,
            description: projects.description,
            health: projects.health,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt,
            lastRunAt: projects.lastRunAt,
            repo: repositories.fullName,
            branch: repositories.defaultBranch,
            sourceType: projectConfigs.sourceType,
            sourceUrl: projectConfigs.sourceUrl,
            llmProvider: projectConfigs.llmProvider,
            llmModel: projectConfigs.llmModel,
            aemAuthorUrl: environments.authorUrl,
            aemEnvironment: environments.previewUrl,
            aemAuthoringPath: environments.authoringPath,
          })
          .from(projects)
          .leftJoin(repositories, eq(repositories.projectId, projects.id))
          .leftJoin(projectConfigs, eq(projectConfigs.projectId, projects.id))
          .leftJoin(environments, eq(environments.projectId, projects.id))
          .where(eq(projects.id, id))
          .limit(1);

        if (!rows || rows.length === 0) {
          return reply.code(404).send({ error: 'Project not found' });
        }

        return reply.send({ project: rows[0] });
      } catch (err) {
        request.log.error({ err }, 'Failed to get project');
        return reply.code(500).send({ error: 'Failed to get project' });
      }
    }
  );

  // PATCH /api/projects/:id — update project details
  server.patch<{ Params: { id: string } }>(
    '/:id',
    {
      schema: {
        tags: ['projects'],
        summary: 'Update project details',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const body = request.body as any;

        // 1. Update projects table
        const updateProjectFields: any = { updatedAt: new Date() };
        if (body.name !== undefined) updateProjectFields.name = body.name;
        if (body.description !== undefined) updateProjectFields.description = body.description;
        if (body.health !== undefined) updateProjectFields.health = body.health;

        await db
          .update(projects)
          .set(updateProjectFields)
          .where(eq(projects.id, id));

        // 2. Update repositories if repo/branch provided
        const repoName = body.repo || body.github?.repository;
        const branchName = body.branch || body.github?.defaultBranch;
        if (repoName || branchName) {
          const existingRepo = await db.select().from(repositories).where(eq(repositories.projectId, id)).limit(1);
          if (existingRepo.length > 0) {
            await db
              .update(repositories)
              .set({
                ...(repoName ? { fullName: repoName } : {}),
                ...(branchName ? { defaultBranch: branchName } : {}),
              })
              .where(eq(repositories.projectId, id));
          } else if (repoName) {
            await db.insert(repositories).values({
              projectId: id,
              fullName: repoName,
              defaultBranch: branchName || 'main',
            });
          }
        }

        // 3. Update environments if aem fields provided
        const aemAuthorUrl = body.aemAuthorUrl || body.aem?.authorUrl;
        const aemPreviewUrl = body.aemEnvironment || body.aem?.previewUrl;
        const aemAuthoringPath = body.aemAuthoringPath || body.aem?.authoringPath;
        if (aemAuthorUrl || aemPreviewUrl || aemAuthoringPath) {
          const existingEnv = await db.select().from(environments).where(eq(environments.projectId, id)).limit(1);
          if (existingEnv.length > 0) {
            await db
              .update(environments)
              .set({
                ...(aemAuthorUrl !== undefined ? { authorUrl: aemAuthorUrl } : {}),
                ...(aemPreviewUrl !== undefined ? { previewUrl: aemPreviewUrl } : {}),
                ...(aemAuthoringPath !== undefined ? { authoringPath: aemAuthoringPath } : {}),
              })
              .where(eq(environments.projectId, id));
          } else {
            await db.insert(environments).values({
              projectId: id,
              type: 'aem',
              name: 'production',
              authorUrl: aemAuthorUrl,
              previewUrl: aemPreviewUrl,
              authoringPath: aemAuthoringPath,
            });
          }
        }

        // 4. Update projectConfigs if sourceType/sourceUrl/llmProvider provided
        const sourceType = body.sourceType || body.source?.type;
        const sourceUrl = body.sourceUrl || body.source?.url;
        const llmProvider = body.llmProvider || body.llm?.provider;
        const llmModel = body.llmModel || body.llm?.model;
        if (sourceType || sourceUrl || llmProvider || llmModel) {
          const existingConfig = await db.select().from(projectConfigs).where(eq(projectConfigs.projectId, id)).limit(1);
          if (existingConfig.length > 0) {
            await db
              .update(projectConfigs)
              .set({
                ...(sourceType ? { sourceType } : {}),
                ...(sourceUrl !== undefined ? { sourceUrl } : {}),
                ...(llmProvider !== undefined ? { llmProvider } : {}),
                ...(llmModel !== undefined ? { llmModel } : {}),
              })
              .where(eq(projectConfigs.projectId, id));
          } else if (sourceType) {
            await db.insert(projectConfigs).values({
              projectId: id,
              sourceType,
              sourceUrl,
              llmProvider,
              llmModel,
            });
          }
        }

        return reply.send({ message: 'Project updated successfully' });
      } catch (err) {
        request.log.error({ err }, 'Failed to update project');
        return reply.code(500).send({ error: 'Failed to update project' });
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
