import { exportPageJcrComponents } from '../packages/aem/dist/index.js';

async function testJcr() {
  const res = await exportPageJcrComponents({
    pageUrl: 'https://publish-p149251-e1522049.adobeaemcloud.com/content/wknd/language-masters/en/about-us.plain.html',
    authorUrl: 'https://author-p149251-e1522049.adobeaemcloud.com/',
  });
  console.log('JCR OK:', res.ok);
  console.log('Fetched From:', res.fetchedFrom);
  console.log('Notes:', res.notes);
  console.log('Components count:', res.components.length);
  console.log('Components:', JSON.stringify(res.components.map(c => ({
    name: c.name,
    resourceType: c.resourceType,
    suggestedBlock: c.suggestedBlock,
    properties: c.properties,
  })), null, 2));
}

testJcr();
