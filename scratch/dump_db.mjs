import postgres from 'postgres';
import fs from 'fs';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://aeds:aeds_password@localhost:5432/aeds_dev');

async function main() {
  const data = {};
  data.projects = await sql`SELECT * FROM projects`;
  data.environments = await sql`SELECT * FROM environments`;
  data.projectConfigs = await sql`SELECT * FROM project_configs`;
  data.repositories = await sql`SELECT * FROM repositories`;
  data.runs = await sql`SELECT id, project_id, status, source, source_url, branch, git_commit, model, progress, current_stage, started_at, completed_at FROM agent_runs ORDER BY created_at DESC LIMIT 5`;

  fs.writeFileSync('scratch/db_dump.json', JSON.stringify(data, null, 2));
  console.log('Written to scratch/db_dump.json');
  await sql.end();
}

main();
