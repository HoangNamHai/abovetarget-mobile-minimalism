import { renderHook, act } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { PersistenceProvider } from '../../contexts/persistence-context';
import { createInMemoryPersistence } from '../../services/persistence';
import { useWeeklyReminder } from '../use-weekly-reminder';
import { createFakeNotificationService } from '../../services/infra/notifications';

function wrapper(persistence: ReturnType<typeof createInMemoryPersistence>) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>{children}</PersistenceProvider>
  );
}

test('setSchedule schedules weekly notifications and persists the schedule', async () => {
  const persistence = createInMemoryPersistence();
  const svc = createFakeNotificationService({ available: true, permission: true });
  const { result } = await renderHook(() => useWeeklyReminder(svc), {
    wrapper: wrapper(persistence),
  });

  await act(async () => {
    await result.current.setSchedule({ weekdays: [2, 4, 6], hour: 20, minute: 30 });
  });

  expect(result.current.schedule).toEqual({ weekdays: [2, 4, 6], hour: 20, minute: 30 });
  expect(svc.weekly).toEqual({ weekdays: [2, 4, 6], hour: 20, minute: 30 });
  expect(await persistence.kv.getJSON('@app/reminder-schedule')).toEqual({ weekdays: [2, 4, 6], hour: 20, minute: 30 });
});

test('a stored schedule hydrates on mount', async () => {
  const persistence = createInMemoryPersistence();
  await persistence.kv.setJSON('@app/reminder-schedule', { weekdays: [1], hour: 7, minute: 0 });
  const svc = createFakeNotificationService({ available: true, permission: true });
  const { result } = await renderHook(() => useWeeklyReminder(svc), {
    wrapper: wrapper(persistence),
  });
  // hydration is async; allow the effect to settle
  await act(async () => {});
  expect(result.current.schedule.weekdays).toEqual([1]);
});
