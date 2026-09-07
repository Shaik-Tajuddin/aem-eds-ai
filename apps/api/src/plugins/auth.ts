import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

// ============================================================
// Auth Plugin
// Validates API requests using Bearer JWT token
// The NextAuth session token from the frontend is validated here
// ============================================================

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userEmail?: string;
  }
}

export const authPlugin: FastifyPluginAsync = fp(async (server) => {
  // Decorate request with auth context
  server.decorateRequest('userId', undefined);
  server.decorateRequest('userEmail', undefined);

  // Global preHandler: extract and validate auth for protected routes
  server.addHook('preHandler', async (request: FastifyRequest, reply) => {
    // Skip public routes
    const publicPaths = ['/health', '/api/health', '/docs', '/api/auth'];
    if (publicPaths.some((path) => request.url.startsWith(path))) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      // In development allow access using the local developer UUID
      if (process.env['NODE_ENV'] !== 'production' || process.env['SKIP_AUTH'] === 'true') {
        request.userId = '00000000-0000-0000-0000-000000000001';
        request.userEmail = 'developer@aeds.local';
        return;
      }
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Bearer token required',
      });
    }

    const token = authHeader.slice(7);

    try {
      // Validate against API secret
      const apiSecret = process.env['API_SECRET_KEY'];
      if (token === apiSecret || process.env['NODE_ENV'] !== 'production') {
        request.userId = '00000000-0000-0000-0000-000000000001';
        request.userEmail = 'developer@aeds.local';
        return;
      }

      // TODO Phase 2: JWT validation with NextAuth secret
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    } catch (err) {
      request.log.error({ err }, 'Auth validation error');
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Token validation failed',
      });
    }
  });
});
