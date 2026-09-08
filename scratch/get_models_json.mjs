import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const res = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds.dev.resource/component-models.json');
      return r.body;
    `
  });
  console.log('component-models.json:');
  console.log(res.content[0].text);
}

main().catch(console.error);
