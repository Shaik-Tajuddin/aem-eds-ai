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
  const content = current.body;

  const root = content.items[0];
  const sectionContrib = root.items[0];
  const cardsBlock = sectionContrib.items[2];

  console.log('Cards Block ID:', cardsBlock?.id);

  cardsBlock.items = [
    {
      id: 'card_stacey',
      componentType: 'core/franklin/components/block/v1/block/item',
      properties: {
        image: '/content/dam/wknd-shared/en/contributors/stacey-roswells.jpg',
        text: '<p><a href="/content/experience-fragments/wknd/language-masters/en/contributors/stacey-roswells/master">/content/experience-fragments/wknd/language-masters/en/contributors/stacey-roswells/master</a></p><p><strong>Stacey Roswells</strong></p><p>Artist | Photographer | Traveler</p>',
        modelFields: ['image@reference', 'text@richtext']
      },
      items: []
    },
    {
      id: 'card_jake',
      componentType: 'core/franklin/components/block/v1/block/item',
      properties: {
        image: '/content/dam/wknd-shared/en/contributors/alex-iby.jpg',
        text: '<p><a href="/content/experience-fragments/wknd/language-masters/en/contributors/jake-hammer/master">/content/experience-fragments/wknd/language-masters/en/contributors/jake-hammer/master</a></p><p><strong>Jake Hammer</strong></p><p>Influencer | Writer</p>',
        modelFields: ['image@reference', 'text@richtext']
      },
      items: []
    }
  ];

  console.log('Updating cards block with XF references...');
  const putRes = await callAemCloudMcp('write-api', {
    aemUrl,
    code: `
      const r = await aem.put(
        '/adobe/experimental/aspm-expires-20251231/pages/${destId}/content',
        ${JSON.stringify(content)},
        '${etag}'
      );
      return { status: r.status, etag: r.etag };
    `
  });

  console.log('Put Result:', JSON.stringify(putRes, null, 2));
}

main().catch(console.error);
