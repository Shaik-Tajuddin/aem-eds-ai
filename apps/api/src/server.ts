// ============================================================
// AI EDS Developer — Fastify API Server
// ============================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { healthPlugin } from './plugins/health.js';
import { authPlugin } from './plugins/auth.js';
import { projectsPlugin } from './routes/projects.js';
import { runsPlugin } from './routes/runs.js';
import { eventsPlugin } from './routes/events.js';
import { githubPlugin } from './routes/github.js';
import { knowledgePlugin } from './routes/knowledge.js';
import { toolsPlugin } from './routes/tools.js';
import { usagePlugin } from './routes/usage.js';
import { uePlugin } from './routes/ue.js';
import { parityPlugin } from './routes/parity.js';

const isDev = process.env['NODE_ENV'] !== 'production';
const port = Number(process.env['API_PORT'] ?? 3001);
const host = process.env['API_HOST'] ?? '0.0.0.0';

// ─── Build the server ─────────────────────────────────────────────────────────

export async function buildServer() {
  const server = Fastify({
    // Large enough for bulk knowledge ingest of long markdown (MASTER BUILD PROMPT, etc.)
    bodyLimit: Number(process.env['API_BODY_LIMIT_BYTES'] ?? 10 * 1024 * 1024),
    logger: {
      level: process.env['LOG_LEVEL'] ?? 'info',
      // Redact sensitive fields from all logs
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          '*.apiKey',
          '*.api_key',
          '*.token',
          '*.password',
          '*.secret',
          '*.encryptedToken',
          '*.encryptedCredentials',
          '*.encryptedLlmApiKey',
          '*.encryptedFigmaToken',
          '*.encryptedGithubToken',
        ],
        censor: '[REDACTED]',
      },
    },
  });

  // ─── Security plugins ───────────────────────────────────────
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
      },
    },
  });

  await server.register(cors, {
    origin: isDev
      ? ['http://localhost:3000']
      : (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    // Higher limits for SSE event streams
    keyGenerator: (request) => {
      return request.url.includes('/events')
        ? `sse-${request.ip}`
        : request.ip;
    },
  });

  // ─── Utility plugins ────────────────────────────────────────
  await server.register(sensible);

  // ─── OpenAPI / Swagger ──────────────────────────────────────
  await server.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'AI EDS Developer API',
        description: 'Autonomous AEM Edge Delivery Services engineering platform',
        version: '0.1.0',
      },
      tags: [
        { name: 'health', description: 'Health checks' },
        { name: 'projects', description: 'Project management' },
        { name: 'runs', description: 'Agent runs' },
        { name: 'events', description: 'Real-time event streams' },
        { name: 'github', description: 'GitHub integration' },
        { name: 'ue', description: 'Universal Editor evidence' },
        { name: 'parity', description: 'Track B MCP page authoring / parity' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  if (isDev) {
    await server.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
    });
  }


  // ─── Application plugins ────────────────────────────────────
  await server.register(healthPlugin, { prefix: '/api' });
  await server.register(authPlugin);

  // ─── Routes ─────────────────────────────────────────────────
  await server.register(projectsPlugin, { prefix: '/api/projects' });
  await server.register(runsPlugin, { prefix: '/api/runs' });
  await server.register(eventsPlugin, { prefix: '/api/events' });
  await server.register(githubPlugin, { prefix: '/api/github' });
  await server.register(knowledgePlugin, { prefix: '/api/knowledge' });
  await server.register(toolsPlugin, { prefix: '/api/tools' });
  await server.register(usagePlugin, { prefix: '/api/usage' });
  await server.register(uePlugin, { prefix: '/api/ue' });
  await server.register(parityPlugin, { prefix: '/api/parity' });

  return server;
}

// ─── Start ────────────────────────────────────────────────────────────────────

let currentServer: Awaited<ReturnType<typeof buildServer>> | null = null;

async function start() {
  try {
    currentServer = await buildServer();
    await currentServer.listen({ port, host });
    currentServer.log.info(`AI EDS Developer API running on http://${host}:${port}`);
    if (isDev) {
      currentServer.log.info(`OpenAPI docs: http://localhost:${port}/docs`);
    }
  } catch (err) {
    console.error('Failed to start API server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  if (currentServer) {
    try {
      await currentServer.close();
    } catch {}
  }
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

if (process.env['NODE_ENV'] !== 'test') {
  start();
}
