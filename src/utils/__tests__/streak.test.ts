import { calculateStreakWithFreeze, refreshFreezeIfNewWeek, type StreakFreeze } from '../streak';

const freeze: StreakFreeze = { available: 1, weekStart: '2026-06-15', usedDates: [] };

test('same-day activity leaves the streak unchanged', () => {
  const r = calculateStreakWithFreeze('2026-06-19', 5, freeze, new Date('2026-06-19T12:00:00Z'));
  expect(r.streak).toBe(5);
  expect(r.freezeUsed).toBe(false);
});

test('yesterday activity increments the streak', () => {
  const r = calculateStreakWithFreeze('2026-06-18', 5, freeze, new Date('2026-06-19T12:00:00Z'));
  expect(r.streak).toBe(6);
});

test('a one-day gap consumes a freeze to preserve the streak', () => {
  const r = calculateStreakWithFreeze('2026-06-17', 5, freeze, new Date('2026-06-19T12:00:00Z'));
  expect(r.streak).toBe(6);
  expect(r.freezeUsed).toBe(true);
  expect(r.freeze.available).toBe(0);
});

test('a multi-day gap resets the streak to 1', () => {
  const r = calculateStreakWithFreeze('2026-06-10', 5, freeze, new Date('2026-06-19T12:00:00Z'));
  expect(r.streak).toBe(1);
});

test('freeze refreshes at the start of a new week', () => {
  const used: StreakFreeze = { available: 0, weekStart: '2026-06-08', usedDates: ['2026-06-09'] };
  const refreshed = refreshFreezeIfNewWeek(used, new Date('2026-06-19T12:00:00Z'));
  expect(refreshed.available).toBe(1);
});
