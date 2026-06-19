import React, { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider } from '../persistence-context';
import { OnboardingProvider, useOnboarding } from '../onboarding-context';

jest.mock('expo-linking', () => ({
  parse: () => ({ queryParams: {} }),
  getInitialURL: async () => null,
  addEventListener: () => ({ remove: () => {} }),
}));

function wrapper(persistence = createInMemoryPersistence()) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>
      <OnboardingProvider>{children}</OnboardingProvider>
    </PersistenceProvider>
  );
}

test('starts not-onboarded after load', async () => {
  const { result } = await renderHook(() => useOnboarding(), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.hasCompletedOnboarding).toBe(false);
});

test('completeOnboarding persists flag and preferences', async () => {
  const persistence = createInMemoryPersistence();
  const { result } = await renderHook(() => useOnboarding(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => {
    result.current.setDailyGoal(3);
  });
  await act(async () => {
    await result.current.completeOnboarding();
  });
  // Check that the kv was updated
  const flag = await persistence.kv.getString('hasCompletedOnboarding');
  const prefs = await persistence.kv.getJSON<{ dailyGoal: number }>('userPreferences');
  expect(flag).toBe('true');
  expect(prefs?.dailyGoal).toBe(3);
});

test('loads completed state from persistence', async () => {
  const persistence = createInMemoryPersistence();
  await persistence.kv.setString('hasCompletedOnboarding', 'true');
  await persistence.kv.setJSON('userPreferences', {
    goals: ['pass-pmp'], dailyGoal: 2, onboardingCompletedAt: 1,
  });
  const { result } = await renderHook(() => useOnboarding(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.hasCompletedOnboarding).toBe(true);
  expect(result.current.dailyGoal).toBe(2);
});
