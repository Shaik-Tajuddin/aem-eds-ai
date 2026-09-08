import { callAemCloudMcp } from './call_mcp.mjs';
import fs from 'fs';

async function main() {
  const destId = 'WqtfOXbIHG6cJYBKbCfGB0p4kBeIfKIiFZr2hPYGeDbKozyFTfqt9Mjz9nswNS6akW6wG5hFb7q9TokKw39n-Q';
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';

  const res = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/adobe/experimental/aspm-expires-20251231/pages/${destId}/content/definition');
      return r.body;
    `,
  });

  fs.writeFileSync('scratch/page_definition.json', JSON.stringify(res, null, 2));
  console.log('Saved definition to scratch/page_definition.json');
}

main().catch(console.error);
