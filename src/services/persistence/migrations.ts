export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY NOT NULL,
      lessonId TEXT NOT NULL,
      lessonTitle TEXT NOT NULL,
      questionCount INTEGER NOT NULL,
      score INTEGER NOT NULL,
      completedAt TEXT NOT NULL,
      domain TEXT NOT NULL
    );`,
  },
];
