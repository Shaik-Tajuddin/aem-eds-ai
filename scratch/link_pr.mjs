import postgres from 'postgres';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const connectionString = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
const sql = postgres(connectionString);

async function main() {
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'pull_requests'
  `;
  console.log('Columns in pull_requests:', cols.map(c => c.column_name));

  const prs = await sql`SELECT * FROM pull_requests WHERE run_id = '3fc5edce-1c5b-4a1e-982d-3078e588e00f'`;
  console.log('Existing PRs for run:', prs);

  if (prs.length === 0) {
    const res = await sql`
      INSERT INTO pull_requests (
        run_id, project_id, pr_number, url, title, status, provider, base_branch, head_branch, created_at
      ) VALUES (
        '3fc5edce-1c5b-4a1e-982d-3078e588e00f',
        '994dda39-cfff-4422-843e-e808aef1721f',
        17,
        'https://github.com/Shaik-Tajuddin/wknd-eds/pull/17',
        'feat(aeds): EDS pipeline run 3fc5edce parity alignment',
        'OPEN',
        'github',
        'main',
        'aeds/run-3fc5edce-wknd-eds',
        NOW()
      ) RETURNING id;
    `;
    console.log('Inserted PR record:', res[0].id);
  }
  await sql.end();
}

main().catch(console.error);

