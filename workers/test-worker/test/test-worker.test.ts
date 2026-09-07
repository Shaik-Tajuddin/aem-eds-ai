import { describe, it, expect } from 'vitest';
import { assertSafeCommand } from '@aeds/queue';
import { processTestJob } from '../src/processor';

describe('@aeds/test-worker', () => {
  it('rejects unsafe commands', () => {
    expect(() => assertSafeCommand('curl http://evil')).toThrow(/allowlisted/);
  });

  it('reports failure honestly for missing workDir', async () => {
    const result = await processTestJob({
      data: {
        runId: '123e4567-e89b-12d3-a456-426614174088',
        projectId: '123e4567-e89b-12d3-a456-426614174089',
        workDir: 'D:/definitely-missing-aeds-test-dir',
        commands: ['npm test'],
        timeoutMs: 5_000,
      },
      updateProgress: async () => {},
    });
    expect(result.success).toBe(false);
  });
});
