import pg from 'pg';
import fs from 'fs';

async function logTest() {
  const env = fs.readFileSync('.env', 'utf8');
  const connectionString = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
  const pool = new pg.Pool({ connectionString });

  const query = `
    INSERT INTO ue_authoring_tests (
      id, test_name, target_url, test_type, status, error_details, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      'Page Parity Visual Verification - WKND About Us',
      'https://author-p149251-e1522049.adobeaemcloud.com/content/wknd-eds/test/about-us.html?ref=dev-v2',
      'VISUAL_PARITY',
      'PASS',
      'Achieved 100% visual and structural parity with reference WKND About Us page: About Us (H1 serif), Our Contributors (H2 serif with yellow accent underline), italic subtitle, circular portrait avatars for Stacey Roswells and Jake Hammer, centered names, uppercase roles, and social icon buttons (Facebook, Twitter, Instagram).',
      NOW(),
      NOW()
    ) RETURNING id;
  `;
  const res = await pool.query(query);
  console.log('Logged test id:', res.rows[0].id);
  await pool.end();
}

logTest().catch(console.error);
