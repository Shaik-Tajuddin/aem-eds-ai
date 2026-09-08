/**
 * Bulk-ingest markdown docs into the RAG knowledge store.
 *
 * Default: direct DB ingest via @aeds/rag KnowledgeIndexer (needs DATABASE_URL).
 * Optional: --api to POST each file to the running API.
 *
 * Usage:
 *   npm run knowledge:ingest
 *   npm run knowledge:ingest -- --replace
 *   npm run knowledge:ingest -- --api --api-url http://localhost:3001
 *   npm run knowledge:ingest -- --dry-run
 *   npm run knowledge:ingest -- --dir docs --include-root
 */

import { readdir, readFile, access } from 'node:fs/promises';
import { join, relative, basename, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

type SourceType =
  | 'project-code'
  | 'project-docs'
  | 'standards'
  | 'aem-docs'
  | 'eds-docs'
  | 'custom'
  | 'general';

type CliOptions = {
  dir: string;
  api: boolean;
  apiUrl: string;
  replace: boolean;
  dryRun: boolean;
  includeRoot: boolean;
  projectId?: string;
  sourceType?: SourceType;
};

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const ROOT_DOCS = ['README.md', 'MASTER BUILD PROMPT.md'];

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    dir: 'docs',
    api: false,
    apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    replace: false,
    dryRun: false,
    includeRoot: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--dir' && next) {
      opts.dir = next;
      i++;
    } else if (arg === '--api') {
      opts.api = true;
    } else if (arg === '--api-url' && next) {
      opts.apiUrl = next.replace(/\/$/, '');
      i++;
    } else if (arg === '--replace') {
      opts.replace = true;
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--include-root') {
      opts.includeRoot = true;
    } else if (arg === '--no-root') {
      opts.includeRoot = false;
    } else if (arg === '--project-id' && next) {
      opts.projectId = next;
      i++;
    } else if (arg === '--source-type' && next) {
      opts.sourceType = next as SourceType;
      i++;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`
Ingest markdown documentation into knowledge_documents / knowledge_chunks.

Options:
  --dir <path>           Folder of .md files (default: docs)
  --include-root         Also ingest README.md + MASTER BUILD PROMPT.md (default)
  --no-root              Skip root markdown files
  --source-type <type>   Force sourceType for all files
  --project-id <uuid>    Optional project scope
  --replace              Delete existing docs with the same source before ingest
  --api                  Use HTTP POST /api/knowledge instead of direct DB
  --api-url <url>        API base (default: http://localhost:3001)
  --dry-run              List files only
  -h, --help             Show help
`);
}

/** Minimal .env loader so DATABASE_URL is available without dotenv. */
async function loadEnvFile(path: string): Promise<void> {
  try {
    await access(path);
  } catch {
    return;
  }
  const raw = await readFile(path, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function inferSourceType(relPath: string): SourceType {
  const lower = relPath.toLowerCase().replace(/\\/g, '/');
  if (lower.includes('aem') || lower.includes('universal-editor') || lower.includes('mcp')) {
    return 'aem-docs';
  }
  if (lower.includes('eds') || lower.includes('edge-delivery') || lower.includes('franklin')) {
    return 'eds-docs';
  }
  if (lower.startsWith('docs/') || lower === 'readme.md' || lower.includes('master build')) {
    return 'standards';
  }
  return 'project-docs';
}

async function collectMarkdownFiles(opts: CliOptions): Promise<Array<{ abs: string; source: string }>> {
  const files: Array<{ abs: string; source: string }> = [];
  const docsDir = resolve(ROOT, opts.dir);

  const names = await readdir(docsDir);
  for (const name of names) {
    if (!name.toLowerCase().endsWith('.md')) continue;
    const abs = join(docsDir, name);
    const source = relative(ROOT, abs).replace(/\\/g, '/');
    files.push({ abs, source });
  }

  if (opts.includeRoot) {
    for (const name of ROOT_DOCS) {
      const abs = join(ROOT, name);
      try {
        await access(abs);
        files.push({ abs, source: name });
      } catch {
        // optional
      }
    }
  }

  return files.sort((a, b) => a.source.localeCompare(b.source));
}

async function ingestViaApi(
  opts: CliOptions,
  item: { source: string; title: string; sourceType: SourceType; content: string },
): Promise<{ indexed: boolean; chunks?: number; id?: string }> {
  const url = `${opts.apiUrl}/api/knowledge`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: item.title,
      source: item.source,
      sourceType: item.sourceType,
      content: item.content,
      projectId: opts.projectId,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    indexed?: boolean;
    document?: { id?: string; chunksCount?: number };
  };
  return {
    indexed: Boolean(json.indexed),
    chunks: json.document?.chunksCount,
    id: json.document?.id,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  await loadEnvFile(join(ROOT, '.env'));
  await loadEnvFile(join(ROOT, 'apps', 'api', '.env'));

  const files = await collectMarkdownFiles(opts);
  console.log(`Found ${files.length} markdown file(s) under ${opts.dir}${opts.includeRoot ? ' + root' : ''}`);
  console.log(`Mode: ${opts.api ? `API ${opts.apiUrl}` : 'direct DB (KnowledgeIndexer)'}${opts.replace ? ' · replace' : ''}${opts.dryRun ? ' · dry-run' : ''}\n`);

  if (opts.dryRun) {
    for (const f of files) {
      const sourceType = opts.sourceType ?? inferSourceType(f.source);
      console.log(`  [dry-run] ${f.source}  (${sourceType})`);
    }
    return;
  }

  let ok = 0;
  let fail = 0;
  let totalChunks = 0;

  if (opts.api) {
    if (opts.replace) {
      console.log(
        'Note: --replace with --api does not delete prior rows (no delete-by-source API); duplicates possible.\n',
      );
    }
    for (const f of files) {
      const content = await readFile(f.abs, 'utf8');
      if (!content.trim()) {
        console.log(`  skip  ${f.source} (empty)`);
        continue;
      }
      const title = basename(f.abs, '.md');
      const sourceType = opts.sourceType ?? inferSourceType(f.source);
      try {
        const result = await ingestViaApi(opts, { source: f.source, title, sourceType, content });
        ok++;
        totalChunks += result.chunks ?? 0;
        console.log(
          `  ok    ${f.source}  chunks=${result.chunks ?? '?'}  indexed=${result.indexed}`,
        );
      } catch (err) {
        fail++;
        console.error(`  FAIL  ${f.source}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } else {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is required for direct ingest. Set it in .env or use --api.');
      process.exit(1);
    }

    const { getDatabase, closeDatabase, knowledgeDocuments, knowledgeChunks, eq } = await import(
      '@aeds/database'
    );
    const { DrizzleRagRepository, KnowledgeIndexer } = await import('@aeds/rag');

    const db = getDatabase();
    const repository = new DrizzleRagRepository(db as any);
    const indexer = new KnowledgeIndexer(repository);

    try {
      for (const f of files) {
        const content = await readFile(f.abs, 'utf8');
        if (!content.trim()) {
          console.log(`  skip  ${f.source} (empty)`);
          continue;
        }
        const title = basename(f.abs, '.md');
        const sourceType = opts.sourceType ?? inferSourceType(f.source);

        try {
          if (opts.replace) {
            const existing = await db
              .select({ id: knowledgeDocuments.id })
              .from(knowledgeDocuments)
              .where(eq(knowledgeDocuments.source, f.source));
            for (const row of existing) {
              await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, row.id));
              await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, row.id));
            }
            if (existing.length) {
              console.log(`  replace ${f.source} (removed ${existing.length} prior doc(s))`);
            }
          }

          const result = await indexer.ingestDocument({
            title,
            source: f.source,
            sourceType,
            content,
            projectId: opts.projectId ?? null,
          });
          ok++;
          totalChunks += result.chunksCount;
          console.log(`  ok    ${f.source}  chunks=${result.chunksCount}  id=${result.documentId.slice(0, 8)}…`);
        } catch (err) {
          fail++;
          const cause =
            err && typeof err === 'object' && 'cause' in err
              ? ` | cause: ${String((err as { cause?: unknown }).cause)}`
              : '';
          console.error(
            `  FAIL  ${f.source}: ${err instanceof Error ? err.message : String(err)}${cause}`,
          );
        }
      }
    } finally {
      await closeDatabase();
    }
  }

  console.log(`\nDone. ingested=${ok} failed=${fail} chunks≈${totalChunks}`);
  if (fail > 0) {
    console.log(`
Tip: if you see password authentication failed for user "aeds", fix DATABASE_URL in .env
to match docker-compose (default: postgresql://aeds:aeds_password@localhost:5432/aeds_dev),
then restart the API and re-run: npm run knowledge:ingest -- --replace
`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
