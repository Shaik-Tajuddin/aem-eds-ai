import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const ts = Date.now();
  const rJs = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds.dev.resource/blocks/cards/cards.js?ts=${ts}');
      return { status: r.status, len: (r.body || '').length, hasPicture: (r.body || '').includes('cards-card-image') };
    `
  });
  console.log('cards.js with ts:', rJs.content[0].text);
}

main().catch(console.error);
