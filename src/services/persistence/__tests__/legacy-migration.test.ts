import type { LessonAttempt } from '../../../types/progress';
import { InMemoryKeyValueStore } from '../in-memory-key-value-store';
import { InMemoryAttemptRepository } from '../in-memory-attempt-repository';
import { transformLegacyProgress, runLegacyMigration } from '../legacy-migration';

const attempt: LessonAttempt = {
  id: 'x', lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5,
  score: 80, completedAt: '2026-06-19T10:00:00.000Z', domain: 'process',
};

test('transformLegacyProgress extracts attempts and carry-over', () => {
  const result = transformLegacyProgress({
    recentAttempts: [attempt],
    streakFreeze: { available: 1, weekStart: '2026-06-15', usedDates: [] },
    bestStreak: 7,
  });
  expect(result.attempts).toEqual([attempt]);
  expect(result.carryOver.bestStreak).toBe(7);
  expect(result.carryOver.streakFreeze).toEqual({ available: 1, weekStart: '2026-06-15', usedDates: [] });
});

test('transformLegacyProgress tolerates missing fields', () => {
  const result = transformLegacyProgress({});
  expect(result.attempts).toEqual([]);
  expect(result.carryOver.bestStreak).toBe(0);
});

test('runLegacyMigration seeds attempts and marks done', async () => {
  const kv = new InMemoryKeyValueStore();
  const attempts = new InMemoryAttemptRepository();
  await kv.setJSON('@pmp/user-progress', { recentAttempts: [attempt], bestStreak: 3 });

  const ran = await runLegacyMigration({ kv, attempts });

  expect(ran).toBe(true);
  expect(await attempts.count()).toBe(1);
  expect(await kv.getString('@pmp/v2/migrated')).toBe('true');
});

test('runLegacyMigration skips when no legacy data', async () => {
  const kv = new InMemoryKeyValueStore();
  const attempts = new InMemoryAttemptRepository();
  expect(await runLegacyMigration({ kv, attempts })).toBe(false);
});

test('runLegacyMigration skips when already migrated', async () => {
  const kv = new InMemoryKeyValueStore();
  const attempts = new InMemoryAttemptRepository();
  await kv.setJSON('@pmp/user-progress', { recentAttempts: [attempt] });
  await kv.setString('@pmp/v2/migrated', 'true');
  expect(await runLegacyMigration({ kv, attempts })).toBe(false);
  expect(await attempts.count()).toBe(0);
});
