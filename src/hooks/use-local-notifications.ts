import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePersistence } from '../contexts/persistence-context';
import {
  createNativeNotificationService,
  type NotificationService,
  type ReminderTime,
} from '../services/infra/notifications';

const REMINDER_KEY = '@app/reminder-time';

export function useLocalNotifications(service?: NotificationService) {
  const persistence = usePersistence();
  const svc = useMemo(() => service ?? createNativeNotificationService(), [service]);
  const [reminderTime, setReminderTimeState] = useState<ReminderTime>('disabled');

  useEffect(() => {
    let active = true;
    persistence.kv.getJSON<ReminderTime>(REMINDER_KEY).then((stored) => {
      if (active && stored) setReminderTimeState(stored);
    });
    return () => {
      active = false;
    };
  }, [persistence]);

  const setReminderTime = useCallback(
    async (time: ReminderTime): Promise<boolean> => {
      const ok = await svc.scheduleDailyReminder(time);
      setReminderTimeState(time);
      await persistence.kv.setJSON(REMINDER_KEY, time);
      return ok;
    },
    [svc, persistence],
  );

  return { isAvailable: svc.isAvailable(), reminderTime, setReminderTime };
}
