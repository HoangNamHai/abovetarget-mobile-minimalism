import type { LessonAttempt } from '../../../types/progress';
import { InMemoryAttemptRepository } from '../in-memory-attempt-repository';

function attempt(id: string, completedAt: string): LessonAttempt {
  return {
    id,
    lessonId: 'A1L1',
    lessonTitle: 'Intro',
    questionCount: 5,
    score: 80,
    completedAt,
    domain: 'process',
  };
}

test('record then listAll returns newest-first', async () => {
  const repo = new InMemoryAttemptRepository();
  await repo.record(attempt('old', '2026-06-17T10:00:00.000Z'));
  await repo.record(attempt('new', '2026-06-19T10:00:00.000Z'));
  const all = await repo.listAll();
  expect(all.map((a) => a.id)).toEqual(['new', 'old']);
});

test('listRecent caps the result', async () => {
  const repo = new InMemoryAttemptRepository();
  for (let i = 0; i < 5; i++) {
    await repo.record(attempt(`a${i}`, `2026-06-1${i}T10:00:00.000Z`));
  }
  expect(await repo.listRecent(2)).toHaveLength(2);
});

test('count and clear', async () => {
  const repo = new InMemoryAttemptRepository();
  await repo.record(attempt('a', '2026-06-19T10:00:00.000Z'));
  expect(await repo.count()).toBe(1);
  await repo.clear();
  expect(await repo.count()).toBe(0);
});
