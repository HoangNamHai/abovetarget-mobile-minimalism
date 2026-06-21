import {
  to24h, from24h, indexFromOffset, HOURS12, MINUTES, PERIODS,
} from '../time-wheel';
import {
  WEEKDAYS, DEFAULT_SCHEDULE, isScheduleActive, formatTime, type WeeklySchedule,
} from '../weekly-reminder';

describe('time-wheel', () => {
  test('to24h converts 12-hour + period to 24-hour', () => {
    expect(to24h(12, 'AM')).toBe(0);
    expect(to24h(12, 'PM')).toBe(12);
    expect(to24h(1, 'AM')).toBe(1);
    expect(to24h(8, 'PM')).toBe(20);
  });

  test('from24h is the inverse of to24h', () => {
    for (let h = 0; h < 24; h++) {
      const { hour12, period } = from24h(h);
      expect(to24h(hour12, period)).toBe(h);
    }
  });

  test('wheel option lists are well-formed', () => {
    expect(HOURS12).toHaveLength(12);
    expect(HOURS12[0]).toBe(12);
    expect(MINUTES[0]).toBe(0);
    expect(PERIODS).toEqual(['AM', 'PM']);
  });

  test('indexFromOffset snaps offset to the nearest item index, clamped', () => {
    expect(indexFromOffset(0, 44, 12)).toBe(0);
    expect(indexFromOffset(70, 44, 12)).toBe(2); // 70/44 = 1.59 -> 2
    expect(indexFromOffset(99999, 44, 12)).toBe(11); // clamped to last
  });
});

describe('weekly-reminder', () => {
  test('there are 7 weekdays, value 1=Sunday..7=Saturday', () => {
    expect(WEEKDAYS).toHaveLength(7);
    expect(WEEKDAYS[0].value).toBe(1);
    expect(WEEKDAYS[6].value).toBe(7);
  });

  test('default schedule is Mon–Fri at 8:00 PM', () => {
    expect(DEFAULT_SCHEDULE.weekdays).toEqual([2, 3, 4, 5, 6]);
    expect(DEFAULT_SCHEDULE.hour).toBe(20);
    expect(DEFAULT_SCHEDULE.minute).toBe(0);
  });

  test('isScheduleActive is false when no days selected', () => {
    expect(isScheduleActive({ weekdays: [], hour: 9, minute: 0 })).toBe(false);
    expect(isScheduleActive(DEFAULT_SCHEDULE)).toBe(true);
  });

  test('formatTime renders 12-hour clock', () => {
    expect(formatTime(20, 0)).toBe('8:00 PM');
    expect(formatTime(9, 5)).toBe('9:05 AM');
    expect(formatTime(0, 30)).toBe('12:30 AM');
  });
});
