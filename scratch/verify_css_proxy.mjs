import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const ts = Date.now();

  const rCss = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds.dev.resource/blocks/cards/cards.css?ts=${ts}');
      return { status: r.status, len: (r.body || '').length, hasAspect: (r.body || '').includes('aspect-ratio') };
    `
  });
  console.log('cards.css with ts:', rCss.content[0].text);

  const rStyles = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds.dev.resource/styles/styles.css?ts=${ts}');
      return { status: r.status, len: (r.body || '').length, hasParity: (r.body || '').includes('WKND Parity Headings') };
    `
  });
  console.log('styles.css with ts:', rStyles.content[0].text);
}

main().catch(console.error);
