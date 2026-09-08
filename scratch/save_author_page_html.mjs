import { callAemCloudMcp } from './call_mcp.mjs';
import fs from 'fs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';

  const res = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds/test/about-us.html?ref=dev');
      return { status: r.status, body: r.body };
    `
  });

  const parsed = JSON.parse(res.content[0].text);
  fs.writeFileSync('scratch/author_page_full.html', parsed.body || '');
  console.log('Saved author_page_full.html (length:', (parsed.body || '').length, ')');
}

main().catch(console.error);
