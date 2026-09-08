import { describe, it, expect } from 'vitest';
import { buildPreviewPageUrl, contentPathToLivePath } from '../src/reference-capture.js';
import { isPreviewContentReady, resolveLiveAuditUrl } from '../src/live-browser-audit.js';
import type { PageAuditResult } from '@aeds/browser';
import type { RunExecutionContext } from '../src/index.js';

describe('preview audit URL targeting', () => {
  it('maps AEM content path to EDS live path', () => {
    expect(contentPathToLivePath('/content/wknd/language-masters/en/faqs.html')).toBe(
      '/language-masters/en/faqs',
    );
  });

  it('builds path-aware aem.live audit URL from source page', () => {
    const url = buildPreviewPageUrl(
      'https://ai-faq--wknd-eds--shaik-tajuddin.aem.live/',
      'https://publish-p149251-e1522049.adobeaemcloud.com/content/wknd/language-masters/en/faqs.html',
    );
    expect(url).toBe(
      'https://ai-faq--wknd-eds--shaik-tajuddin.aem.live/language-masters/en/faqs',
    );
  });

  it('resolveLiveAuditUrl prefers previewAuditUrl then path-aware origin', () => {
    const ctx = {
      previewUrl: 'https://ai-faq--wknd-eds--owner.aem.live/',
      sourceUrl:
        'https://publish.example.com/content/wknd/language-masters/en/faqs.html',
    } as RunExecutionContext;
    expect(resolveLiveAuditUrl(ctx)).toBe(
      'https://ai-faq--wknd-eds--owner.aem.live/language-masters/en/faqs',
    );

    ctx.previewAuditUrl = 'https://ai-faq--wknd-eds--owner.aem.live/custom';
    expect(resolveLiveAuditUrl(ctx)).toBe('https://ai-faq--wknd-eds--owner.aem.live/custom');
  });

  it('treats 404 / empty shell as content not ready', () => {
    const audits = [
      {
        statusCode: 404,
        domSummary: { blocksCount: 0, detectedBlocks: [], sectionsCount: 0, hasMain: false, hasHeader: false, hasFooter: false },
      },
    ] as unknown as PageAuditResult[];
    expect(isPreviewContentReady(audits, ['accordion'])).toBe(false);
  });

  it('treats page with expected block as content ready', () => {
    const audits = [
      {
        statusCode: 200,
        domSummary: {
          blocksCount: 1,
          detectedBlocks: [{ name: 'accordion', classes: [], isDecorated: true }],
          sectionsCount: 1,
          hasMain: true,
          hasHeader: false,
          hasFooter: false,
        },
      },
    ] as unknown as PageAuditResult[];
    expect(isPreviewContentReady(audits, ['accordion'])).toBe(true);
  });
});
