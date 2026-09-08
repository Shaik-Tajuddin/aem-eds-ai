import { describe, expect, it } from 'vitest';
import { toAuthorContentPath } from '../src/mcp-write.js';

describe('toAuthorContentPath', () => {
  it('normalizes plain content paths', () => {
    expect(toAuthorContentPath('/content/wknd-eds/test/about-us.html')).toBe(
      '/content/wknd-eds/test/about-us',
    );
  });

  it('extracts path from author URL with query', () => {
    expect(
      toAuthorContentPath(
        'https://author.example.com/content/wknd-eds/test/about-us.html?ref=dev',
      ),
    ).toBe('/content/wknd-eds/test/about-us');
  });

  it('extracts /content from UE canvas URL', () => {
    expect(
      toAuthorContentPath(
        'https://author.example.com/ui#/aem/universal-editor/canvas/author.example.com/content/wknd-eds/test/about-us.html?ref=dev',
      ),
    ).toBe('/content/wknd-eds/test/about-us');
  });
});
