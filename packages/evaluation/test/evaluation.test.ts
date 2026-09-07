import { describe, it, expect } from 'vitest';
import { scoreEvaluationRun, listBenchmarkTasks } from '../src/index.js';

describe('@aeds/evaluation', () => {
  it('lists benchmark tasks', () => {
    expect(listBenchmarkTasks().length).toBeGreaterThanOrEqual(10);
  });

  it('scores from system evidence without inventing PASS', () => {
    const result = scoreEvaluationRun({
      taskId: 'create-hero',
      runId: 'run-1',
      bugsOpen: 0,
      evidence: [
        { kind: 'build', status: 'PASS', summary: 'build ok', id: 'e1' },
        { kind: 'visual', status: 'SKIPPED', summary: 'no baseline', id: 'e2' },
        { kind: 'accessibility', status: 'PASS', summary: 'a11y ok', id: 'e3' },
      ],
    });
    expect(result.overall).toBeGreaterThan(0);
    expect(result.dimensions.find((d) => d.dimension === 'visual')?.score).toBe(50);
    // Visual SKIPPED keeps overall from auto-passing aggressively when other dims high
    expect(result.passed).toBe(false);
  });

  it('fails when bugs remain open', () => {
    const result = scoreEvaluationRun({
      taskId: 'fix-javascript-error',
      runId: 'run-2',
      bugsOpen: 2,
      evidence: [
        { kind: 'browser', status: 'PASS', summary: 'ok', id: 'e1' },
        { kind: 'build', status: 'PASS', summary: 'ok', id: 'e2' },
      ],
    });
    expect(result.passed).toBe(false);
  });
});
