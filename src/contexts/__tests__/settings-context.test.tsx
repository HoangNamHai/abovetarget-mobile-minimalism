import React, { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider } from '../persistence-context';
import { SettingsProvider, useSettings } from '../settings-context';

function wrapper(persistence = createInMemoryPersistence()) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>
      <SettingsProvider>{children}</SettingsProvider>
    </PersistenceProvider>
  );
}

test('defaults to system theme with everything enabled', async () => {
  const { result } = await renderHook(() => useSettings(), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.settings).toEqual({
    theme: 'system',
    notifications: true,
    haptics: true,
    sounds: true,
  });
});

test('setHaptics persists and updates state', async () => {
  const persistence = createInMemoryPersistence();
  const { result } = await renderHook(() => useSettings(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => {
    await result.current.setHaptics(false);
  });
  expect(result.current.settings.haptics).toBe(false);
  expect(await persistence.kv.getJSON('@app/haptics')).toBe(false);
});

test('loads persisted theme on mount', async () => {
  const persistence = createInMemoryPersistence();
  await persistence.kv.setString('@app/theme', 'dark');
  const { result } = await renderHook(() => useSettings(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.settings.theme).toBe('dark');
});
