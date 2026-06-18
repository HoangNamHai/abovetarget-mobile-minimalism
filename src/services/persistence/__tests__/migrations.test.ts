import { MIGRATIONS, runMigrations, type SqlExecutor } from '../database';

function fakeExecutor(): SqlExecutor & { ddl: string[] } {
  const ddl: string[] = [];
  let version: number | null = null;
  const createdTables = new Set<string>();
  return {
    ddl,
    async execAsync(sql) {
      // Only track non-idempotent creates (i.e., actual table creation attempts)
      if (/create table.*schema_version/i.test(sql) && !createdTables.has('schema_version')) {
        ddl.push(sql);
        createdTables.add('schema_version');
      } else if (!/create table.*schema_version/i.test(sql)) {
        ddl.push(sql);
        if (/create table.*attempts/i.test(sql)) createdTables.add('attempts');
      }
    },
    async runAsync(sql, params) {
      if (/insert into schema_version/i.test(sql)) version = params[0] as number;
    },
    async getAllAsync() { return []; },
    async getFirstAsync(sql) {
      if (/from schema_version/i.test(sql)) return version === null ? null : ({ version } as any);
      return null;
    },
  };
}

test('MIGRATIONS v1 creates the attempts table', () => {
  expect(MIGRATIONS[0].version).toBe(1);
  expect(MIGRATIONS[0].sql).toMatch(/create table.*attempts/i);
});

test('runMigrations applies pending migrations from a clean db', async () => {
  const db = fakeExecutor();
  await runMigrations(db);
  expect(db.ddl.some((s) => /attempts/i.test(s))).toBe(true);
});

test('runMigrations is idempotent when already at latest version', async () => {
  const db = fakeExecutor();
  await runMigrations(db);
  const ddlCountAfterFirst = db.ddl.length;
  await runMigrations(db);
  expect(db.ddl.length).toBe(ddlCountAfterFirst);
});
