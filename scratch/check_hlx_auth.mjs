async function checkHlxWithAuth() {
  const token = process.env.GITHUB_TOKEN;
  console.log('Using GitHub Token:', token ? token.slice(0, 8) + '...' : 'none');
  
  const url = 'https://admin.hlx.page/status/Shaik-Tajuddin/wknd-eds/dev/test/about-us';
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
      },
    });
    console.log(url, '-> HTTP', res.status);
    const json = await res.json().catch(() => null);
    console.log('Response:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkHlxWithAuth();
