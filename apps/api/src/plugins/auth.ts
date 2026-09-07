import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { createHmac, timingSafeEqual } from 'node:crypto';

// ============================================================
// Auth Plugin
// Production: require Bearer API_SECRET_KEY or HS256 JWT (NEXTAUTH_SECRET)
// Development: optional bypass via SKIP_AUTH=true or missing Bearer
// ============================================================

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userEmail?: string;
  }
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

/**
 * Minimal HS256 JWT verify (NextAuth-compatible secret).
 * Does not invent success — returns null when invalid/expired.
 */
function verifyHs256Jwt(
  token: string,
  secret: string,
): { sub?: string; email?: string; exp?: number } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts as [string, string, string];
  try {
    const header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
    if (header.alg !== 'HS256') return null;
    const data = `${headerB64}.${payloadB64}`;
    const expected = createHmac('sha256', secret).update(data).digest();
    const actual = base64UrlDecode(sigB64);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const authPlugin: FastifyPluginAsync = fp(async (server) => {
  server.decorateRequest('userId', undefined);
  server.decorateRequest('userEmail', undefined);

  server.addHook('preHandler', async (request: FastifyRequest, reply) => {
    const publicPaths = ['/health', '/api/health', '/docs', '/api/auth'];
    if (publicPaths.some((path) => request.url.startsWith(path))) {
      return;
    }

    const isProduction = process.env['NODE_ENV'] === 'production';
    const skipAuth = process.env['SKIP_AUTH'] === 'true';
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      if (!isProduction || skipAuth) {
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
    const apiSecret = process.env['API_SECRET_KEY'];
    const jwtSecret = process.env['NEXTAUTH_SECRET'] || process.env['JWT_SECRET'];

    if (apiSecret && safeEqual(token, apiSecret)) {
      request.userId = '00000000-0000-0000-0000-000000000001';
      request.userEmail = 'service@aeds.local';
      return;
    }

    if (jwtSecret) {
      const payload = verifyHs256Jwt(token, jwtSecret);
      if (payload) {
        request.userId = String(payload.sub || '00000000-0000-0000-0000-000000000001');
        request.userEmail = String(payload.email || 'user@aeds.local');
        return;
      }
    }

    // Dev-only: any Bearer accepted when explicitly allowed
    if (!isProduction && process.env['ALLOW_ANY_BEARER'] === 'true') {
      request.userId = '00000000-0000-0000-0000-000000000001';
      request.userEmail = 'developer@aeds.local';
      return;
    }

    // Legacy non-prod: accept Bearer when not production (documented; prefer API_SECRET_KEY)
    if (!isProduction) {
      request.userId = '00000000-0000-0000-0000-000000000001';
      request.userEmail = 'developer@aeds.local';
      return;
    }

    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid token — provide API_SECRET_KEY Bearer or HS256 JWT signed with NEXTAUTH_SECRET',
    });
  });
});
