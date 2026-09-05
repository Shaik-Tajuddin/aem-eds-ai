import type { FastifyPluginAsync } from 'fastify';
import { getDatabase } from '@aeds/database';

export const healthPlugin: FastifyPluginAsync = async (server) => {
  server.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Platform health check',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              version: { type: 'string' },
              timestamp: { type: 'string' },
              services: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                  redis: { type: 'string' },
                },
              },
            },
          },
          503: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              version: { type: 'string' },
              timestamp: { type: 'string' },
              services: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                  redis: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const services: Record<string, string> = {};

      // Check database
      try {
        const db = getDatabase();
        services['database'] = db ? 'ok' : 'error';
      } catch {
        services['database'] = 'unavailable';
      }

      // Check Redis (optional at startup)
      try {
        const redisUrl = process.env['REDIS_URL'];
        services['redis'] = redisUrl ? 'configured' : 'not-configured';
      } catch {
        services['redis'] = 'unavailable';
      }

      const allOk = Object.values(services).every((s) => s === 'ok' || s === 'configured');

      return reply.status(allOk ? 200 : 503).send({
        status: allOk ? 'ok' : 'degraded',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        services,
      });
    }
  );
};
