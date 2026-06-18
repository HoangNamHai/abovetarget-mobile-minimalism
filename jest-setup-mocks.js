jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => {
  const mem = new Map();
  return {
    getItemAsync: jest.fn(async (k) => (mem.has(k) ? mem.get(k) : null)),
    setItemAsync: jest.fn(async (k, v) => { mem.set(k, v); }),
    deleteItemAsync: jest.fn(async (k) => { mem.delete(k); }),
  };
});

jest.mock('expo-sqlite', () => {
  // Minimal in-memory executor: tracks applied DDL + a single attempts table.
  function makeDb() {
    const tables = new Set();
    const rows = [];
    const meta = new Map();
    return {
      execAsync: jest.fn(async (sql) => {
        if (/create table.*schema_version/i.test(sql)) tables.add('schema_version');
        if (/create table.*attempts/i.test(sql)) tables.add('attempts');
      }),
      runAsync: jest.fn(async (sql, params = []) => {
        if (/insert into schema_version/i.test(sql)) meta.set('version', params[0]);
        else if (/insert or replace into attempts/i.test(sql)) {
          const [id, lessonId, lessonTitle, questionCount, score, completedAt, domain] = params;
          const i = rows.findIndex((r) => r.id === id);
          const row = { id, lessonId, lessonTitle, questionCount, score, completedAt, domain };
          if (i >= 0) rows[i] = row; else rows.push(row);
        } else if (/delete from attempts/i.test(sql)) rows.length = 0;
      }),
      getAllAsync: jest.fn(async (sql, params = []) => {
        if (/from attempts/i.test(sql)) {
          const sorted = [...rows].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
          const m = sql.match(/limit\s+\?/i);
          if (m && params.length > 0) {
            return sorted.slice(0, params[0]);
          }
          const literalMatch = sql.match(/limit\s+(\d+)/i);
          return literalMatch ? sorted.slice(0, Number(literalMatch[1])) : sorted;
        }
        return [];
      }),
      getFirstAsync: jest.fn(async (sql) => {
        if (/count\(\*\).*attempts/i.test(sql)) return { c: rows.length };
        if (/from schema_version/i.test(sql)) {
          return meta.has('version') ? { version: meta.get('version') } : null;
        }
        return null;
      }),
    };
  }
  return { openDatabaseAsync: jest.fn(async () => makeDb()) };
});
