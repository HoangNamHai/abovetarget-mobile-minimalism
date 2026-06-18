import type { LessonAttempt } from '../../../types/progress';
import {
  deriveActiveDays,
  deriveDomainCompletion,
  deriveOverall,
} from '../attempt-derivations';

function attempt(partial: Partial<LessonAttempt>): LessonAttempt {
  return {
    id: 'a',
    lessonId: 'A1L1',
    lessonTitle: 'Intro',
    questionCount: 5,
    score: 80,
    completedAt: '2026-06-19T10:00:00.000Z',
    domain: 'process',
    ...partial,
  };
}

test('deriveActiveDays returns sorted unique local dates', () => {
  const days = deriveActiveDays([
    attempt({ completedAt: '2026-06-19T23:30:00.000-04:00' }),
    attempt({ completedAt: '2026-06-19T01:00:00.000-04:00' }),
    attempt({ completedAt: '2026-06-17T08:00:00.000-04:00' }),
  ]);
  expect(days).toEqual(['2026-06-17', '2026-06-19']);
});

test('deriveDomainCompletion counts and averages one domain', () => {
  const result = deriveDomainCompletion(
    [
      attempt({ domain: 'people', score: 90 }),
      attempt({ domain: 'people', score: 75 }),
      attempt({ domain: 'process', score: 10 }),
    ],
    'people',
  );
  expect(result.completed).toBe(2);
  expect(result.averageScore).toBe(82.5);
});

test('deriveDomainCompletion returns zeros for empty domain', () => {
  expect(deriveDomainCompletion([], 'business')).toEqual({ completed: 0, averageScore: 0 });
});

test('deriveOverall totals all attempts and rounds average', () => {
  const result = deriveOverall([
    attempt({ score: 100 }),
    attempt({ score: 95 }),
    attempt({ score: 90 }),
  ]);
  expect(result.totalLessonsCompleted).toBe(3);
  expect(result.averageScore).toBe(95);
});
