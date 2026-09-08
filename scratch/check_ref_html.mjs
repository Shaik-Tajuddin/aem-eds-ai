import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const res = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd/language-masters/en/about-us.html?wcmmode=disabled');
      return { status: r.status, len: (r.body || '').length };
    `
  });
  console.log('Reference page status:', res);
}

main().catch(console.error);
