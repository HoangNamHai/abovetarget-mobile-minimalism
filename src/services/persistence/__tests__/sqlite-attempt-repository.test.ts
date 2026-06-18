import type { LessonAttempt } from '../../../types/progress';
import { openDatabase } from '../database';
import { SqliteAttemptRepository } from '../sqlite-attempt-repository';

function attempt(id: string, completedAt: string): LessonAttempt {
  return {
    id, lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5,
    score: 80, completedAt, domain: 'process',
  };
}

test('record + listAll round-trips through the (mocked) sqlite executor newest-first', async () => {
  const db = await openDatabase();
  const repo = new SqliteAttemptRepository(db);
  await repo.record(attempt('old', '2026-06-17T10:00:00.000Z'));
  await repo.record(attempt('new', '2026-06-19T10:00:00.000Z'));
  expect((await repo.listAll()).map((a) => a.id)).toEqual(['new', 'old']);
});

test('listRecent caps and count/clear work', async () => {
  const db = await openDatabase();
  const repo = new SqliteAttemptRepository(db);
  await repo.record(attempt('a', '2026-06-18T10:00:00.000Z'));
  await repo.record(attempt('b', '2026-06-19T10:00:00.000Z'));
  expect(await repo.listRecent(1)).toHaveLength(1);
  expect(await repo.count()).toBe(2);
  await repo.clear();
  expect(await repo.count()).toBe(0);
});

test('record normalizes completedAt to UTC before storing', async () => {
  const db = await openDatabase();
  const repo = new SqliteAttemptRepository(db);
  await repo.record(attempt('x', '2026-06-18T23:30:00.000-04:00'));
  const all = await repo.listAll();
  expect(all[0].completedAt).toBe('2026-06-19T03:30:00.000Z');
});
