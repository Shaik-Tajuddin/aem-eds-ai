async function main() {
  const r = await fetch('https://author-p149251-e1522049.adobeaemcloud.com/content/wknd-eds/test/about-us.html?ref=dev', {
    headers: { 'Authorization': 'Basic ' + Buffer.from('aemaiuser:aemaiuser').toString('base64') }
  });
  const html = await r.text();
  const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*>/g)].map(m => m[1]);
  console.log('Scripts:', scripts);
  const links = [...html.matchAll(/<link[^>]*href="([^"]+)"[^>]*>/g)].map(m => m[1]);
  console.log('Links:', links);
}

main().catch(console.error);
