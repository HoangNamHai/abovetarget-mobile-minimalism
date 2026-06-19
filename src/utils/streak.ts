import { getLocalDateString, getWeekStartMonday } from './date';

export interface StreakFreeze {
  available: number;
  weekStart: string;
  usedDates: string[];
}

export type StreakResult = {
  streak: number;
  freeze: StreakFreeze;
  freezeUsed: boolean;
};

/**
 * Resets freeze availability if a new week (Monday) has started.
 * Pure function: pass `today` to avoid dependency on Date.now().
 */
export function refreshFreezeIfNewWeek(freeze: StreakFreeze, today?: Date): StreakFreeze {
  const currentWeekStart = getWeekStartMonday(today);
  if (freeze.weekStart !== currentWeekStart) {
    return {
      available: 1,
      weekStart: currentWeekStart,
      usedDates: freeze.usedDates,
    };
  }
  return freeze;
}

/**
 * Calculates the streak with freeze support.
 * Pass `today` to make the function deterministic for testing.
 */
export function calculateStreakWithFreeze(
  lastActiveDate: string,
  currentStreak: number,
  freeze: StreakFreeze,
  today?: Date
): StreakResult {
  const todayDate = today || new Date();
  const todayStr = getLocalDateString(todayDate);
  const refreshedFreeze = refreshFreezeIfNewWeek(freeze, todayDate);

  if (lastActiveDate === todayStr) {
    return { streak: currentStreak, freeze: refreshedFreeze, freezeUsed: false };
  }

  const yesterday = new Date(todayDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  if (lastActiveDate === yesterdayStr) {
    return { streak: currentStreak + 1, freeze: refreshedFreeze, freezeUsed: false };
  }

  // Check if this is exactly a 1-day gap (last active was 2 days ago)
  const twoDaysAgo = new Date(todayDate);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = getLocalDateString(twoDaysAgo);
  const isOneDayGap = lastActiveDate === twoDaysAgoStr;

  // Gap detected — try to use freeze (only for exactly 1-day gaps)
  if (isOneDayGap && refreshedFreeze.available > 0 && currentStreak > 0) {
    return {
      streak: currentStreak + 1,
      freeze: {
        ...refreshedFreeze,
        available: refreshedFreeze.available - 1,
        usedDates: [...refreshedFreeze.usedDates, yesterdayStr],
      },
      freezeUsed: true,
    };
  }

  // No freeze available or gap too large — streak resets
  return { streak: 1, freeze: refreshedFreeze, freezeUsed: false };
}
