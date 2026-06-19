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
