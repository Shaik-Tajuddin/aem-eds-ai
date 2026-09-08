import fs from 'fs';

async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const token = env.match(/GITHUB_TOKEN=(.+)/)?.[1]?.trim();
  const repo = 'Shaik-Tajuddin/wknd-eds';

  const r = await fetch(`https://api.github.com/repos/${repo}/contents/scripts/aem.js?ref=dev`, {
    headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'Antigravity' }
  });
  const j = await r.json();
  const content = Buffer.from(j.content, 'base64').toString('utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('codeBasePath') || l.includes('loadBlock') || l.includes('loadCSS')) {
      console.log((i + 1) + ': ' + l);
    }
  });
}

main().catch(console.error);
