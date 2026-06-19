import { progressReducer, DEFAULT_PROGRESS, type ProgressState, type UserProgress } from '../progress-reducer';
import type { LessonAttempt } from '../../../types/progress';

function loaded(progress: UserProgress = DEFAULT_PROGRESS): ProgressState {
  return { progress, isLoading: false, error: null };
}
const attempt: LessonAttempt = {
  id: 'a1', lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5,
  score: 80, completedAt: '2026-06-19T10:00:00.000Z', domain: 'process',
};

test('RECORD_ATTEMPT increments totals and domain progress', () => {
  const s = progressReducer(loaded(), { type: 'RECORD_ATTEMPT', payload: attempt });
  expect(s.progress.totalLessonsCompleted).toBe(1);
  expect(s.progress.domainProgress.process.completed).toBe(1);
  expect(s.progress.averageScore).toBe(80);
  expect(s.progress.recentAttempts[0].id).toBe('a1');
});

test('RECORD_ATTEMPT starts the streak at 1 from a clean slate', () => {
  const s = progressReducer(loaded(), { type: 'RECORD_ATTEMPT', payload: attempt });
  expect(s.progress.dailyStreak).toBeGreaterThanOrEqual(1);
  expect(s.progress.bestStreak).toBeGreaterThanOrEqual(1);
});

test('RESET_PROGRESS returns to defaults', () => {
  const dirty = progressReducer(loaded(), { type: 'RECORD_ATTEMPT', payload: attempt });
  const s = progressReducer(dirty, { type: 'RESET_PROGRESS' });
  expect(s.progress).toEqual(DEFAULT_PROGRESS);
});
