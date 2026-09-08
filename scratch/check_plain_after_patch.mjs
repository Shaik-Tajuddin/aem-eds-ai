import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const res = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds/test/about-us.plain.html');
      return { status: r.status, body: r.body };
    `
  });
  console.log('Plain HTML:');
  const parsed = JSON.parse(res.content[0].text);
  console.log(parsed.body);
}

main().catch(console.error);
