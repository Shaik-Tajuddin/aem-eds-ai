async function checkTarget() {
  const urls = [
    'https://dev--wknd-eds--shaik-tajuddin.aem.live/test/about-us.plain.html',
    'https://dev--wknd-eds--shaik-tajuddin.aem.live/test/about-us.html',
    'https://dev--wknd-eds--shaik-tajuddin.aem.live/test/about-us.json',
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(url, '-> HTTP', res.status);
      if (res.ok) {
        const text = await res.text();
        console.log('Sample content (first 300 chars):', text.slice(0, 300));
      }
    } catch (err) {
      console.error(url, 'error:', err.message);
    }
  }
}

checkTarget();
