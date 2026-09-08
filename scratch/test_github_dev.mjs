import fs from 'fs';

async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const token = env.match(/GITHUB_TOKEN=(.+)/)?.[1]?.trim();
  const repo = 'Shaik-Tajuddin/wknd-eds';

  console.log('Testing GitHub API access to branch dev...');
  const res = await fetch(`https://api.github.com/repos/${repo}/branches/dev`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Antigravity'
    }
  });

  const json = await res.json();
  console.log('Branch dev commit:', json.commit?.sha);

  const fileRes = await fetch(`https://api.github.com/repos/${repo}/contents/blocks/cards/cards.js?ref=dev`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Antigravity'
    }
  });
  const fileJson = await fileRes.json();
  console.log('cards.js sha on dev:', fileJson.sha);
}

main().catch(console.error);
