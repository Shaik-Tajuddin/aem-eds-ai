import postgres from 'postgres';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const connectionString = env.match(/DATABASE_URL=(.+)/)?.[1]?.trim();
const sql = postgres(connectionString);

async function main() {
  const [run] = await sql`SELECT id, status, current_stage, progress, iteration, max_iterations, state_snapshot FROM agent_runs WHERE id = '3fc5edce-1c5b-4a1e-982d-3078e588e00f'`;
  console.log('=== RUN STATUS ===');
  console.log('ID:', run.id);
  console.log('Status:', run.status);
  console.log('Stage:', run.current_stage);
  console.log('Iteration:', run.iteration);

  const snapshot = typeof run.state_snapshot === 'string' ? JSON.parse(run.state_snapshot) : run.state_snapshot;
  console.log('\n=== EVIDENCE IN STATE SNAPSHOT ===');
  if (snapshot?.evidence) {
    for (const ev of snapshot.evidence) {
      console.log(`- [${ev.kind}] ${ev.status}: ${ev.summary}`);
    }
  } else {
    console.log('No evidence array in snapshot. Keys in snapshot:', Object.keys(snapshot || {}));
  }

  const [ueTest] = await sql`SELECT id, block_name, action, status, target_url FROM ue_authoring_tests WHERE run_id = '3fc5edce-1c5b-4a1e-982d-3078e588e00f' OR status = 'PASS' ORDER BY created_at DESC LIMIT 1`;
  console.log('\n=== UE AUTHORING & PARITY TEST RECORD ===');
  console.log(ueTest);

  await sql.end();
}

main().catch(console.error);
