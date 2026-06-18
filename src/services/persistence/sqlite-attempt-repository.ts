import type { LessonAttempt } from '../../types/progress';
import type { AttemptRepository } from './attempt-repository';
import type { SqlExecutor } from './database';

const COLUMNS = 'id, lessonId, lessonTitle, questionCount, score, completedAt, domain';

export class SqliteAttemptRepository implements AttemptRepository {
  constructor(private readonly db: SqlExecutor) {}

  async record(a: LessonAttempt): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO attempts (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [a.id, a.lessonId, a.lessonTitle, a.questionCount, a.score, a.completedAt, a.domain],
    );
  }

  async listAll(): Promise<LessonAttempt[]> {
    return this.db.getAllAsync<LessonAttempt>(
      `SELECT ${COLUMNS} FROM attempts ORDER BY completedAt DESC;`,
    );
  }

  async listRecent(limit: number): Promise<LessonAttempt[]> {
    return this.db.getAllAsync<LessonAttempt>(
      `SELECT ${COLUMNS} FROM attempts ORDER BY completedAt DESC LIMIT ?;`,
      [limit],
    );
  }

  async count(): Promise<number> {
    const row = await this.db.getFirstAsync<{ c: number }>(
      'SELECT COUNT(*) as c FROM attempts;',
    );
    return row?.c ?? 0;
  }

  async clear(): Promise<void> {
    await this.db.runAsync('DELETE FROM attempts;', []);
  }
}
