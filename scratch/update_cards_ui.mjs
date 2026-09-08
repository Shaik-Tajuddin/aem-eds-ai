import fs from 'fs';

async function main() {
  const env = fs.readFileSync('.env', 'utf8');
  const token = env.match(/GITHUB_TOKEN=(.+)/)?.[1]?.trim();
  const repo = 'Shaik-Tajuddin/wknd-eds';

  async function getFileInfo(path) {
    const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=dev`, {
      headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'Antigravity' }
    });
    const j = await r.json();
    return { sha: j.sha };
  }

  async function updateFile(path, content, message, sha) {
    const body = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch: 'dev',
      sha
    };
    const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Antigravity'
      },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    return j;
  }

  const newCardsJs = `export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  block.textContent = '';

  rows.forEach((row) => {
    const pic = row.querySelector('picture') || row.querySelector('img');
    const textContent = row.textContent || '';
    const m = textContent.match(/\\/content\\/experience-fragments\\/[^\\s"']+/);
    const path = m ? m[0] : '';

    let name = '';
    let role = '';

    const strong = row.querySelector('strong');
    if (strong) {
      name = strong.textContent.trim();
    } else if (path) {
      const segs = path.split('/').filter(Boolean);
      const slug = segs.length > 1 ? segs[segs.length - 2] : segs[0];
      name = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    const paragraphs = [...row.querySelectorAll('p')];
    paragraphs.forEach((p) => {
      const txt = p.textContent.trim();
      if (txt.includes('|')) {
        role = txt;
      } else if (!txt.includes('http') && !txt.includes('/content/') && txt !== name && !role) {
        role = txt;
      }
    });

    const card = document.createElement('div');
    card.className = 'cards-card';

    if (pic) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'cards-card-image';
      imgWrapper.append(pic);
      card.append(imgWrapper);
    }

    const body = document.createElement('div');
    body.className = 'cards-card-body';

    if (name) {
      const title = document.createElement('h3');
      title.className = 'cards-card-title';
      title.textContent = name;
      body.append(title);
    }

    if (role) {
      const roleEl = document.createElement('p');
      roleEl.className = 'cards-card-role';
      roleEl.textContent = role;
      body.append(roleEl);
    }

    if (path) {
      const ref = document.createElement('a');
      ref.className = 'cards-card-link';
      ref.href = path;
      ref.textContent = 'View profile →';
      body.append(ref);
    }

    card.append(body);
    block.append(card);
  });
}
`;

  const newCardsCss = `.cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  padding: 0;
  margin: 2rem 0;
  list-style: none;
}

@media (width >= 700px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

.cards-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgb(0 0 0 / 8%);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #eaeaea;
}

.cards-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
}

.cards-card-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f0f0f0;
}

.cards-card-image picture,
.cards-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cards-card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.cards-card-title {
  margin: 0 0 0.25rem 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #202020;
}

.cards-card-role {
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #777;
}

.cards-card-link {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  color: #202020;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  border-bottom: 2px solid #ffea00;
  width: fit-content;
  padding-bottom: 2px;
}

.cards-card-link:hover {
  border-bottom-color: #202020;
}
`;

  console.log('--- Updating blocks/cards/cards.js on dev ---');
  const jsInfo = await getFileInfo('blocks/cards/cards.js');
  const jsRes = await updateFile('blocks/cards/cards.js', newCardsJs, 'fix(cards): render picture, role, and profile link matching reference WKND cards', jsInfo.sha);
  console.log('cards.js commit:', jsRes.commit?.sha);

  console.log('--- Updating blocks/cards/cards.css on dev ---');
  const cssInfo = await getFileInfo('blocks/cards/cards.css');
  const cssRes = await updateFile('blocks/cards/cards.css', newCardsCss, 'style(cards): match reference WKND card layout, aspect ratio, and typography', cssInfo.sha);
  console.log('cards.css commit:', cssRes.commit?.sha);
}

main().catch(console.error);
