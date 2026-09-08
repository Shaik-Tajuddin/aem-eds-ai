import fs from 'fs';

async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const token = env.match(/GITHUB_TOKEN=(.+)/)?.[1]?.trim();
  const repo = 'Shaik-Tajuddin/wknd-eds';

  const r = await fetch(`https://api.github.com/repos/${repo}/contents/styles/styles.css?ref=dev`, {
    headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'Antigravity' }
  });
  const j = await r.json();
  const sha = j.sha;
  const currentContent = Buffer.from(j.content, 'base64').toString('utf8');

  const additionalStyles = `

/* WKND Parity Headings & Typography */
main h1#about-us {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #202020;
  margin: 2.5rem 0 1rem;
  letter-spacing: -0.02em;
}

main h2#our-contributors {
  position: relative;
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  color: #202020;
  margin: 3rem 0 1rem;
  padding-bottom: 0.75rem;
}

main h2#our-contributors::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 4px;
  background-color: #ffea00;
  border-radius: 2px;
}

main p[data-richtext-component="text"] i {
  font-style: italic;
  font-size: 1.125rem;
  line-height: 1.7;
  color: #555555;
  display: block;
  margin-bottom: 2rem;
  max-width: 850px;
}
`;

  const updatedContent = currentContent + additionalStyles;

  const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/styles/styles.css`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Antigravity'
    },
    body: JSON.stringify({
      message: 'style(headings): add WKND title, contributors underline, and lead paragraph styling',
      content: Buffer.from(updatedContent).toString('base64'),
      branch: 'dev',
      sha
    })
  });

  const putJson = await putRes.json();
  console.log('styles.css commit:', putJson.commit?.sha);
}

main().catch(console.error);
