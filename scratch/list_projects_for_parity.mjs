import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgresql://aeds:aeds_password@localhost:5432/aeds_dev', {
  max: 1,
});

const nameFilter = process.argv[2]?.trim();

const rows = nameFilter
  ? await sql`
      SELECT p.id, p.name, pc.source_url, e.author_url, e.authoring_path, e.preview_url,
             r.full_name AS repo, r.default_branch
      FROM projects p
      LEFT JOIN project_configs pc ON pc.project_id = p.id
      LEFT JOIN environments e ON e.project_id = p.id
      LEFT JOIN repositories r ON r.project_id = p.id
      WHERE p.archived_at IS NULL AND p.name ILIKE ${'%' + nameFilter + '%'}
      ORDER BY p.updated_at DESC
      LIMIT 20
    `
  : await sql`
      SELECT p.id, p.name, pc.source_url, e.author_url, e.authoring_path, e.preview_url,
             r.full_name AS repo, r.default_branch
      FROM projects p
      LEFT JOIN project_configs pc ON pc.project_id = p.id
      LEFT JOIN environments e ON e.project_id = p.id
      LEFT JOIN repositories r ON r.project_id = p.id
      WHERE p.archived_at IS NULL
      ORDER BY p.updated_at DESC
      LIMIT 20
    `;

console.log(JSON.stringify(rows, null, 2));
await sql.end();
