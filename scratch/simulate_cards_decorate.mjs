import { callAemCloudMcp } from './call_mcp.mjs';

async function main() {
  const aemUrl = 'https://author-p149251-e1522049.adobeaemcloud.com';

  console.log('Fetching latest HTML from author page...');
  const res = await callAemCloudMcp('read-api', {
    aemUrl,
    code: `
      const r = await aem.get('/content/wknd-eds/test/about-us.html?ref=dev');
      return r.body;
    `
  });

  const html = res.content[0].text;
  const cardsMatch = html.match(/<div[^>]*class="[^"]*cards[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<!--cq/);
  console.log('Cards Block Match in HTML:', !!cardsMatch);
  if (cardsMatch) {
    const inner = cardsMatch[1];
    console.log('Inner Cards Block HTML:\n', inner);
    const paths = inner.match(/\/content\/experience-fragments\/[^\s"'<]+/g) || [];
    console.log('Matched XF paths by cards.js regex:', paths);
    paths.forEach((path) => {
      const segs = path.split('/').filter(Boolean);
      const slug = segs.length > 1 ? segs[segs.length - 2] : segs[0];
      const name = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      console.log(`-> Generated Card: Title="${name}", Link="${path}"`);
    });
  }
}

main().catch(console.error);
