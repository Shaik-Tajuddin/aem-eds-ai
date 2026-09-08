import { callAemCloudMcp } from './call_mcp.mjs';
import fs from 'fs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const refPageId = 'ncOvO8-G3JAhS7eHqo10fkfuXAFmm0vrLx7OpYFGynAJyfz7Y-2fkqcFOiDeaf9w';
  const destPageId = 'WqtfOXbIHG6cJYBKbCfGB0p4kBeIfKIiFZr2hPYGeDbKozyFTfqt9Mjz9nswNS6akW6wG5hFb7q9TokKw39n-Q';

  console.log('--- Fetching Reference Content Tree ---');
  const refContentRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/adobe/experimental/aspm-expires-20251231/pages/${refPageId}/content');
      return r.body;
    `
  });
  const refContent = JSON.parse(refContentRes.content[0].text);

  console.log('--- Fetching Destination Content Tree ---');
  const destContentRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/adobe/experimental/aspm-expires-20251231/pages/${destPageId}/content');
      return r.body;
    `
  });
  const destContent = JSON.parse(destContentRes.content[0].text);

  console.log('--- Fetching Reference Rendered HTML ---');
  const refHtmlRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd/language-masters/en/about-us.html?wcmmode=disabled');
      return { status: r.status, len: (r.body || '').length, body: r.body };
    `
  });
  const refHtmlObj = JSON.parse(refHtmlRes.content[0].text);

  console.log('--- Fetching Destination Rendered HTML ---');
  const destHtmlRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds/test/about-us.html?ref=dev');
      return { status: r.status, len: (r.body || '').length, body: r.body };
    `
  });
  const destHtmlObj = JSON.parse(destHtmlRes.content[0].text);

  fs.writeFileSync('scratch/ref_content_tree.json', JSON.stringify(refContent, null, 2));
  fs.writeFileSync('scratch/dest_content_tree.json', JSON.stringify(destContent, null, 2));
  fs.writeFileSync('scratch/ref_page.html', refHtmlObj.body || '');
  fs.writeFileSync('scratch/dest_page.html', destHtmlObj.body || '');

  console.log('Data dumped to scratch/. Now extracting structural comparison...');
}

main().catch(console.error);
