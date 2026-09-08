import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://aeds:aeds_password@localhost:5432/aeds_dev');

async function updateAuthoringPath() {
  const newPath = 'https://author-p149251-e1522049.adobeaemcloud.com/ui#/aem/universal-editor/canvas/author-p149251-e1522049.adobeaemcloud.com/content/wknd-eds/test/about-us.html?ref=dev';
  const updated = await sql`
    UPDATE environments
    SET authoring_path = ${newPath}
    WHERE project_id = '994dda39-cfff-4422-843e-e808aef1721f'
    RETURNING id, project_id, authoring_path
  `;
  console.log('Updated environment record:', updated);
  await sql.end();
}

updateAuthoringPath();
