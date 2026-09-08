import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const r = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const h1 = await aem.head('/content/dam/wknd-shared/en/contributors/stacey-roswells.jpg');
      const h2 = await aem.head('/content/dam/wknd-shared/en/contributors/alex-iby.jpg');
      return { stacey: h1.status, alex: h2.status };
    `
  });
  console.log('Images status:', JSON.parse(r.content[0].text));
}

main().catch(console.error);
