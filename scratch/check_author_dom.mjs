async function main() {
  const url = `https://author-p149251-e1522049.adobeaemcloud.com/content/wknd-eds/test/about-us.html?ref=dev&ts=${Date.now()}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from('aemaiuser:aemaiuser').toString('base64')
    }
  });

  const html = await res.text();
  console.log('Status:', res.status, 'HTML length:', html.length);

  const idx = html.indexOf('class="cards');
  if (idx !== -1) {
    console.log('Cards block snippet:\n', html.slice(idx - 50, idx + 2000));
  } else {
    console.log('Cards block not found');
  }

  // Check scripts or css loaded
  const matches = html.match(/(?:src|href)="([^"]*cards[^"]*)"/g);
  console.log('Cards assets referenced:', matches);
}

main().catch(console.error);
