import { callAemCloudMcp } from './call_mcp.mjs';
import fs from 'fs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const res = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd/language-masters/en/about-us.html?wcmmode=disabled');
      const html = r.body || '';
      const start = html.indexOf('Our Contributors');
      return {
        snippet: start !== -1 ? html.slice(start - 100, start + 2500) : 'Not found'
      };
    `
  });

  const parsed = JSON.parse(res.content[0].text);
  console.log('--- REFERENCE PAGE HTML SNIPPET ---');
  console.log(parsed.snippet);
}

main().catch(console.error);
