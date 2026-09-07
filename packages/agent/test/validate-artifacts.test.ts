import { describe, it, expect } from 'vitest';
import { validateEdsArtifacts } from '../src/validate-artifacts.js';

describe('validateEdsArtifacts', () => {
  it('passes decorate export without React', () => {
    const result = validateEdsArtifacts([
      {
        path: 'blocks/hero/hero.js',
        content: 'export default function decorate(block) { block.textContent = "ok"; }\n',
      },
      { path: 'blocks/hero/hero.json', content: '{"title":"Hero"}' },
    ]);
    expect(result.passed).toBe(true);
    expect(result.blockJsCount).toBe(1);
  });

  it('fails missing decorate and React import', () => {
    const result = validateEdsArtifacts([
      {
        path: 'blocks/bad/bad.js',
        content: "import React from 'react';\nexport function render() {}\n",
      },
      { path: 'blocks/bad/bad.json', content: '{not-json' },
    ]);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => /decorate/i.test(e))).toBe(true);
    expect(result.errors.some((e) => /React/i.test(e))).toBe(true);
    expect(result.errors.some((e) => /invalid JSON/i.test(e))).toBe(true);
  });

  it('fails empty file set', () => {
    const result = validateEdsArtifacts([]);
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toMatch(/No generated files/i);
  });
});
