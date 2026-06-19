import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type ReminderTime = 'morning' | 'afternoon' | 'evening' | 'disabled';

export const TIME_MAPPING: Record<Exclude<ReminderTime, 'disabled'>, { hour: number; minute: number }> = {
  morning: { hour: 9, minute: 0 },
  afternoon: { hour: 12, minute: 0 },
  evening: { hour: 20, minute: 0 },
};

export interface NotificationService {
  isAvailable(): boolean;
  requestPermission(): Promise<boolean>;
  scheduleDailyReminder(time: ReminderTime): Promise<boolean>;
  cancelAll(): Promise<void>;
}

type NotificationsModule = typeof import('expo-notifications');

export function createNativeNotificationService(): NotificationService {
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  let N: NotificationsModule | null = null;
  if (!isExpoGo) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      N = require('expo-notifications') as NotificationsModule;
    } catch {
      N = null;
    }
  }

  const available = (): boolean => !isExpoGo && N !== null;

  return {
    isAvailable: available,
    async requestPermission() {
      if (!available() || !N) return false;
      const current = await N.getPermissionsAsync();
      if (current.status === 'granted') return true;
      const req = await N.requestPermissionsAsync();
      return req.status === 'granted';
    },
    async scheduleDailyReminder(time) {
      if (!available() || !N) return false;
      await N.cancelAllScheduledNotificationsAsync();
      if (time === 'disabled') return false;
      const granted = await this.requestPermission();
      if (!granted) return false;
      if (Platform.OS === 'android') {
        await N.setNotificationChannelAsync('daily-reminders', {
          name: 'Daily Reminders',
          importance: N.AndroidImportance.HIGH,
        });
      }
      const cfg = TIME_MAPPING[time];
      await N.scheduleNotificationAsync({
        content: { title: 'Time to study', body: 'Keep your PMP streak alive.', sound: true },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DAILY,
          hour: cfg.hour,
          minute: cfg.minute,
        },
      });
      return true;
    },
    async cancelAll() {
      if (!available() || !N) return;
      await N.cancelAllScheduledNotificationsAsync();
    },
  };
}

export function createFakeNotificationService(opts?: { available?: boolean; permission?: boolean }) {
  const available = opts?.available ?? true;
  const permission = opts?.permission ?? true;
  const scheduled: ReminderTime[] = [];
  return {
    scheduled,
    isAvailable: () => available,
    async requestPermission() {
      return available && permission;
    },
    async scheduleDailyReminder(time: ReminderTime) {
      if (!available) return false;
      scheduled.length = 0;
      if (time === 'disabled') return false;
      if (!permission) return false;
      scheduled.push(time);
      return true;
    },
    async cancelAll() {
      scheduled.length = 0;
    },
  };
}
