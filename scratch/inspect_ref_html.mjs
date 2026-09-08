import fs from 'fs';

const html = fs.readFileSync('scratch/ref_page.html', 'utf8');
const titles = html.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g) || [];
console.log('Headings in ref page:', titles);

const xfs = html.match(/class="[^"]*experiencefragment[^"]*"[\s\S]*?<\/section>/g) || [];
console.log('XFs count:', xfs.length);
if (xfs.length) {
  xfs.forEach((xf, i) => console.log(`XF ${i}:\n`, xf.slice(0, 300)));
}
