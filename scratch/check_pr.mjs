import fs from 'fs';

async function main() {
  let token;
  try {
    const env = fs.readFileSync('.env', 'utf8');
    const m = env.match(/GITHUB_TOKEN=(.+)/);
    if (m) token = m[1].trim();
  } catch (e) {}

  const headers = {
    'User-Agent': 'Antigravity',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const rf = await fetch('https://api.github.com/repos/Shaik-Tajuddin/wknd-eds/pulls/15/files', { headers });
  const files = await rf.json();
  if (Array.isArray(files)) {
    console.log('Files in PR 15:');
    files.forEach(f => {
      console.log('File:', f.filename);
      console.log('Patch:', f.patch);
    });
  } else {
    console.log('Files res:', files);
  }
}

main().catch(console.error);
