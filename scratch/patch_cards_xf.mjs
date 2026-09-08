import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const destId = 'WqtfOXbIHG6cJYBKbCfGB0p4kBeIfKIiFZr2hPYGeDbKozyFTfqt9Mjz9nswNS6akW6wG5hFb7q9TokKw39n-Q';
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';

  const getRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/adobe/experimental/aspm-expires-20251231/pages/${destId}/content');
      return { etag: r.etag, body: r.body };
    `,
  });
  const current = JSON.parse(getRes.content[0].text);
  const etag = current.etag;

  // Let's use patch to only update the card_stacey and card_jake text!
  console.log('Testing PATCH on card_stacey...');
  const patchRes = await callAemCloudMcp('write-api', {
    aemUrl,
    code: `
      const patch = [
        {
          op: 'replace',
          path: '/items/0/items/0/items/2/items/0/properties/text',
          value: '<p><a href=\"/content/experience-fragments/wknd/language-masters/en/contributors/stacey-roswells/master\">/content/experience-fragments/wknd/language-masters/en/contributors/stacey-roswells/master</a></p><p><strong>Stacey Roswells</strong></p><p>Artist | Photographer | Traveler</p>'
        },
        {
          op: 'replace',
          path: '/items/0/items/0/items/2/items/1/properties/text',
          value: '<p><a href=\"/content/experience-fragments/wknd/language-masters/en/contributors/jake-hammer/master\">/content/experience-fragments/wknd/language-masters/en/contributors/jake-hammer/master</a></p><p><strong>Jake Hammer</strong></p><p>Influencer | Writer</p>'
        }
      ];
      const r = await aem.patch(
        '/adobe/experimental/aspm-expires-20251231/pages/${destId}/content',
        patch,
        '${etag}'
      );
      return { status: r.status, body: r.body };
    `
  });

  console.log('Patch result:', JSON.stringify(patchRes, null, 2));
}

main().catch(console.error);
