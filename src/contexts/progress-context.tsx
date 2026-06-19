import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { usePersistence } from './persistence-context';
import { getLocalDateString } from '../utils/date';
import { refreshFreezeIfNewWeek } from '../utils/streak';
import {
  progressReducer,
  initialProgressState,
  DEFAULT_PROGRESS,
  getCurrentMilestone,
  generateAttemptId,
  type UserProgress,
  type ProgressState,
} from './reducers/progress-reducer';
import type { LessonAttempt } from '../types/progress';

export type { Domain, DomainProgress, UserProgress } from './reducers/progress-reducer';
export type { LessonAttempt } from '../types/progress';

const PROGRESS_KEY = '@pmp/v2/user-progress';

interface ProgressContextValue extends ProgressState {
  recordLessonAttempt: (attempt: Omit<LessonAttempt, 'id' | 'completedAt'>) => Promise<void>;
  resetProgress: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  getCurrentMilestone: () => { name: string; threshold: number; progress: number };
  getCurrentStreak: () => number;
  getStreakMessage: () => string;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { kv } = usePersistence();
  const [state, dispatch] = useReducer(progressReducer, initialProgressState);

  useEffect(() => {
    let mounted = true;
    (async () => {
      dispatch({ type: 'LOAD_START' });
      try {
        const stored = await kv.getJSON<UserProgress>(PROGRESS_KEY);
        if (!mounted) return;
        if (stored) {
          const refreshedFreeze = refreshFreezeIfNewWeek(
            stored.streakFreeze ?? DEFAULT_PROGRESS.streakFreeze,
          );
          dispatch({
            type: 'LOAD_SUCCESS',
            payload: { ...stored, streakFreeze: refreshedFreeze },
          });
        } else {
          dispatch({ type: 'LOAD_SUCCESS', payload: DEFAULT_PROGRESS });
        }
      } catch {
        if (mounted) dispatch({ type: 'LOAD_ERROR', payload: 'Failed to load progress' });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [kv]);

  useEffect(() => {
    if (!state.isLoading) {
      kv.setJSON(PROGRESS_KEY, state.progress).catch(() => {});
    }
  }, [kv, state.progress, state.isLoading]);

  const { attempts } = usePersistence();
  const recordLessonAttempt = useCallback(
    async (data: Omit<LessonAttempt, 'id' | 'completedAt'>) => {
      const attempt: LessonAttempt = {
        ...data,
        score: Math.min(100, Math.max(0, data.score)),
        id: generateAttemptId(),
        completedAt: new Date().toISOString(),
      };
      dispatch({ type: 'RECORD_ATTEMPT', payload: attempt });
      await attempts.record(attempt); // SQLite source-of-truth log
    },
    [attempts],
  );

  const resetProgress = useCallback(async () => {
    dispatch({ type: 'RESET_PROGRESS' });
    await kv.remove(PROGRESS_KEY);
    await attempts.clear();
  }, [kv, attempts]);

  const refreshProgress = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    const stored = await kv.getJSON<UserProgress>(PROGRESS_KEY);
    dispatch({ type: 'LOAD_SUCCESS', payload: stored ?? DEFAULT_PROGRESS });
  }, [kv]);

  const getMilestone = useCallback(
    () => getCurrentMilestone(state.progress.averageScore),
    [state.progress.averageScore],
  );

  const getCurrentStreak = useCallback(() => {
    const { lastActiveDate, dailyStreak, streakFreeze } = state.progress;
    const today = getLocalDateString();
    if (lastActiveDate === today) return dailyStreak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastActiveDate === getLocalDateString(yesterday)) return dailyStreak;
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const isOneDayGap = lastActiveDate === getLocalDateString(twoDaysAgo);
    const refreshed = refreshFreezeIfNewWeek(streakFreeze ?? DEFAULT_PROGRESS.streakFreeze);
    if (isOneDayGap && refreshed.available > 0 && dailyStreak > 0) return dailyStreak;
    return 0;
  }, [state.progress]);

  const getStreakMessage = useCallback(() => {
    const streak = getCurrentStreak();
    const freezesAvailable = state.progress.streakFreeze?.available ?? 0;
    if (streak === 0) return 'Start your streak today!';
    const freezeInfo = freezesAvailable > 0 ? ' • 1 freeze ready' : '';
    if (streak < 7) return `${7 - streak} more days for 'WEEKLY WARRIOR'${freezeInfo}`;
    if (streak < 14) return `${14 - streak} more days for 'HOT STREAK'${freezeInfo}`;
    if (streak < 30) return `${30 - streak} more days for 'MONTHLY MASTER'${freezeInfo}`;
    return `You're on fire! Keep it going!${freezeInfo}`;
  }, [getCurrentStreak, state.progress.streakFreeze]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      ...state,
      recordLessonAttempt,
      resetProgress,
      refreshProgress,
      getCurrentMilestone: getMilestone,
      getCurrentStreak,
      getStreakMessage,
    }),
    [state, recordLessonAttempt, resetProgress, refreshProgress, getMilestone, getCurrentStreak, getStreakMessage],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
