import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://aeds:aeds_password@localhost:5432/aeds_dev');

async function main() {
  try {
    const test = await sql`SELECT 1 as connected`;
    console.log('Connected to DB:', test);

    const projects = await sql`SELECT * FROM projects`;
    console.log('=== PROJECTS ===', JSON.stringify(projects, null, 2));

    const environments = await sql`SELECT * FROM environments`;
    console.log('=== ENVIRONMENTS ===', JSON.stringify(environments, null, 2));

    const projectConfigs = await sql`SELECT * FROM project_configs`;
    console.log('=== PROJECT CONFIGS ===', JSON.stringify(projectConfigs, null, 2));

    const repositories = await sql`SELECT * FROM repositories`;
    console.log('=== REPOSITORIES ===', JSON.stringify(repositories, null, 2));

    const agentRuns = await sql`SELECT * FROM agent_runs ORDER BY created_at DESC LIMIT 5`;
    console.log('=== AGENT RUNS ===', JSON.stringify(agentRuns, null, 2));

    const pullRequests = await sql`SELECT * FROM pull_requests ORDER BY created_at DESC LIMIT 5`;
    console.log('=== PULL REQUESTS ===', JSON.stringify(pullRequests, null, 2));

    const blocks = await sql`SELECT * FROM blocks ORDER BY generated_at DESC LIMIT 10`;
    console.log('=== BLOCKS ===', JSON.stringify(blocks, null, 2));

    const ueTests = await sql`SELECT * FROM ue_authoring_tests ORDER BY timestamp DESC LIMIT 5`;
    console.log('=== UE AUTHORING TESTS ===', JSON.stringify(ueTests, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('DB Query Error:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
