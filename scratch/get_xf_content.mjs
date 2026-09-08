import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';
  
  console.log('--- Fetch Stacey Roswells XF ---');
  const res1 = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/adobe/experimental/aspm-expires-20251231/pages', {
        authorPath: '/content/experience-fragments/wknd/language-masters/en/contributors/stacey-roswells/master'
      });
      return r.body;
    `
  });
  console.log('Stacey XF page:', JSON.stringify(res1, null, 2));

  console.log('--- Fetch Jake Hammer XF ---');
  const res2 = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/adobe/experimental/aspm-expires-20251231/pages', {
        authorPath: '/content/experience-fragments/wknd/language-masters/en/contributors/jake-hammer/master'
      });
      return r.body;
    `
  });
  console.log('Jake XF page:', JSON.stringify(res2, null, 2));
}

main().catch(console.error);
