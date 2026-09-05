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
      // In development or test allow unauthenticated access when SKIP_AUTH is true
      if ((process.env['NODE_ENV'] === 'development' || process.env['NODE_ENV'] === 'test') && process.env['SKIP_AUTH'] === 'true') {
        request.userId = 'dev-user-id';
        request.userEmail = 'dev@local';
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
      // In production this validates the NextAuth session JWT
      const apiSecret = process.env['API_SECRET_KEY'];
      if (!apiSecret) {
        throw new Error('API_SECRET_KEY not configured');
      }

      // For MVP: simple static token validation
      // Phase 2: validate NextAuth JWT with proper signature verification
      if (token === apiSecret) {
        request.userId = 'system';
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
