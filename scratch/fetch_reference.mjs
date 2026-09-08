import fs from 'fs';

async function fetchPages() {
  const plainRes = await fetch('https://publish-p149251-e1522049.adobeaemcloud.com/content/wknd/language-masters/en/about-us.plain.html');
  const plainHtml = await plainRes.text();
  console.log('Plain HTML status:', plainRes.status, 'Length:', plainHtml.length);
  fs.writeFileSync('scratch/reference_plain.html', plainHtml);

  const fullRes = await fetch('https://publish-p149251-e1522049.adobeaemcloud.com/content/wknd/language-masters/en/about-us.html');
  const fullHtml = await fullRes.text();
  console.log('Full HTML status:', fullRes.status, 'Length:', fullHtml.length);
  fs.writeFileSync('scratch/reference_full.html', fullHtml);
}

fetchPages();
