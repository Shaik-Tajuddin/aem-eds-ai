import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const res = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/etc.clientlibs/wknd/clientlibs/clientlib-site.lc-d41d8cd98f00b204e9800998ecf8427e-lc.min.css');
      return { status: r.status, len: (r.body || '').length };
    `
  });
  console.log('CSS fetch:', res.content[0].text);
}

main().catch(console.error);
