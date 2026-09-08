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
  const sectionItems = current.body.items[0].items[0].items;

  console.log('Current section items before patch:', sectionItems.map((item, idx) => ({ idx, id: item.id, type: item.componentType })));

  // 1. Check if title_about_us already exists
  const hasAboutUs = sectionItems.some(i => i.id === 'title_about_us');
  const patchOps = [];

  if (!hasAboutUs) {
    console.log('Adding title_about_us at index 0...');
    patchOps.push({
      op: 'add',
      path: '/items/0/items/0/items/0',
      value: {
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
      }
    });
  }

  // Cards block index will be 3 if title_about_us is added at index 0, or 2 if not added
  const cardsIndex = hasAboutUs ? 2 : 3;

  // Let's update card_stacey and card_jake images to wknd-shared
  patchOps.push({
    op: 'replace',
    path: `/items/0/items/0/items/${cardsIndex}/items/0/properties/image`,
    value: '/content/dam/wknd-shared/en/contributors/stacey-roswells.jpg'
  });
  patchOps.push({
    op: 'replace',
    path: `/items/0/items/0/items/${cardsIndex}/items/1/properties/image`,
    value: '/content/dam/wknd-shared/en/contributors/alex-iby-343837.jpg'
  });

  console.log('=== 2. Executing PATCH with operations ===', JSON.stringify(patchOps, null, 2));
  const patchRes = await callAemCloudMcp('write-api', {
    aemUrl,
    code: `
      const r = await aem.patch(
        '/adobe/experimental/aspm-expires-20251231/pages/${destId}/content',
        ${JSON.stringify(patchOps)},
        '${etag}'
      );
      return { status: r.status, body: r.body };
    `
  });

  console.log('Patch result:', JSON.stringify(patchRes, null, 2));

  console.log('=== 3. Verifying Rendered HTML ===');
  const verifyRes = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds/test/about-us.html?ref=dev');
      return { status: r.status, len: (r.body || '').length, preview: r.body };
    `
  });

  const parsed = JSON.parse(verifyRes.content[0].text);
  const html = parsed.preview || '';
  const headings = html.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g) || [];
  console.log('Headings in rendered HTML:', headings);
  console.log('Images in rendered HTML:', html.match(/\/content\/dam\/[^"'\s]+/g));
}

main().catch(console.error);
