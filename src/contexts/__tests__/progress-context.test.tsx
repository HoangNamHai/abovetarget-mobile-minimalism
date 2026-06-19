import React, { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider } from '../persistence-context';
import { ProgressProvider, useProgress } from '../progress-context';

function wrapper(persistence = createInMemoryPersistence()) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>
      <ProgressProvider>{children}</ProgressProvider>
    </PersistenceProvider>
  );
}

test('records an attempt to both the aggregate and the attempts log', async () => {
  const persistence = createInMemoryPersistence();
  const { result } = await renderHook(() => useProgress(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => {
    await result.current.recordLessonAttempt({
      lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5, score: 90, domain: 'process',
    });
  });
  expect(result.current.progress.totalLessonsCompleted).toBe(1);
  expect(await persistence.attempts.count()).toBe(1);
  const saved = await persistence.kv.getJSON<{ totalLessonsCompleted: number }>('@pmp/v2/user-progress');
  expect(saved?.totalLessonsCompleted).toBe(1);
});

test('hydrates progress from the attempts log and carry-over when no v2 aggregate exists', async () => {
  const persistence = createInMemoryPersistence();
  await persistence.attempts.record({
    id: 'm1', lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5,
    score: 100, completedAt: '2026-06-18T10:00:00.000Z', domain: 'people',
  });
  await persistence.kv.setJSON('@pmp/v2/carry-over', {
    streakFreeze: { available: 1, weekStart: '', usedDates: [] },
    bestStreak: 9,
    activeDays: ['2026-06-18'],
  });
  const { result } = await renderHook(() => useProgress(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.progress.totalLessonsCompleted).toBe(1);
  expect(result.current.progress.bestStreak).toBe(9);
  expect(result.current.progress.domainProgress.people.completed).toBe(1);
});

test('resetProgress clears aggregate and attempts log', async () => {
  const persistence = createInMemoryPersistence();
  const { result } = await renderHook(() => useProgress(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => {
    await result.current.recordLessonAttempt({
      lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5, score: 90, domain: 'process',
    });
  });
  await act(async () => {
    await result.current.resetProgress();
  });
  expect(result.current.progress.totalLessonsCompleted).toBe(0);
  expect(await persistence.attempts.count()).toBe(0);
});
