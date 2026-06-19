import React, { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider } from '../../contexts/persistence-context';
import { useLessonLimit } from '../use-lesson-limit';

// Force a non-premium subscription so the limit logic is exercised.
jest.mock('../../contexts/subscription-context', () => ({
  useSubscription: () => ({ isPremium: false }),
}));

function wrapper(persistence = createInMemoryPersistence()) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>{children}</PersistenceProvider>
  );
}

test('starts with the full free quota for a non-premium user', async () => {
  const { result } = await renderHook(() => useLessonLimit(), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.lessonsCompletedToday).toBe(0);
  expect(result.current.remainingLessons).toBe(3);
  expect(result.current.limitReached).toBe(false);
});

test('consumeLesson increments and persists; limit reached at 3', async () => {
  const persistence = createInMemoryPersistence();
  const { result } = await renderHook(() => useLessonLimit(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => { await result.current.consumeLesson(); });
  await act(async () => { await result.current.consumeLesson(); });
  await act(async () => { await result.current.consumeLesson(); });
  expect(result.current.lessonsCompletedToday).toBe(3);
  expect(result.current.limitReached).toBe(true);
  expect(result.current.canAccessLesson).toBe(false);
  expect(await persistence.kv.getJSON('subscription:lessonLimit')).toMatchObject({ count: 3 });
});
