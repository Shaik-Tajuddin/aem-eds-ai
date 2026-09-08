import fs from 'fs';

const raw = fs.readFileSync('scratch/aem_cloud_tools.json', 'utf8');
const data = JSON.parse(raw);
const tools = data.result?.tools || [];

console.log(`Found ${tools.length} tools in aem-cloud MCP:`);
for (const t of tools) {
  console.log(`- ${t.name}: ${t.description?.slice(0, 100)}...`);
}
