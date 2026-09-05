import { describe, it, expect } from 'vitest';
import { ToolRegistry, ToolPolicyEngine, sanitizeValue } from '../src/index.js';
import { ToolStatus } from '@aeds/shared';
import type { ToolDefinition } from '@aeds/shared';

describe('Tool System', () => {
  describe('Sanitizer', () => {
    it('redacts sensitive keys from objects', () => {
      const input = {
        username: 'admin',
        githubToken: 'ghp_123456789012345678901234567890123456',
        apiKey: 'secret_1234567890',
        nested: {
          password: 'supersecretpassword',
        },
      };

      const sanitized: any = sanitizeValue(input);
      expect(sanitized.username).toBe('admin');
      expect(sanitized.githubToken).not.toBe('ghp_123456789012345678901234567890123456');
      expect(sanitized.apiKey).not.toBe('secret_1234567890');
      expect(sanitized.nested.password).not.toBe('supersecretpassword');

      const rawStringSanitized: any = sanitizeValue('Found token: ghp_123456789012345678901234567890123456 in log');
      expect(rawStringSanitized).toContain('ghp_******');

    });
  });

  describe('Policy Engine', () => {
    const engine = new ToolPolicyEngine();
    const mockTool: ToolDefinition = {
      name: 'deploy-production',
      namespace: 'build',
      description: 'Deploy code to production',
      parameters: {},
      riskLevel: 'critical',
      timeoutMs: 5000,
      allowedInScopes: ['proj-1'],
    };

    it('blocks tools outside allowed scopes', () => {
      const evaluation = engine.evaluate(mockTool, {
        projectId: 'proj-other',
        runId: 'run-1',
      });
      expect(evaluation.allowed).toBe(false);
    });

    it('requires human approval for critical risk tools', () => {
      const evaluation = engine.evaluate(mockTool, {
        projectId: 'proj-1',
        runId: 'run-1',
      });
      expect(evaluation.allowed).toBe(true);
      expect(evaluation.requiresHumanApproval).toBe(true);
    });
  });

  describe('Tool Registry Execution', () => {
    const registry = new ToolRegistry();

    const addTool: ToolDefinition = {
      name: 'add-numbers',
      namespace: 'testing',
      description: 'Add two numbers',
      parameters: {},
      riskLevel: 'low',
      timeoutMs: 1000,
      allowedInScopes: ['*'],
    };

    registry.register(addTool, async (input: { a: number; b: number }) => {
      return { sum: input.a + input.b };
    });

    it('executes registered tool successfully', async () => {
      const { result, record } = await registry.execute(
        'add-numbers',
        { a: 5, b: 7 },
        { projectId: 'p1', runId: 'r1' }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ sum: 12 });
      expect(record.status).toBe(ToolStatus.SUCCESS);
      expect(record.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('handles non-existent tools gracefully', async () => {
      const { result, record } = await registry.execute(
        'non-existent',
        {},
        { projectId: 'p1', runId: 'r1' }
      );

      expect(result.success).toBe(false);
      expect(record.status).toBe(ToolStatus.FAILED);
    });
  });
});
