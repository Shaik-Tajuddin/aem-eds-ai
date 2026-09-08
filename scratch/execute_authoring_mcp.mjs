import { callAemCloudMcp } from './call_mcp.mjs';
import fs from 'fs';

async function main() {
  const destId = 'WqtfOXbIHG6cJYBKbCfGB0p4kBeIfKIiFZr2hPYGeDbKozyFTfqt9Mjz9nswNS6akW6wG5hFb7q9TokKw39n-Q';
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';

  console.log('=== Step 1: Read Current Destination Content & ETag ===');
  const getRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/adobe/experimental/aspm-expires-20251231/pages/${destId}/content');
      return { status: r.status, etag: r.etag, body: r.body };
    `,
  });

  const getResult = JSON.parse(getRes.content[0].text);
  console.log('Current status:', getResult.status);
  console.log('Current ETag:', getResult.etag);
  const etag = getResult.etag;

  console.log('=== Step 2: Construct Authored Content Tree ===');
  const newContent = {
    id: 'jcr:content',
    componentType: 'core/franklin/components/page/v1/page',
    properties: {
      'jcr:title': 'About Us',
      'jcr:description': 'WKND is a collective of outdoors, music, crafts, adventure sports, and travel enthusiasts that want to share our experiences, connections, and expertise with the world.',
      'cq:tags': [
        'wknd-shared:customer-journey/engage',
        'wknd-shared:customer-journey/support'
      ]
    },
    items: [
      {
        id: 'root',
        componentType: 'core/franklin/components/root/v1/root',
        properties: {},
        items: [
          {
            id: 'section_overview',
            componentType: 'core/franklin/components/section/v1/section',
            properties: {
              name: 'Overview',
              model: 'section',
              aueComponentId: 'section',
              modelFields: ['name@text', 'style@multiselect']
            },
            items: [
              {
                id: 'hero',
                componentType: 'core/franklin/components/block/v1/block',
                properties: {
                  name: 'Hero',
                  model: 'hero',
                  aueComponentId: 'hero',
                  image: '/content/dam/aem-eds-ue/hero.png',
                  imageAlt: 'About Us Hero',
                  text: '<p>WKND is a collective of outdoors, music, crafts, adventure sports, and travel enthusiasts that want to share our experiences, connections, and expertise with the world.</p>',
                  modelFields: ['image@reference', 'imageAlt@text', 'text@richtext']
                },
                items: []
              }
            ]
          },
          {
            id: 'section_contributors',
            componentType: 'core/franklin/components/section/v1/section',
            properties: {
              name: 'Contributors',
              model: 'section',
              aueComponentId: 'section',
              modelFields: ['name@text', 'style@multiselect']
            },
            items: [
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
                      image: '/content/dam/wknd/en/contributors/stacey-roswells.jpg',
                      text: '<p><strong>Stacey Roswells</strong></p><p>Artist | Photographer | Traveler</p>',
                      modelFields: ['image@reference', 'text@richtext']
                    },
                    items: []
                  },
                  {
                    id: 'card_jake',
                    componentType: 'core/franklin/components/block/v1/block/item',
                    properties: {
                      image: '/content/dam/wknd/en/contributors/alex-iby.jpg',
                      text: '<p><strong>Jake Hammer</strong></p><p>Influencer | Writer</p>',
                      modelFields: ['image@reference', 'text@richtext']
                    },
                    items: []
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  console.log('=== Step 3: Execute write-api (PUT page content) ===');
  const writeRes = await callAemCloudMcp('write-api', {
    aemUrl,
    code: `
      const r = await aem.put(
        '/adobe/experimental/aspm-expires-20251231/pages/${destId}/content',
        ${JSON.stringify(newContent)},
        '${etag}'
      );
      return { status: r.status, etag: r.etag, body: r.body };
    `
  });

  console.log('write-api response:', JSON.stringify(writeRes, null, 2));

  console.log('=== Step 4: Verify via read-api ===');
  const verifyRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/adobe/experimental/aspm-expires-20251231/pages/${destId}/content');
      return { status: r.status, body: r.body };
    `
  });

  const verifyResult = JSON.parse(verifyRes.content[0].text);
  console.log('Verify Status:', verifyResult.status);
  fs.writeFileSync('scratch/authored_result.json', JSON.stringify(verifyResult, null, 2));
  console.log('Saved verified content to scratch/authored_result.json');
}

main().catch(console.error);
