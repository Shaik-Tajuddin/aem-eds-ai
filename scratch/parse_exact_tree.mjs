import fs from 'fs';

const raw = fs.readFileSync('scratch/mcp_exact_about_us_content.json', 'utf8');
const data = JSON.parse(raw);
const body = typeof data.structuredContent?.text === 'string'
  ? JSON.parse(data.structuredContent.text)
  : (data.content?.[0]?.text ? JSON.parse(data.content[0].text) : data);

console.log('Top level keys:', Object.keys(body));
console.log('Properties:', body.properties);

function dumpComponents(node, depth = 0) {
  const indent = '  '.repeat(depth);
  if (node.componentType) {
    console.log(`${indent}- [${node.componentType}] (id: ${node.id})`);
    if (node.properties) {
      for (const [k, v] of Object.entries(node.properties)) {
        if (typeof v === 'string' && v.length > 80) {
          console.log(`${indent}    ${k}: ${v.slice(0, 80)}...`);
        } else {
          console.log(`${indent}    ${k}: ${JSON.stringify(v)}`);
        }
      }
    }
  }
  if (Array.isArray(node.items)) {
    for (const child of node.items) {
      dumpComponents(child, depth + 1);
    }
  }
}

console.log('\n=== COMPONENT TREE ===');
dumpComponents(body);
