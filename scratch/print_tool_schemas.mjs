import fs from 'fs';

const raw = fs.readFileSync('scratch/aem_cloud_tools.json', 'utf8');
const data = JSON.parse(raw);
const tools = data.result?.tools || [];

for (const t of tools) {
  console.log(`\n================== ${t.name} ==================`);
  console.log('Description:', t.description);
  console.log('Schema:', JSON.stringify(t.inputSchema, null, 2));
}
