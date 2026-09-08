import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://aeds:aeds_password@localhost:5432/aeds_dev');

async function main() {
  const repos = await sql`SELECT * FROM repositories`;
  console.log('Repos:', repos);
  const runs = await sql`SELECT id, project_id, branch, pr_number, pr_url, status FROM agent_runs ORDER BY created_at DESC LIMIT 3`;
  console.log('Runs:', runs);
  await sql.end();
}

main().catch(console.error);
