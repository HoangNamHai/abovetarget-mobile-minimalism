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
import type { StreakFreeze } from '../utils/streak';
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
import { deriveDomainCompletion, deriveOverall, deriveActiveDays } from '../services/persistence';
import { getAllLessons } from '../data/lessons-data';
import { DOMAIN_OF } from '../data/domains';

export type { Domain, DomainProgress, UserProgress } from './reducers/progress-reducer';
export type { LessonAttempt } from '../types/progress';

const PROGRESS_KEY = '@pmp/v2/user-progress';

// ─── Sample data (dev only) ─────────────────────────────────────────────────
//
// Build a believable mid-journey attempt log: ~14 real lessons completed across
// the last 6 consecutive days (→ a 6-day streak), spread over all three domains
// with a realistic spread of scores.
function buildSampleAttempts(): LessonAttempt[] {
  const lessons = getAllLessons();
  // Walk the catalog with a stride for domain/module variety.
  const picks = [];
  const step = Math.max(1, Math.floor(lessons.length / 14));
  for (let i = 0; i < lessons.length && picks.length < 14; i += step) picks.push(lessons[i]);

  const SCORES = [88, 72, 95, 80, 100, 76, 92, 84, 68, 90, 78, 96, 82, 86];
  const PER_DAY = [3, 3, 2, 2, 2, 2]; // most-recent → oldest; sums to 14

  const attempts: LessonAttempt[] = [];
  let idx = 0;
  for (let day = 0; day < PER_DAY.length; day++) {
    for (let n = 0; n < PER_DAY[day] && idx < picks.length; n++) {
      const lesson = picks[idx];
      const completedAt = new Date();
      completedAt.setDate(completedAt.getDate() - day);
      completedAt.setHours(9 + n * 3, 15, 0, 0);
      attempts.push({
        id: `sample-${idx}-${completedAt.getTime()}`,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        questionCount: 3,
        score: SCORES[idx % SCORES.length],
        completedAt: completedAt.toISOString(),
        domain: DOMAIN_OF[lesson.domain],
      });
      idx++;
    }
  }
  return attempts;
}

interface CarryOver {
  streakFreeze?: StreakFreeze;
  bestStreak?: number;
  activeDays?: string[];
}

export function hydrateProgressFromLog(
  loggedAttempts: LessonAttempt[],
  carry: CarryOver | null,
): UserProgress {
  const overall = deriveOverall(loggedAttempts);
  return {
    ...DEFAULT_PROGRESS,
    totalLessonsCompleted: overall.totalLessonsCompleted,
    averageScore: overall.averageScore,
    activeDays: carry?.activeDays ?? deriveActiveDays(loggedAttempts),
    bestStreak: carry?.bestStreak ?? 0,
    streakFreeze: carry?.streakFreeze ?? DEFAULT_PROGRESS.streakFreeze,
    domainProgress: {
      people: { ...DEFAULT_PROGRESS.domainProgress.people, ...deriveDomainCompletion(loggedAttempts, 'people') },
      process: { ...DEFAULT_PROGRESS.domainProgress.process, ...deriveDomainCompletion(loggedAttempts, 'process') },
      business: { ...DEFAULT_PROGRESS.domainProgress.business, ...deriveDomainCompletion(loggedAttempts, 'business') },
    },
    recentAttempts: loggedAttempts,
  };
}

interface ProgressContextValue extends ProgressState {
  recordLessonAttempt: (attempt: Omit<LessonAttempt, 'id' | 'completedAt'>) => Promise<void>;
  resetProgress: () => Promise<void>;
  generateSampleProgress: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  getCurrentMilestone: () => { name: string; threshold: number; progress: number };
  getCurrentStreak: () => number;
  getStreakMessage: () => string;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { kv, attempts } = usePersistence();
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
          const [logged, carry] = await Promise.all([
            attempts.listRecent(200),
            kv.getJSON<CarryOver>('@pmp/v2/carry-over'),
          ]);
          if (!mounted) return;
          const payload =
            logged.length === 0 && !carry
              ? DEFAULT_PROGRESS
              : hydrateProgressFromLog(logged, carry);
          dispatch({ type: 'LOAD_SUCCESS', payload });
        }
      } catch {
        if (mounted) dispatch({ type: 'LOAD_ERROR', payload: 'Failed to load progress' });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [kv, attempts]);

  useEffect(() => {
    if (!state.isLoading) {
      kv.setJSON(PROGRESS_KEY, state.progress).catch(() => {});
    }
  }, [kv, state.progress, state.isLoading]);

  const recordLessonAttempt = useCallback(
    async (data: Omit<LessonAttempt, 'id' | 'completedAt'>) => {
      const attempt: LessonAttempt = {
        ...data,
        score: Math.min(100, Math.max(0, data.score)),
        id: generateAttemptId(),
        completedAt: new Date().toISOString(),
      };
      dispatch({ type: 'RECORD_ATTEMPT', payload: attempt });
      try {
        await attempts.record(attempt); // SQLite source-of-truth log
      } catch (error) {
        console.warn('[Progress] Failed to write attempt to log:', error);
      }
    },
    [attempts],
  );

  const resetProgress = useCallback(async () => {
    dispatch({ type: 'RESET_PROGRESS' });
    await kv.remove(PROGRESS_KEY);
    await attempts.clear();
  }, [kv, attempts]);

  // Dev tool: replace progress with a realistic sample so screens have data to
  // render. Writes the sample attempts to the log, derives progress from them,
  // and stamps a multi-day streak. Updates state immediately (no reload needed).
  const generateSampleProgress = useCallback(async () => {
    const sample = buildSampleAttempts();
    await attempts.clear();
    for (const a of sample) {
      try {
        await attempts.record(a);
      } catch (error) {
        console.warn('[Progress] Failed to write sample attempt:', error);
      }
    }
    const activeDays = Array.from(
      new Set(sample.map((a) => getLocalDateString(new Date(a.completedAt)))),
    ).sort();
    const streak = activeDays.length; // days are consecutive by construction
    const progress: UserProgress = {
      ...hydrateProgressFromLog(sample, null),
      dailyStreak: streak,
      lastActiveDate: getLocalDateString(),
      bestStreak: streak,
      activeDays,
    };
    await kv.setJSON(PROGRESS_KEY, progress);
    dispatch({ type: 'LOAD_SUCCESS', payload: progress });
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
      generateSampleProgress,
      refreshProgress,
      getCurrentMilestone: getMilestone,
      getCurrentStreak,
      getStreakMessage,
    }),
    [state, recordLessonAttempt, resetProgress, generateSampleProgress, refreshProgress, getMilestone, getCurrentStreak, getStreakMessage],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
