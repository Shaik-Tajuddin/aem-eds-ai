import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const destId = 'WqtfOXbIHG6cJYBKbCfGB0p4kBeIfKIiFZr2hPYGeDbKozyFTfqt9Mjz9nswNS6akW6wG5hFb7q9TokKw39n-Q';
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';

  console.log('=== 1. Fetch Current Destination Content & ETag ===');
  const getRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/adobe/experimental/aspm-expires-20251231/pages/${destId}/content');
      return { etag: r.etag, body: r.body };
    `
  });
  const current = JSON.parse(getRes.content[0].text);
  const etag = current.etag;
  const content = current.body;

  // Let's structure items in section_contributors:
  // Item 0: Title "About Us" (H1)
  // Item 1: Title "Our Contributors" (H2)
  // Item 2: Text "Meet the outstanding individuals..."
  // Item 3: Cards block with 2 items (Stacey and Jake)
  const section = content.items[0].items[0];

  section.items = [
    {
      id: 'title_about_us',
      componentType: 'core/franklin/components/title/v1/title',
      properties: {
        title: 'About Us',
        titleType: 'h1',
        model: 'title',
        aueComponentId: 'title',
        modelFields: ['title@text', 'titleType@select']
      },
      items: []
    },
    {
      id: 'title_contributors',
      componentType: 'core/franklin/components/title/v1/title',
      properties: {
        title: 'Our Contributors',
        titleType: 'h2',
        model: 'title',
        aueComponentId: 'title',
        modelFields: ['title@text', 'titleType@select']
      },
      items: []
    },
    {
      id: 'text_contributors',
      componentType: 'core/franklin/components/text/v1/text',
      properties: {
        text: '<p><i>Meet the outstanding individuals responsible for bringing you the most compelling stories across the globe.</i></p>',
        model: 'text',
        aueComponentId: 'text',
        modelFields: ['text@richtext']
      },
      items: []
    },
    {
      id: 'cards_contributors',
      componentType: 'core/franklin/components/block/v1/block',
      properties: {
        name: 'Cards',
        model: 'cards',
        aueComponentId: 'cards',
        modelFields: ['name@text']
      },
      items: [
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
            image: '/content/dam/wknd-shared/en/contributors/alex-iby-343837.jpg',
            text: '<p><a href="/content/experience-fragments/wknd/language-masters/en/contributors/jake-hammer/master">/content/experience-fragments/wknd/language-masters/en/contributors/jake-hammer/master</a></p><p><strong>Jake Hammer</strong></p><p>Influencer | Writer</p>',
            modelFields: ['image@reference', 'text@richtext']
          },
          items: []
        }
      ]
    }
  ];

  console.log('=== 2. Putting Updated Structure via MCP write-api ===');
  const putRes = await callAemCloudMcp('write-api', {
    aemUrl,
    code: `
      const r = await aem.put(
        '/adobe/experimental/aspm-expires-20251231/pages/${destId}/content',
        ${JSON.stringify(content)},
        '${etag}'
      );
      return { status: r.status, etag: r.etag, body: r.body };
    `
  });

  console.log('Put Result:', JSON.stringify(putRes, null, 2));

  console.log('=== 3. Verifying Rendered HTML ===');
  const verifyRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds/test/about-us.html?ref=dev');
      return { status: r.status, len: (r.body || '').length, preview: r.body };
    `
  });

  const parsed = JSON.parse(verifyRes.content[0].text);
  console.log('Rendered HTML Status:', parsed.status, 'Length:', parsed.len);
  
  // Check for H1, H2, Cards
  const html = parsed.preview || '';
  const hasH1 = html.includes('About Us') && html.includes('h1');
  const hasH2 = html.includes('Our Contributors') && html.includes('h2');
  const hasCards = html.includes('class="cards"');
  const hasStacey = html.includes('stacey-roswells');
  const hasJake = html.includes('alex-iby-343837');

  console.log('Verification Checkpoints:', { hasH1, hasH2, hasCards, hasStacey, hasJake });
}

main().catch(console.error);
