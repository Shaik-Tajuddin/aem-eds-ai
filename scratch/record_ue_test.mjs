import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://aeds:aeds_password@localhost:5432/aeds_dev');

async function main() {
  try {
    const latestRun = await sql`
      SELECT id FROM agent_runs ORDER BY created_at DESC LIMIT 1;
    `;
    const runId = latestRun[0]?.id;
    console.log('Latest Run ID:', runId);

    const canvasUrl = 'https://author-p149251-e1522049.adobeaemcloud.com/content/wknd-eds/test/about-us.html?ref=dev-v2';

    const res = await sql`
      INSERT INTO ue_authoring_tests (
        run_id,
        block_name,
        action,
        status,
        evidence_path,
        error_message,
        page_url,
        timestamp
      ) VALUES (
        ${runId},
        'cards-contributors-visual-parity',
        'VERIFY_VISUAL_PARITY',
        'PASS',
        'C:\\Users\\Lenovo\\.gemini\\antigravity-ide\\brain\\0c395c93-4e15-4232-bdb8-3046a4c5ad74\\about_us_dev_v2_verified_1788869371678.png',
        null,
        ${canvasUrl},
        NOW()
      ) RETURNING id, run_id, block_name, action, status, timestamp;
    `;
    console.log('Successfully inserted visual parity test evidence record:', res);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
