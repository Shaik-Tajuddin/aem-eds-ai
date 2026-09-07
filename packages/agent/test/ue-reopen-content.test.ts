import { describe, it, expect } from 'vitest';
import {
  collectStringLeaves,
  findMarkerInExport,
  verifyUeReopenViaContent,
} from '../src/ue-reopen-content.js';

describe('findMarkerInExport (deep MCP trees)', () => {
  it('finds marker nested under items/children', () => {
    const payload = {
      ok: true,
      components: [
        {
          componentType: 'core/wcm/components/container',
          properties: { title: 'shell' },
          items: [
            {
              componentType: 'mysite/components/text',
              properties: { text: 'hello aeds-ue-test-xyz nested' },
              items: [],
            },
          ],
        },
      ],
    };
    const { hit, scannedLeaves } = findMarkerInExport('aeds-ue-test-xyz', payload);
    expect(hit).toBe(true);
    expect(scannedLeaves).toBeGreaterThan(1);
  });

  it('scans arrays and numeric leaves without false PASS', () => {
    const leaves = collectStringLeaves({
      items: [{ properties: { n: 42, flag: true, note: 'nope' } }],
    });
    expect(leaves).toContain('42');
    expect(leaves).toContain('true');
    expect(findMarkerInExport('marker-absent', { items: [{ note: 'x' }] }).hit).toBe(false);
  });
});

describe('verifyUeReopenViaContent', () => {
  it('returns UNAVAILABLE without page URL', async () => {
    const prev = process.env.UE_CONTENT_PAGE_URL;
    const prevAuthor = process.env.AEM_AUTHOR_URL;
    delete process.env.UE_CONTENT_PAGE_URL;
    delete process.env.AEM_AUTHOR_URL;

    const result = await verifyUeReopenViaContent({ marker: 'aeds-ue-test' });
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.summary).toMatch(/UE_CONTENT_PAGE_URL|authoring page URL/i);

    if (prev) process.env.UE_CONTENT_PAGE_URL = prev;
    if (prevAuthor) process.env.AEM_AUTHOR_URL = prevAuthor;
  });

  it('returns SKIPPED when ENABLE_UE_CONTENT_VERIFY=false', async () => {
    const prev = process.env.ENABLE_UE_CONTENT_VERIFY;
    const prevUrl = process.env.UE_CONTENT_PAGE_URL;
    process.env.ENABLE_UE_CONTENT_VERIFY = 'false';
    process.env.UE_CONTENT_PAGE_URL = 'https://author.example.com/content/site/page';

    const result = await verifyUeReopenViaContent({ marker: 'x' });
    expect(result.status).toBe('SKIPPED');

    if (prev === undefined) delete process.env.ENABLE_UE_CONTENT_VERIFY;
    else process.env.ENABLE_UE_CONTENT_VERIFY = prev;
    if (prevUrl === undefined) delete process.env.UE_CONTENT_PAGE_URL;
    else process.env.UE_CONTENT_PAGE_URL = prevUrl;
  });
});
