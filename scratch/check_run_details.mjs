import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://aeds:aeds_password@localhost:5432/aeds_dev');

async function main() {
  try {
    const projects = await sql`SELECT * FROM projects`;
    console.log('=== PROJECTS ===\n', JSON.stringify(projects, null, 2));

    const environments = await sql`SELECT * FROM environments`;
    console.log('=== ENVIRONMENTS ===\n', JSON.stringify(environments, null, 2));

    const projectConfigs = await sql`SELECT * FROM project_configs`;
    console.log('=== PROJECT CONFIGS ===\n', JSON.stringify(projectConfigs, null, 2));

    const repositories = await sql`SELECT * FROM repositories`;
    console.log('=== REPOSITORIES ===\n', JSON.stringify(repositories, null, 2));

    const latestRuns = await sql`SELECT id, project_id, status, source, source_url, branch, git_commit, model, progress, current_stage, started_at, completed_at FROM agent_runs ORDER BY created_at DESC LIMIT 3`;
    console.log('=== LATEST AGENT RUNS ===\n', JSON.stringify(latestRuns, null, 2));

    const latestRun = latestRuns[0];
    if (latestRun) {
      const runFull = await sql`SELECT * FROM agent_runs WHERE id = ${latestRun.id}`;
      console.log('=== LATEST RUN FULL (State Snapshot, etc.) ===\n', JSON.stringify(runFull, null, 2));
      
      const steps = await sql`SELECT * FROM agent_steps WHERE run_id = ${latestRun.id} ORDER BY "order" ASC`;
      console.log('=== LATEST RUN STEPS ===\n', JSON.stringify(steps, null, 2));

      const events = await sql`SELECT type, actor, step, status, data, timestamp FROM agent_events WHERE run_id = ${latestRun.id} ORDER BY timestamp ASC`;
      console.log('=== LATEST RUN EVENTS ===\n', JSON.stringify(events, null, 2));

      const toolCalls = await sql`SELECT tool_name, namespace, status, sanitized_input, sanitized_output, error, duration_ms FROM tool_calls WHERE run_id = ${latestRun.id} ORDER BY timestamp ASC`;
      console.log('=== LATEST RUN TOOL CALLS ===\n', JSON.stringify(toolCalls, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

main();
