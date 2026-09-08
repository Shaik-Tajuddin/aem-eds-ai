import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const r = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/dam/wknd-shared/en/contributors.1.json');
      return r.body;
    `
  });
  console.log('Contributors DAM folder:');
  console.log(r.content[0].text);
}

main().catch(console.error);
