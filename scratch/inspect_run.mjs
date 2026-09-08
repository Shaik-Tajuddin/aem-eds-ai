import postgres from 'postgres';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const connectionString = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim() || 'postgresql://aeds:aeds_password@localhost:5432/aeds_dev';
const sql = postgres(connectionString);

async function main() {
  const sample = await sql`SELECT * FROM agent_runs LIMIT 1`;
  console.log('Columns in agent_runs:', Object.keys(sample[0]));

  const runId = '3fc5edce-1c5b-4a1e-982d-3078e588e00f';
  const runs = await sql`SELECT * FROM agent_runs WHERE id = ${runId}`;
  console.log('Target run found:', runs.length > 0 ? runs[0] : 'not found');

  await sql.end();
}

main().catch(console.error);
