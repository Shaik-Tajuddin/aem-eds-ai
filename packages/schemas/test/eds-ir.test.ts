import { describe, it, expect } from 'vitest';
import { parseEDSComponentIR, safeParseEDSArchitectureIR } from '../src/index.js';

describe('EDSComponentIR schemas', () => {
  it('accepts a valid block IR', () => {
    const ir = parseEDSComponentIR({
      name: 'hero',
      type: 'block',
      authoring: {
        editable: true,
        fields: [{ name: 'title', label: 'Title', component: 'text', required: true }],
        options: [],
      },
      rendering: {
        semanticHtml: '<section class="hero"><h1></h1></section>',
        responsiveBehavior: [{ breakpoint: 'mobile', behavior: 'stack' }],
      },
      implementation: { css: ['hero.css'], javascript: ['hero.js'] },
      dependencies: [],
      accessibility: { requirements: ['h1 landmark', 'alt text for images'] },
      testing: {
        functional: [{ name: 'renders title', description: 'Title visible', assertions: ['visible'] }],
        visual: [{ name: 'desktop hero', viewport: 'desktop', thresholdPercent: 95 }],
      },
    });
    expect(ir.name).toBe('hero');
  });

  it('rejects invalid block names', () => {
    const result = safeParseEDSArchitectureIR({
      id: 'arch-1',
      createdAt: new Date().toISOString(),
      components: [
        {
          name: 'Hero Block',
          type: 'block',
          authoring: { editable: true, fields: [], options: [] },
          rendering: { semanticHtml: '<div></div>', responsiveBehavior: [] },
          implementation: { css: [], javascript: [] },
          dependencies: [],
          accessibility: { requirements: [] },
          testing: { functional: [], visual: [] },
        },
      ],
      reuseDecisions: [],
      conventions: [],
    });
    expect(result.success).toBe(false);
  });
});
