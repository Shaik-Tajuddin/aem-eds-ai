async function main() {
  const url = 'https://author-p149251-e1522049.adobeaemcloud.com/content/wknd/language-masters/en/about-us.html?wcmmode=disabled';
  const res = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from('aemaiuser:aemaiuser').toString('base64')
    }
  });
  const html = await res.text();
  console.log('Status:', res.status, 'HTML length:', html.length);
  
  // Find where Stacey Roswells appears
  const idx = html.indexOf('Stacey Roswells');
  const css = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map(m => m[1]);
  console.log('CSS links:', css);
}

main().catch(console.error);
