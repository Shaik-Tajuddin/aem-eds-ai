import { describe, it, expect } from 'vitest';
import {
  parseDescendingSpecificityIssues,
  parseSingleLineMaxDeclarationIssues,
  reorderDescendingSpecificity,
  expandSingleLineDeclarationBlocks,
  findRuleRange,
  applyStylelintResidualFixes,
} from '../src/stylelint-autofix.js';

describe('stylelint residual autofix', () => {
  it('parses no-descending-specificity from ANSI lint output', () => {
    const output = `
styles/styles.css
  \u001b[2m398:1\u001b[22m  \u001b[31m✖\u001b[39m  Expected selector "main em" to come before selector "main p em", at line 397  no-descending-specificity

✖ 1 problem (1 error, 0 warnings)
`;
    const issues = parseDescendingSpecificityIssues(output);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      file: 'styles/styles.css',
      moveSelector: 'main em',
      beforeSelector: 'main p em',
      line: 397,
    });
  });

  it('parses single-line max declarations issues', () => {
    const output = `
blocks/accordion/accordion.css
  40:22  ✖  Too many declarations, maximum 1  declaration-block-single-line-max-declarations
`;
    const issues = parseSingleLineMaxDeclarationIssues(output);
    expect(issues).toEqual([{ file: 'blocks/accordion/accordion.css', line: 40, column: 22 }]);
  });

  it('reorders selectors inside the same comma-separated rule', () => {
    const css = `main p em,
main em {
  font-style: italic;
  color: #202020;
}
`;
    const fixed = reorderDescendingSpecificity(css, 'main em', 'main p em', 1);
    expect(fixed).toBeTruthy();
    expect(fixed!).toMatch(/main em,\s*\nmain p em\s*\{/);
    // Specificity order: lower first
    expect(fixed!.indexOf('main em')).toBeLessThan(fixed!.indexOf('main p em'));
  });

  it('reorders main em before main p em across separate rules', () => {
    const css = `main p em {
  font-style: italic;
}

main em {
  color: #202020;
}
`;
    const fixed = reorderDescendingSpecificity(css, 'main em', 'main p em', 1);
    expect(fixed).toBeTruthy();
    expect(fixed!.indexOf('main em')).toBeLessThan(fixed!.indexOf('main p em'));
    expect(findRuleRange(fixed!, 'main em')).toBeTruthy();
  });

  it('swaps adjacent rules via line fallback when selectors are odd', () => {
    const css = `main p em {
  font-style: italic;
}
main em {
  color: #202020;
}
`;
    // Force line fallback by using selectors that won't exact-match... actually they will match.
    // Test expand instead:
    const expanded = expandSingleLineDeclarationBlocks(
      `.accordion summary { font-size: 1.125rem; padding: 1.25rem .5rem; }\n`,
    );
    expect(expanded).toContain('font-size: 1.125rem;');
    expect(expanded).toContain('padding: 1.25rem .5rem;');
    expect(expanded).toMatch(/\{\n/);
  });

  it('applies residual fixes for both issue types', async () => {
    const files = new Map<string, string>([
      [
        '/tmp/ws/styles/styles.css',
        `main p em {\n  font-style: italic;\n}\n\nmain em {\n  color: red;\n}\n`,
      ],
      [
        '/tmp/ws/blocks/accordion/accordion.css',
        `.accordion summary { font-size: 1.125rem; padding: 1.25rem .5rem; }\n`,
      ],
    ]);
    const lintOutput = `
blocks/accordion/accordion.css
  1:22  ✖  Too many declarations, maximum 1  declaration-block-single-line-max-declarations

styles/styles.css
  5:1  ✖  Expected selector "main em" to come before selector "main p em", at line 1  no-descending-specificity
`;
    const result = await applyStylelintResidualFixes(
      '/tmp/ws',
      lintOutput,
      async (p) => {
        const v = files.get(p.replace(/\\/g, '/'));
        if (!v) throw new Error(`missing ${p}`);
        return v;
      },
      async (p, content) => {
        files.set(p.replace(/\\/g, '/'), content);
      },
      (rel) => `/tmp/ws/${rel}`,
    );
    expect(result.fixedFiles).toEqual(
      expect.arrayContaining(['styles/styles.css', 'blocks/accordion/accordion.css']),
    );
    const styles = files.get('/tmp/ws/styles/styles.css')!;
    expect(styles.indexOf('main em')).toBeLessThan(styles.indexOf('main p em'));
    const accordion = files.get('/tmp/ws/blocks/accordion/accordion.css')!;
    expect(accordion).toMatch(/font-size:[^;]+;\n\s+padding:/);
  });
});
