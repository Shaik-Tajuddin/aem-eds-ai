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
  console.log('Keys of body:', Object.keys(current.body));
  console.log('Body items length:', current.body.items?.length);
  console.log('Item 0 id:', current.body.items[0]?.id);
  console.log('Item 0 items:', current.body.items[0]?.items?.map(i => i.id));
}

main().catch(console.error);
