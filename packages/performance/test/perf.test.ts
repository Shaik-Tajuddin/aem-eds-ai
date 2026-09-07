import { describe, it, expect } from 'vitest';
import { auditAssetBudgets, lighthouseUnavailable } from '../src/index.js';

describe('performance budgets', () => {
  it('passes small assets', () => {
    const result = auditAssetBudgets([
      { path: 'blocks/hero/hero.js', content: 'export default function decorate(){}' },
      { path: 'blocks/hero/hero.css', content: '.hero{color:red}' },
    ]);
    expect(result.passed).toBe(true);
    expect(result.mode).toBe('static-budget');
  });

  it('does not fake lighthouse success', () => {
    const result = lighthouseUnavailable('not installed');
    expect(result.passed).toBe(false);
    expect(result.mode).toBe('unavailable');
  });

  it('runLighthouseAudit returns unavailable when disabled', async () => {
    const prev = process.env.ENABLE_LIGHTHOUSE;
    delete process.env.ENABLE_LIGHTHOUSE;
    const { runLighthouseAudit } = await import('../src/lighthouse.js');
    const result = await runLighthouseAudit({ url: 'https://example.com' });
    expect(result.mode).toBe('unavailable');
    expect(result.passed).toBe(false);
    if (prev !== undefined) process.env.ENABLE_LIGHTHOUSE = prev;
  });
});
