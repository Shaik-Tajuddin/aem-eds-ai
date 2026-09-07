import { describe, expect, it } from 'vitest';
import { flattenMcpPageContent, formatMcpComponentsForPrompt } from '../src/mcp-page-content.js';

describe('flattenMcpPageContent', () => {
  it('skips page/container and maps title→hero, text→columns, XF→cards', () => {
    const root = {
      id: 'jcr:content',
      componentType: 'wknd/components/page',
      properties: { 'jcr:title': 'About Us' },
      items: [
        {
          id: 'root',
          componentType: 'wknd/components/container',
          properties: {},
          items: [
            {
              id: 'title',
              componentType: 'wknd/components/title',
              properties: {},
              items: [],
            },
            {
              id: 'text_1',
              componentType: 'wknd/components/text',
              properties: { text: '<p>Hi</p>' },
              items: [],
            },
            {
              id: 'experiencefragment_c',
              componentType: 'wknd/components/experiencefragment',
              properties: {
                fragmentVariationPath:
                  '/content/experience-fragments/wknd/language-masters/en/contributors/stacey-roswells/master',
              },
              items: [
                {
                  id: 'cq:responsive',
                  items: [
                    { id: 'default', properties: { width: '3' } },
                    { id: 'phone', properties: { width: '12' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const { components, title } = flattenMcpPageContent(root, '/content/wknd/language-masters/en/about-us');
    expect(title).toBe('About Us');
    expect(components.map((c) => c.resourceType)).toEqual([
      'wknd/components/title',
      'wknd/components/text',
      'wknd/components/experiencefragment',
    ]);
    expect(components.map((c) => c.suggestedBlock)).toEqual(['hero', 'columns', 'cards']);
    expect(components[2]?.properties['_grid']).toEqual({ default: 3, phone: 12 });

    const prompt = formatMcpComponentsForPrompt(components);
    expect(prompt).toContain('componentType');
    expect(prompt).toContain('stacey-roswells');
    expect(prompt).not.toContain('_grid');
    expect(prompt).toContain('"grid"');
  });
});
