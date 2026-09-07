import { describe, it, expect } from 'vitest';
import { auditHtmlStatic } from '../src/index.js';

describe('accessibility static audit', () => {
  it('flags images without alt', () => {
    const result = auditHtmlStatic('<img src="/x.png"><h1>Hi</h1>');
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.id === 'image-alt')).toBe(true);
  });

  it('passes clean markup', () => {
    const result = auditHtmlStatic('<section><h1>Title</h1><img src="/x.png" alt="Hero"></section>');
    expect(result.passed).toBe(true);
  });
});
