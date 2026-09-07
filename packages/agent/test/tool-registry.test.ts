import { describe, it, expect } from 'vitest';
import { createDefaultToolRegistry, listDefaultToolNames } from '../src/create-tool-registry.js';
import { ToolStatus } from '@aeds/shared';

describe('createDefaultToolRegistry', () => {
  it('registers core production tools including critical merge', () => {
    const names = listDefaultToolNames();
    expect(names).toContain('github.getRepository');
    expect(names).toContain('github.readFile');
    expect(names).toContain('github.mergePR');
    expect(names).toContain('browser.auditPage');
    expect(names).toContain('visual.compare');
    expect(names).toContain('testing.runCommand');
    expect(names).toContain('figma.getFile');
    expect(names).toContain('aem.previewPage');
    expect(names).toContain('build.validateArtifacts');
    expect(names.length).toBeGreaterThanOrEqual(10);
  });

  it('denies unregistered tools', async () => {
    const registry = createDefaultToolRegistry();
    const { result, record } = await registry.execute('does.not.exist', {}, {
      runId: 'run-1',
      projectId: 'proj-1',
    });
    expect(result.success).toBe(false);
    expect(record.status).toBe(ToolStatus.FAILED);
  });

  it('requires approval for github.createPR without autoApproveHighRisk', async () => {
    const registry = createDefaultToolRegistry();
    const { result, record } = await registry.execute(
      'github.createPR',
      {
        owner: 'o',
        repo: 'r',
        title: 't',
        head: 'b',
      },
      { runId: 'run-1', projectId: 'proj-1' },
    );
    expect(result.success).toBe(false);
    expect(result.errorClass).toBe('APPROVAL_REQUIRED');
    expect(record.status).toBe(ToolStatus.PENDING);
    expect(result.data).toMatchObject({ callId: record.id, toolName: 'github.createPR' });
  });

  it('requires approval for github.mergePR even with autoApproveHighRisk', async () => {
    const registry = createDefaultToolRegistry();
    const { result, record } = await registry.execute(
      'github.mergePR',
      { owner: 'o', repo: 'r', pullNumber: 1 },
      { runId: 'run-1', projectId: 'proj-1', autoApproveHighRisk: true },
    );
    expect(result.success).toBe(false);
    expect(result.errorClass).toBe('APPROVAL_REQUIRED');
    expect(record.status).toBe(ToolStatus.PENDING);
    expect(registry.getPendingApproval(record.id)?.toolName).toBe('github.mergePR');
  });

  it('approveAndExecute runs with forceApprove after pending', async () => {
    const registry = createDefaultToolRegistry();
    registry.register(
      {
        name: 'test.criticalEcho',
        namespace: 'testing',
        description: 'test',
        parameters: {},
        riskLevel: 'critical',
        requiresApproval: true,
        timeoutMs: 1000,
        allowedInScopes: ['*'],
      },
      async (input) => ({ echoed: input }),
    );

    const pending = await registry.execute(
      'test.criticalEcho',
      { hello: 'world' },
      { runId: 'run-1', projectId: 'proj-1' },
    );
    expect(pending.result.errorClass).toBe('APPROVAL_REQUIRED');

    const approved = await registry.approveAndExecute(pending.record.id, 'tester');
    expect(approved.result.success).toBe(true);
    expect(approved.result.data).toEqual({ echoed: { hello: 'world' } });
    expect(approved.record.status).toBe(ToolStatus.SUCCESS);
  });
});
