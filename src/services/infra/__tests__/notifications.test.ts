import { createFakeNotificationService, TIME_MAPPING } from '../notifications';

test('TIME_MAPPING has the three presets', () => {
  expect(TIME_MAPPING.morning).toEqual({ hour: 9, minute: 0 });
  expect(TIME_MAPPING.afternoon).toEqual({ hour: 12, minute: 0 });
  expect(TIME_MAPPING.evening).toEqual({ hour: 20, minute: 0 });
});

test('fake service records scheduled reminders and clears on disabled', async () => {
  const svc = createFakeNotificationService({ available: true, permission: true });
  expect(await svc.scheduleDailyReminder('morning')).toBe(true);
  expect(svc.scheduled).toEqual(['morning']);
  expect(await svc.scheduleDailyReminder('disabled')).toBe(false);
  expect(svc.scheduled).toEqual([]);
});

test('fake service refuses to schedule when unavailable', async () => {
  const svc = createFakeNotificationService({ available: false });
  expect(svc.isAvailable()).toBe(false);
  expect(await svc.scheduleDailyReminder('evening')).toBe(false);
});

test('fake service records a weekly schedule and clears when no days are selected', async () => {
  const svc = createFakeNotificationService({ available: true, permission: true });
  expect(await svc.scheduleWeeklyReminders({ weekdays: [2, 4, 6], hour: 20, minute: 0 })).toBe(true);
  expect(svc.weekly).toEqual({ weekdays: [2, 4, 6], hour: 20, minute: 0 });
  expect(await svc.scheduleWeeklyReminders({ weekdays: [], hour: 20, minute: 0 })).toBe(false);
  expect(svc.weekly).toBeNull();
});

test('fake weekly scheduling fails without permission', async () => {
  const svc = createFakeNotificationService({ available: true, permission: false });
  expect(await svc.scheduleWeeklyReminders({ weekdays: [2], hour: 9, minute: 0 })).toBe(false);
});
