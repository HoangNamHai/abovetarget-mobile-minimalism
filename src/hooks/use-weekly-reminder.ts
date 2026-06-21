import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePersistence } from '../contexts/persistence-context';
import {
  createNativeNotificationService,
  type NotificationService,
} from '../services/infra/notifications';
import { DEFAULT_SCHEDULE, type WeeklySchedule } from '../lib/onboarding/weekly-reminder';

const SCHEDULE_KEY = '@app/reminder-schedule';

export function useWeeklyReminder(service?: NotificationService) {
  const persistence = usePersistence();
  const svc = useMemo(() => service ?? createNativeNotificationService(), [service]);
  const [schedule, setScheduleState] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);

  useEffect(() => {
    let active = true;
    persistence.kv.getJSON<WeeklySchedule>(SCHEDULE_KEY).then((stored) => {
      if (active && stored) setScheduleState(stored);
    });
    return () => {
      active = false;
    };
  }, [persistence]);

  const setSchedule = useCallback(
    async (next: WeeklySchedule): Promise<boolean> => {
      const ok = await svc.scheduleWeeklyReminders({
        weekdays: next.weekdays,
        hour: next.hour,
        minute: next.minute,
      });
      setScheduleState(next);
      await persistence.kv.setJSON(SCHEDULE_KEY, next);
      return ok;
    },
    [svc, persistence],
  );

  return { isAvailable: svc.isAvailable(), schedule, setSchedule };
}
