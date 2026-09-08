import fs from 'fs';

const raw = fs.readFileSync('scratch/wknd_pages.json', 'utf8');
const data = JSON.parse(raw);
const body = typeof data.structuredContent?.text === 'string' 
  ? JSON.parse(data.structuredContent.text)
  : (data.content?.[0]?.text ? JSON.parse(data.content[0].text) : data);

const items = body.items || [];
console.log(`Found ${items.length} pages:`);

const aboutPages = items.filter(p => JSON.stringify(p).toLowerCase().includes('about'));
console.log('About pages:', JSON.stringify(aboutPages, null, 2));

for (const p of items.slice(0, 15)) {
  console.log(`- ${p.title} (${p.name}) [id: ${p.id}]`);
}
