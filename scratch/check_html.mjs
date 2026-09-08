import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';

  console.log('--- Fetching author page HTML via MCP ---');
  const res = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds/test/about-us.html?ref=dev');
      return { status: r.status, headers: r.headers, body: (r.body || '').slice(0, 3000) };
    `
  });

  console.log('HTML Response:', JSON.stringify(res, null, 2));

  console.log('--- Fetching plain.html via MCP ---');
  const resPlain = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds/test/about-us.plain.html');
      return { status: r.status, body: r.body };
    `
  });
  console.log('Plain HTML Response:', JSON.stringify(resPlain, null, 2));
}

main().catch(console.error);
