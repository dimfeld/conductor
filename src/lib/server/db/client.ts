import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

export function initDb(path?: string) {
  if (!path && !env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

  path = path || env.DATABASE_URL;

  client = new Database(path);
  client.pragma('journal_mode = WAL');
  client.pragma('foreign_keys = ON');
  client.pragma('synchronous = NORMAL');
  client.pragma('busy_timeout = 5000');
  client.pragma('case_sensitive_like = true');

  db = drizzle(client, { schema });

  migrate(db, { migrationsFolder: 'drizzle' });
}

export let client: Database.Database;
export type Db = BetterSQLite3Database<typeof schema>;
export let db: Db;
