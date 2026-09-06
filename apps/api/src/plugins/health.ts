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

  // ─── Live Integration & Credentials Verification ───────────────────────────
  server.get(
    '/health/integrations',
    {
      schema: {
        tags: ['health'],
        summary: 'Verify validity and scopes of all active environment keys & integrations',
      },
    },
    async (_request, reply) => {
      interface CheckResult {
        id: string;
        name: string;
        status: 'PASS' | 'WARN' | 'FAIL';
        message: string;
        latencyMs?: number;
        config: string;
      }

      const results: CheckResult[] = [];

      // 1. PostgreSQL Database
      const dbStart = Date.now();
      try {
        const { getDatabase, sql } = await import('@aeds/database');
        const db = getDatabase();
        await db.execute(sql`SELECT 1 as ping`);
        const extRes = await db.execute(sql`SELECT extname FROM pg_extension WHERE extname = 'vector'`);
        const hasVector = (extRes as any).rows?.length > 0 || (Array.isArray(extRes) && (extRes as any).length > 0);
        results.push({
          id: 'database',
          name: 'PostgreSQL + pgvector',
          status: 'PASS',
          latencyMs: Date.now() - dbStart,
          message: hasVector
            ? 'Connected to database with pgvector extension enabled'
            : 'Connected to database (pgvector extension not detected)',
          config: 'localhost:5432/aeds_dev',
        });
      } catch (err: any) {
        results.push({
          id: 'database',
          name: 'PostgreSQL + pgvector',
          status: 'FAIL',
          latencyMs: Date.now() - dbStart,
          message: `Database unreachable: ${err.message || err}`,
          config: 'localhost:5432/aeds_dev',
        });
      }

      // 2. Redis BullMQ Queue
      const redisStart = Date.now();
      const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
      try {
        const ioredisModule = await import('ioredis');
        const RedisConstructor: any =
          (ioredisModule as any).default?.default ||
          (ioredisModule as any).default ||
          (ioredisModule as any).Redis;
        const client = new RedisConstructor(redisUrl, { connectTimeout: 1500, maxRetriesPerRequest: 1 });
        await client.ping();
        await client.quit();
        results.push({
          id: 'redis',
          name: 'Redis Queue (BullMQ)',
          status: 'PASS',
          latencyMs: Date.now() - redisStart,
          message: 'Redis server responding to PING',
          config: `localhost:6379 (Prefix: ${process.env['REDIS_PREFIX'] ?? 'aeds:'})`,
        });
      } catch (err: any) {
        results.push({
          id: 'redis',
          name: 'Redis Queue (BullMQ)',
          status: 'FAIL',
          latencyMs: Date.now() - redisStart,
          message: `Redis connection failed: ${err.message || err}`,
          config: 'localhost:6379',
        });
      }

      // 3. Cryptographic Master Key (AES-256-GCM)
      const encKey = process.env['ENCRYPTION_KEY'];
      if (!encKey) {
        results.push({
          id: 'encryption',
          name: 'AES-256-GCM Encryption',
          status: 'FAIL',
          message: 'ENCRYPTION_KEY missing in environment variables',
          config: 'Not set in .env',
        });
      } else if (Buffer.from(encKey, 'hex').length !== 32) {
        results.push({
          id: 'encryption',
          name: 'AES-256-GCM Encryption',
          status: 'FAIL',
          message: `Invalid key length (${Buffer.from(encKey, 'hex').length} bytes). Must be 32-byte hex (64 hex characters).`,
          config: 'Invalid length',
        });
      } else {
        try {
          const { encryptSecret, decryptSecret } = await import('../services/secrets.js');
          const testVal = 'aeds-test-payload-' + Date.now();
          const encrypted = await encryptSecret(testVal);
          const decrypted = await decryptSecret(encrypted);
          results.push({
            id: 'encryption',
            name: 'AES-256-GCM Encryption',
            status: decrypted === testVal ? 'PASS' : 'FAIL',
            message: decrypted === testVal
              ? 'Cryptographic engine verified with roundtrip test cipher'
              : 'Cipher roundtrip mismatch',
            config: '32-byte master key active',
          });
        } catch (e: any) {
          results.push({
            id: 'encryption',
            name: 'AES-256-GCM Encryption',
            status: 'FAIL',
            message: `Cipher execution failed: ${e.message}`,
            config: 'Key error',
          });
        }
      }

      // 4. MinIO S3 Object Storage
      const s3Start = Date.now();
      const s3Endpoint = process.env['S3_ENDPOINT'] ?? 'http://localhost:9000';
      const s3Bucket = process.env['S3_BUCKET'] ?? 'aeds-artifacts';
      try {
        await fetch(s3Endpoint, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
        results.push({
          id: 's3',
          name: 'MinIO S3 Storage',
          status: 'PASS',
          latencyMs: Date.now() - s3Start,
          message: `Artifact storage endpoint responsive (Bucket: ${s3Bucket})`,
          config: `${s3Endpoint} (${s3Bucket})`,
        });
      } catch {
        results.push({
          id: 's3',
          name: 'MinIO S3 Storage',
          status: 'WARN',
          latencyMs: Date.now() - s3Start,
          message: `Object storage endpoint not reachable at ${s3Endpoint}`,
          config: `${s3Endpoint} (${s3Bucket})`,
        });
      }

      // 5. GitHub Personal Access Token
      const ghToken = process.env['GITHUB_TOKEN'];
      if (!ghToken || ghToken.includes('your_token')) {
        results.push({
          id: 'github',
          name: 'GitHub PAT Automation',
          status: 'WARN',
          message: 'GITHUB_TOKEN not set or placeholder. Required for automated PR and branch creation.',
          config: 'Not configured in .env',
        });
      } else {
        const ghStart = Date.now();
        try {
          const res = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `token ${ghToken}`,
              'User-Agent': 'aeds-agent-verifier',
            },
            signal: AbortSignal.timeout(4000),
          });
          const scopes = res.headers.get('x-oauth-scopes') || '';
          if (res.ok) {
            const user = (await res.json()) as any;
            results.push({
              id: 'github',
              name: 'GitHub PAT Automation',
              status: scopes.includes('repo') ? 'PASS' : 'WARN',
              latencyMs: Date.now() - ghStart,
              message: `Authenticated as @${user.login}. Scopes: [${scopes || 'none'}]${!scopes.includes('repo') ? ' — Missing repo scope!' : ''}`,
              config: `@${user.login}`,
            });
          } else {
            results.push({
              id: 'github',
              name: 'GitHub PAT Automation',
              status: 'FAIL',
              latencyMs: Date.now() - ghStart,
              message: `Authentication failed (HTTP ${res.status}): Bad credentials`,
              config: 'Invalid token',
            });
          }
        } catch (e: any) {
          results.push({
            id: 'github',
            name: 'GitHub PAT Automation',
            status: 'FAIL',
            latencyMs: Date.now() - ghStart,
            message: `Network error connecting to GitHub: ${e.message}`,
            config: 'Network error',
          });
        }
      }

      // 6. Figma Integration Token
      const figmaToken = process.env['FIGMA_TOKEN'];
      if (!figmaToken || figmaToken.includes('your_figma')) {
        results.push({
          id: 'figma',
          name: 'Figma API Integration',
          status: 'WARN',
          message: 'FIGMA_TOKEN not set or placeholder. Required for Design IR extraction.',
          config: 'Not configured in .env',
        });
      } else {
        const figmaStart = Date.now();
        try {
          const res = await fetch('https://api.figma.com/v1/me', {
            headers: { 'X-Figma-Token': figmaToken },
            signal: AbortSignal.timeout(4000),
          });
          if (res.ok) {
            const user = (await res.json()) as any;
            results.push({
              id: 'figma',
              name: 'Figma API Integration',
              status: 'PASS',
              latencyMs: Date.now() - figmaStart,
              message: `Authenticated as ${user.email || user.handle || 'Figma user'}`,
              config: user.email || 'Token valid',
            });
          } else {
            results.push({
              id: 'figma',
              name: 'Figma API Integration',
              status: 'FAIL',
              latencyMs: Date.now() - figmaStart,
              message: `Figma authentication failed: HTTP ${res.status}`,
              config: 'Invalid token',
            });
          }
        } catch (e: any) {
          results.push({
            id: 'figma',
            name: 'Figma API Integration',
            status: 'FAIL',
            latencyMs: Date.now() - figmaStart,
            message: `Figma API unreachable: ${e.message}`,
            config: 'Network error',
          });
        }
      }

      // 7. LLM Provider Gateway
      const llmProvider = process.env['LLM_PROVIDER'] || 'ollama';
      const llmApiUrl = process.env['LLM_API_URL'] || 'http://localhost:11434';
      const llmModel = process.env['LLM_MODEL'] || 'llama3.3';
      const llmStart = Date.now();
      try {
        const target =
          llmProvider === 'ollama'
            ? `${llmApiUrl.replace(/\/$/, '')}/api/tags`
            : `${llmApiUrl.replace(/\/$/, '')}/models`;
        const res = await fetch(target, {
          headers: process.env['LLM_API_KEY']
            ? { Authorization: `Bearer ${process.env['LLM_API_KEY']}` }
            : {},
          signal: AbortSignal.timeout(3000),
        });
        results.push({
          id: 'llm',
          name: `LLM Gateway (${llmProvider.toUpperCase()})`,
          status: res.ok ? 'PASS' : 'WARN',
          latencyMs: Date.now() - llmStart,
          message: res.ok
            ? `Endpoint reachable (Model: ${llmModel})`
            : `HTTP ${res.status} from ${target}`,
          config: `${llmApiUrl} (${llmModel})`,
        });
      } catch (e: any) {
        results.push({
          id: 'llm',
          name: `LLM Gateway (${llmProvider.toUpperCase()})`,
          status: 'FAIL',
          latencyMs: Date.now() - llmStart,
          message: `Cannot reach LLM endpoint: ${e.message}`,
          config: `${llmApiUrl} (${llmModel})`,
        });
      }

      // 8. AEM Cloud & Default Authoring Path
      const aemAuthPath = process.env['AEM_DEFAULT_AUTHORING_PATH'] || '/content/mysite/us/en';
      const aemClientId = process.env['AEM_CLIENT_ID'];
      const hasAemIms = Boolean(aemClientId && !aemClientId.includes('your_aem'));
      const isPathValid = aemAuthPath.startsWith('/content/');
      results.push({
        id: 'aem',
        name: 'AEM Cloud & Authoring Path',
        status: isPathValid ? (hasAemIms ? 'PASS' : 'WARN') : 'FAIL',
        message: isPathValid
          ? hasAemIms
            ? `AEM IMS configured. Default authoring path: ${aemAuthPath}`
            : `Authoring path valid (${aemAuthPath}). Global IMS credentials not set (per-project configuration active).`
          : `Invalid AEM authoring path: ${aemAuthPath}. Must start with /content/`,
        config: aemAuthPath,
      });

      const hasFail = results.some((r) => r.status === 'FAIL');

      return reply.status(hasFail ? 200 : 200).send({
        status: hasFail ? 'degraded' : 'healthy',
        timestamp: new Date().toISOString(),
        results,
      });
    }
  );
};
