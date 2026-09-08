async function main() {
  const url = 'https://author-p149251-e1522049.adobeaemcloud.com/etc.clientlibs/wknd/clientlibs/clientlib-site.lc-1ffaccd922ed8dbc9764d5c0c5510182-lc.min.css';
  const res = await fetch(url, {
    headers: { 'Authorization': 'Basic ' + Buffer.from('aemaiuser:aemaiuser').toString('base64') }
  });
  const text = await res.text();
  console.log('CSS length:', text.length);

  // Search for font-family or typography
  const selectors = ['font-family', 'cmp-title', 'cmp-button', 'btn-list', 'contributors', 'stacey'];
  for (const s of selectors) {
    const idx = text.indexOf(s);
    console.log(`Selector "${s}":`, idx !== -1 ? text.slice(Math.max(0, idx - 50), idx + 200) : 'not found');
  }
}

main().catch(console.error);
