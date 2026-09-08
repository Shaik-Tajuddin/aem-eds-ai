async function checkHlx() {
  const urls = [
    'https://admin.hlx.page/status/Shaik-Tajuddin/wknd-eds/dev/test/about-us',
    'https://admin.hlx.page/status/Shaik-Tajuddin/wknd-eds/main/test/about-us',
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(url, '-> HTTP', res.status);
      if (res.ok) {
        const json = await res.json();
        console.log('Response:', JSON.stringify(json, null, 2));
      } else {
        console.log('Text:', await res.text());
      }
    } catch (err) {
      console.error(url, 'error:', err.message);
    }
  }
}

checkHlx();
