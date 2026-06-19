import { useState, useEffect, useCallback } from 'react';
import {
  FREE_DAILY_LESSON_LIMIT,
  SUBSCRIPTION_STORAGE_KEYS,
} from '../config/revenuecat';
import { useSubscription } from '../contexts/subscription-context';
import { usePersistence } from '../contexts/persistence-context';
import type { KeyValueStore } from '../services/persistence';

// ============================================
// Types
// ============================================

interface LimitData {
  count: number;  // Lessons completed today
  date: string;   // YYYY-MM-DD format
}

interface UseLessonLimitReturn {
  /** Number of lessons completed today */
  lessonsCompletedToday: number;
  /** Number of lessons remaining for today (for free users) */
  remainingLessons: number;
  /** Whether the user can access another lesson */
  canAccessLesson: boolean;
  /** Whether the daily limit has been reached (for free users) */
  limitReached: boolean;
  /** Mark a lesson as completed (increments today's count) */
  consumeLesson: () => Promise<void>;
  /** Reset the daily limit (for testing/admin) */
  resetDailyLimit: () => Promise<void>;
  /** Simulate reaching the daily limit (for testing/admin) */
  simulateLimitReached: () => Promise<void>;
  /** Loading state */
  isLoading: boolean;
  /** Time until midnight reset (in milliseconds) */
  timeUntilReset: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get today's date in YYYY-MM-DD format (local time)
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get milliseconds until midnight local time
 */
function getTimeUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0, 0, 0, 0
  );
  return midnight.getTime() - now.getTime();
}

/**
 * Load limit data from kv store
 */
async function loadLimitData(kv: KeyValueStore): Promise<LimitData> {
  try {
    const data = await kv.getJSON<LimitData>(SUBSCRIPTION_STORAGE_KEYS.LESSON_LIMIT);
    if (data) {
      // Check if the stored date is today
      if (data.date === getTodayDateString()) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Failed to load lesson limit data:', error);
  }

  // Return default (reset for new day)
  return {
    count: 0,
    date: getTodayDateString(),
  };
}

/**
 * Save limit data to kv store
 */
async function saveLimitData(kv: KeyValueStore, data: LimitData): Promise<void> {
  try {
    await kv.setJSON(SUBSCRIPTION_STORAGE_KEYS.LESSON_LIMIT, data);
  } catch (error) {
    console.warn('Failed to save lesson limit data:', error);
  }
}

// ============================================
// Hook
// ============================================

export function useLessonLimit(): UseLessonLimitReturn {
  const { isPremium } = useSubscription();
  const { kv } = usePersistence();
  const [limitData, setLimitData] = useState<LimitData>({
    count: 0,
    date: getTodayDateString(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilMidnight());

  // Load limit data on mount
  useEffect(() => {
    const load = async () => {
      const data = await loadLimitData(kv);
      setLimitData(data);
      setIsLoading(false);
    };
    load();
  }, [kv]);

  // Update timer every minute
  useEffect(() => {
    const updateTimer = () => {
      const newTime = getTimeUntilMidnight();
      setTimeUntilReset(newTime);

      // Check if we crossed midnight (reset limit)
      const today = getTodayDateString();
      if (limitData.date !== today) {
        setLimitData({ count: 0, date: today });
      }
    };

    // Update immediately
    updateTimer();

    // Update every minute
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [limitData.date]);

  // Computed values
  const lessonsCompletedToday = limitData.count;
  const remainingLessons = Math.max(0, FREE_DAILY_LESSON_LIMIT - lessonsCompletedToday);
  const limitReached = !isPremium && lessonsCompletedToday >= FREE_DAILY_LESSON_LIMIT;
  const canAccessLesson = isPremium || !limitReached;

  // Consume a lesson (increment count)
  const consumeLesson = useCallback(async () => {
    // Premium users don't consume from the limit
    if (isPremium) {
      return;
    }

    const today = getTodayDateString();

    // Use functional update to avoid depending on limitData
    setLimitData(prev => {
      const newData: LimitData = {
        count: prev.date === today ? prev.count + 1 : 1,
        date: today,
      };
      // Save to storage (fire and forget)
      saveLimitData(kv, newData);
      return newData;
    });
  }, [isPremium, kv]);

  // Reset daily limit (for testing/admin)
  const resetDailyLimit = useCallback(async () => {
    const newData: LimitData = {
      count: 0,
      date: getTodayDateString(),
    };
    setLimitData(newData);
    await saveLimitData(kv, newData);
  }, [kv]);

  // Simulate reaching the daily limit (for testing/admin)
  const simulateLimitReached = useCallback(async () => {
    const newData: LimitData = {
      count: FREE_DAILY_LESSON_LIMIT,
      date: getTodayDateString(),
    };
    setLimitData(newData);
    await saveLimitData(kv, newData);
  }, [kv]);

  return {
    lessonsCompletedToday,
    remainingLessons,
    canAccessLesson,
    limitReached,
    consumeLesson,
    resetDailyLimit,
    simulateLimitReached,
    isLoading,
    timeUntilReset,
  };
}
