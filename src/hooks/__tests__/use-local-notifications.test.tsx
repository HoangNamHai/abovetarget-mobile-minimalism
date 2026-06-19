import { renderHook, act } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { PersistenceProvider } from '../../contexts/persistence-context';
import { createInMemoryPersistence } from '../../services/persistence';
import { useLocalNotifications } from '../use-local-notifications';
import { createFakeNotificationService } from '../../services/infra/notifications';

function wrapper(persistence: ReturnType<typeof createInMemoryPersistence>) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>{children}</PersistenceProvider>
  );
}

test('setReminderTime persists the choice and schedules via the service', async () => {
  const persistence = createInMemoryPersistence();
  const svc = createFakeNotificationService({ available: true, permission: true });
  const { result } = await renderHook(() => useLocalNotifications(svc), {
    wrapper: wrapper(persistence),
  });

  await act(async () => {
    await result.current.setReminderTime('evening');
  });

  expect(result.current.reminderTime).toBe('evening');
  expect(svc.scheduled).toEqual(['evening']);
  expect(await persistence.kv.getJSON('@app/reminder-time')).toBe('evening');
});
