import { describe, it, expect } from 'vitest';
import { assertSafeCommand } from '@aeds/queue';
import { processBuildJob } from '../src/processor';

describe('@aeds/build-worker', () => {
  it('rejects unsafe commands', () => {
    expect(() => assertSafeCommand('rm -rf /')).toThrow(/allowlisted/);
    expect(() => assertSafeCommand('npm run build; cat /etc/passwd')).toThrow(/forbidden/);
  });

  it('reports failure for missing workDir without inventing success', async () => {
    const result = await processBuildJob({
      data: {
        runId: '123e4567-e89b-12d3-a456-426614174088',
        projectId: '123e4567-e89b-12d3-a456-426614174089',
        workDir: 'D:/definitely-missing-aeds-build-dir',
        commands: ['npm run build:json'],
        timeoutMs: 5_000,
      },
      updateProgress: async () => {},
    });
    expect(result.success).toBe(false);
  });
});
