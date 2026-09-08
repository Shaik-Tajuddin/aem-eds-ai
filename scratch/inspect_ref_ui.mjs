import fs from 'fs';

const html = fs.readFileSync('scratch/ref_page.html', 'utf8');

console.log('--- CSS Links in Reference Page ---');
const cssLinks = html.match(/<link[^>]*rel="stylesheet"[^>]*>/g) || [];
cssLinks.forEach(l => console.log(l));

console.log('\n--- Contributors Layout in Reference Page ---');
const staceyIdx = html.indexOf('Stacey Roswells');
const sectionStart = html.lastIndexOf('<section', staceyIdx);
const sectionEnd = html.indexOf('</section>', staceyIdx) + 10;
console.log(html.slice(sectionStart, sectionEnd));
