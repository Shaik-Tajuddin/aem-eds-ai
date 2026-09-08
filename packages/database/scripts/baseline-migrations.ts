import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

async function main() {
  const root = dirname(fileURLToPath(import.meta.url));
  const pkgRoot = join(root, '..');
  const url = process.env.DATABASE_URL ?? 'postgresql://aeds:aeds_password@localhost:5432/aeds_dev';
  const sql = postgres(url, { max: 1 });

  const migrationPath = join(pkgRoot, 'src/migrations/0000_init_mvp.sql');
  const body = readFileSync(migrationPath, 'utf8');
  const hash = createHash('sha256').update(body).digest('hex');
  const when = 1788804641225; // journal "when" for 0000_init_mvp

  try {
    const tableCount = await sql`
      select count(*)::int as n
      from pg_tables
      where schemaname = 'public'
    `;
    console.log(`public tables: ${tableCount[0]?.n ?? 0}`);
    console.log(`0000_init_mvp hash: ${hash}`);

    await sql`create schema if not exists drizzle`;
    await sql`
      create table if not exists drizzle.__drizzle_migrations (
        id serial primary key,
        hash text not null,
        created_at bigint
      )
    `;

    const existing = await sql`
      select id, hash, created_at from drizzle.__drizzle_migrations order by id
    `;
    console.log(`existing migration rows: ${existing.length}`);
    for (const row of existing) {
      console.log(`  id=${row.id} hash=${String(row.hash).slice(0, 12)}… created_at=${row.created_at}`);
    }

    if (existing.some((r) => r.hash === hash)) {
      console.log('Baseline already present — nothing to do.');
      return;
    }

    if ((tableCount[0]?.n ?? 0) === 0) {
      console.log('No public tables — skip baseline; run npm run db:migrate instead.');
      return;
    }

    await sql`
      insert into drizzle.__drizzle_migrations (hash, created_at)
      values (${hash}, ${when})
    `;
    console.log('Inserted baseline for 0000_init_mvp (schema was already applied via db:push).');
  } finally {
    await sql.end({ timeout: 2 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
