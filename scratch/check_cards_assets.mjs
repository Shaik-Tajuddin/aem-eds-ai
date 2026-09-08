import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';

  console.log('--- Checking Cards Block JS ---');
  const jsRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds.dev.resource/blocks/cards/cards.js');
      return { status: r.status, len: (r.body || '').length, preview: (r.body || '').slice(0, 300) };
    `
  });
  console.log('cards.js:', JSON.stringify(jsRes, null, 2));

  console.log('--- Checking Cards Block CSS ---');
  const cssRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds.dev.resource/blocks/cards/cards.css');
      return { status: r.status, len: (r.body || '').length, preview: (r.body || '').slice(0, 300) };
    `
  });
  console.log('cards.css:', JSON.stringify(cssRes, null, 2));

  console.log('--- Checking Image 1 in DAM ---');
  const img1Res = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.head('/content/dam/wknd/en/contributors/stacey-roswells.jpg');
      return { status: r.status };
    `
  });
  console.log('stacey image head:', JSON.stringify(img1Res, null, 2));

  console.log('--- Checking Image 2 in DAM ---');
  const img2Res = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.head('/content/dam/wknd/en/contributors/alex-iby.jpg');
      return { status: r.status };
    `
  });
  console.log('alex image head:', JSON.stringify(img2Res, null, 2));
}

main().catch(console.error);
