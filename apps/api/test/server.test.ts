import { describe, it, expect, beforeAll } from 'vitest';

describe('Fastify API Server', () => {
  beforeAll(() => {
    process.env['NODE_ENV'] = 'test';
    process.env['SKIP_AUTH'] = 'true';
    process.env['DATABASE_URL'] = 'postgresql://aeds:aeds_password@localhost:5432/aeds_test';
    process.env['JWT_SECRET'] = 'test-jwt-secret-minimum-32-chars-long!!';
  });

  it('instantiates successfully and responds to /health', async () => {
    const { buildServer } = await import('../src/server.js');
    const server = await buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect([200, 503]).toContain(response.statusCode);
    const body = JSON.parse(response.payload);
    expect(body.version).toBe('0.1.0');
    expect(body.services).toBeDefined();
    await server.close();
  });

  it('exposes /api/runs/queues/metrics for BullMQ telemetry', async () => {
    const { buildServer } = await import('../src/server.js');
    const server = await buildServer();
    const response = await server.inject({
      method: 'GET',
      url: '/api/runs/queues/metrics',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.queues).toBeDefined();
    expect(Array.isArray(body.queues)).toBe(true);
    expect(body.queues.length).toBeGreaterThanOrEqual(3);
    const queueNames = body.queues.map((q: any) => q.name);
    expect(queueNames).toContain('agent-runs');
    expect(queueNames).toContain('browser-tests');
    expect(queueNames).toContain('visual-tests');
    await server.close();
  });
});

