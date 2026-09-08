import { resolveAemAccessToken } from '../packages/aem/dist/index.js';

async function testAuthorEndpoints() {
  const tokenObj = await resolveAemAccessToken(process.env);
  const token = tokenObj?.accessToken;
  console.log('Got IMS Token:', Boolean(token));

  const authorBase = 'https://author-p149251-e1522049.adobeaemcloud.com';
  const endpoints = [
    '/content/wknd-eds/test/about-us.json',
    '/content/wknd-eds/test/about-us/jcr:content.json',
    '/content/wknd-eds/test/about-us.html',
    '/content/wknd-eds/test.json',
    '/content/wknd-eds.json',
    '/api/assets/wknd.json',
    '/api/assets.json',
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${authorBase}${ep}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      console.log(ep, '-> HTTP', res.status);
      if (res.ok) {
        const text = await res.text();
        console.log('   Body:', text.slice(0, 200));
      }
    } catch (err) {
      console.error(ep, 'error:', err.message);
    }
  }
}

testAuthorEndpoints();
