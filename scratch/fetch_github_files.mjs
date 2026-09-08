import fs from 'fs';

async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const token = env.match(/GITHUB_TOKEN=(.+)/)?.[1]?.trim();
  const repo = 'Shaik-Tajuddin/wknd-eds';

  async function getFile(path) {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=dev`, {
      headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'Antigravity' }
    });
    const json = await res.json();
    return { sha: json.sha, content: Buffer.from(json.content, 'base64').toString('utf8') };
  }

  const cardsCss = await getFile('blocks/cards/cards.css');
  console.log('--- blocks/cards/cards.css (sha:', cardsCss.sha, ') ---');
  console.log(cardsCss.content);

  const stylesCss = await getFile('styles/styles.css');
  console.log('--- styles/styles.css (sha:', stylesCss.sha, ', len:', stylesCss.content.length, ') ---');
  console.log(stylesCss.content.slice(0, 500));
}

main().catch(console.error);
