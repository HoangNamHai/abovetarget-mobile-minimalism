import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './migrations';

export interface SqlExecutor {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<void>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
}

export { MIGRATIONS };

const LATEST = MIGRATIONS[MIGRATIONS.length - 1].version;

export async function runMigrations(db: SqlExecutor): Promise<void> {
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);',
  );
  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1;',
  );
  const current = row?.version ?? 0;
  if (current >= LATEST) return;
  for (const migration of MIGRATIONS) {
    if (migration.version > current) {
      await db.execAsync(migration.sql);
    }
  }
  await db.runAsync('DELETE FROM schema_version;', []);
  await db.runAsync('INSERT INTO schema_version (version) VALUES (?);', [LATEST]);
}

export async function openDatabase(): Promise<SqlExecutor> {
  const db = await SQLite.openDatabaseAsync('pmp.db');
  await runMigrations(db as unknown as SqlExecutor);
  return db as unknown as SqlExecutor;
}
