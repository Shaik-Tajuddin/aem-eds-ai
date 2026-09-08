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
    return { sha: j.sha, content: Buffer.from(j.content, 'base64').toString('utf8') };
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

  const cardsJs = `export default function decorate(block) {
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

    // Social buttons matching WKND reference
    const social = document.createElement('div');
    social.className = 'cards-card-social';
    const slug = (name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');

    const socials = [
      {
        name: 'Facebook',
        icon: '<svg viewBox=\"0 0 24 24\" width=\"14\" height=\"14\" fill=\"currentColor\"><path d=\"M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z\"/></svg>',
        href: '#facebook-' + slug
      },
      {
        name: 'Twitter',
        icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z"/></svg>',
        href: '#twitter-' + slug
      },
      {
        name: 'Instagram',
        icon: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
        href: '#instagram-' + slug
      }
    ];

    socials.forEach((s) => {
      const btn = document.createElement('a');
      btn.className = 'cards-social-btn';
      btn.href = s.href;
      btn.setAttribute('aria-label', s.name);
      btn.innerHTML = s.icon;
      social.append(btn);
    });

    body.append(social);
    card.append(body);
    block.append(card);
  });
}
`;

  const cardsCss = `.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 4rem;
  padding: 0;
  margin: 2rem 0 4rem 0;
  list-style: none;
}

.cards-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: transparent;
  border: none;
  box-shadow: none;
  width: 260px;
}

.cards-card-image {
  width: 164px;
  height: 164px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 1.25rem auto;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cards-card-image picture,
.cards-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cards-card-body {
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.cards-card-title {
  margin: 0 0 0.35rem 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: #202020;
  line-height: 1.2;
}

.cards-card-role {
  margin: 0 0 1rem 0;
  font-family: var(--body-font-family, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #202020;
}

.cards-card-social {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cards-social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: #202020;
  color: #ffffff;
  border-radius: 0;
  text-decoration: none;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.cards-social-btn:hover {
  background-color: #ffea00;
  color: #202020;
}

.cards-social-btn svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
`;

  console.log('Fetching file info for dev branch...');
  const jsInfo = await getFileInfo('blocks/cards/cards.js');
  const cssInfo = await getFileInfo('blocks/cards/cards.css');
  const stylesInfo = await getFileInfo('styles/styles.css');

  console.log('Updating blocks/cards/cards.js...');
  const jsRes = await updateFile('blocks/cards/cards.js', cardsJs, 'fix(cards): circular portrait avatar, typography and social buttons matching WKND reference', jsInfo.sha);
  console.log('cards.js updated:', jsRes.commit?.sha);

  console.log('Updating blocks/cards/cards.css...');
  const cssRes = await updateFile('blocks/cards/cards.css', cardsCss, 'style(cards): circular avatars, clean typography and social icon buttons', cssInfo.sha);
  console.log('cards.css updated:', cssRes.commit?.sha);

  // Update styles.css with typography parity
  let stylesContent = stylesInfo.content;
  // Append or replace typography overrides
  const customWkndStyles = `
/* --- WKND About Us Parity --- */
main h1#about-us,
main h1 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 2.75rem;
  font-weight: 400;
  color: #202020;
  margin: 2.5rem 0 1.5rem 0;
}

main h2#our-contributors,
main h2 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 2rem;
  font-weight: 400;
  color: #202020;
  margin: 2.5rem 0 0.5rem 0;
  position: relative;
}

main h2#our-contributors::after,
main h2[id*="contributor"]::after {
  content: '';
  display: block;
  width: 65px;
  height: 3px;
  background-color: #ffea00;
  margin-top: 10px;
}

main p em,
main em {
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  font-size: 1.05rem;
  color: #202020;
  display: inline-block;
  margin: 0.5rem 0 1rem 0;
  max-width: 800px;
  line-height: 1.6;
}
`;

  if (!stylesContent.includes('WKND About Us Parity')) {
    stylesContent += customWkndStyles;
    console.log('Updating styles/styles.css...');
    const stylesRes = await updateFile('styles/styles.css', stylesContent, 'style: add WKND About Us typography and yellow accent bar', stylesInfo.sha);
    console.log('styles.css updated:', stylesRes.commit?.sha);
  } else {
    // Replace the section
    const idx = stylesContent.indexOf('/* --- WKND About Us Parity --- */');
    stylesContent = stylesContent.slice(0, idx) + customWkndStyles.trim();
    console.log('Updating styles/styles.css...');
    const stylesRes = await updateFile('styles/styles.css', stylesContent, 'style: refine WKND About Us typography and yellow accent bar', stylesInfo.sha);
    console.log('styles.css updated:', stylesRes.commit?.sha);
  }

  console.log('All updates pushed to dev branch successfully!');
}

main().catch(console.error);
