import { from24h } from './time-wheel';

// Weekday numbering matches expo-notifications WEEKLY triggers: 1 = Sunday … 7 = Saturday.
export interface WeeklySchedule {
  weekdays: number[];
  hour: number; // 0–23
  minute: number; // 0–59
}

export const WEEKDAYS: { value: number; short: string; label: string }[] = [
  { value: 1, short: 'S', label: 'Sunday' },
  { value: 2, short: 'M', label: 'Monday' },
  { value: 3, short: 'T', label: 'Tuesday' },
  { value: 4, short: 'W', label: 'Wednesday' },
  { value: 5, short: 'T', label: 'Thursday' },
  { value: 6, short: 'F', label: 'Friday' },
  { value: 7, short: 'S', label: 'Saturday' },
];

// Default: weekdays (Mon–Fri) at 8:00 PM.
export const DEFAULT_SCHEDULE: WeeklySchedule = { weekdays: [2, 3, 4, 5, 6], hour: 20, minute: 0 };

export function isScheduleActive(s: WeeklySchedule): boolean {
  return s.weekdays.length > 0;
}

export function formatTime(hour: number, minute: number): string {
  const { hour12, period } = from24h(hour);
  return `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
}
