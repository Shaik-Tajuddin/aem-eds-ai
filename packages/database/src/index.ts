import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema/index.js';

// ============================================================
// Database client singleton
// ============================================================

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export function getDatabase() {
  if (!_db) {
    const connectionString = process.env['DATABASE_URL'];
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    _client = postgres(connectionString, {
      max: Number(process.env['DATABASE_POOL_SIZE'] ?? 10),
      idle_timeout: 20,
      connect_timeout: 10,
    });

    _db = drizzle(_client, { schema });
  }
  return _db;
}

export async function closeDatabase(): Promise<void> {
  if (_client) {
    await _client.end();
    _client = null;
    _db = null;
  }
}

export type Database = ReturnType<typeof getDatabase>;
export { schema };
export * from './schema/index.js';
export * from './types.js';
export * from 'drizzle-orm';

