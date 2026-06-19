import { getLocalDateString } from '../../utils/date';
import {
  calculateStreakWithFreeze,
  type StreakFreeze,
} from '../../utils/streak';
import type { Domain, LessonAttempt } from '../../types/progress';

export type { Domain, LessonAttempt };

// ============================================
// Types
// ============================================

export interface DomainProgress {
  completed: number;
  averageScore: number;
}

export interface UserProgress {
  dailyStreak: number;
  lastActiveDate: string; // Local date (YYYY-MM-DD)
  bestStreak: number;
  activeDays: string[];   // All dates with activity (YYYY-MM-DD), deduplicated
  totalLessonsCompleted: number;
  averageScore: number;
  domainProgress: {
    people: DomainProgress;
    process: DomainProgress;
    business: DomainProgress;
  };
  recentAttempts: LessonAttempt[]; // Last 200 lesson attempts
  streakFreeze: StreakFreeze;
}

export interface ProgressState {
  progress: UserProgress;
  isLoading: boolean;
  error: string | null;
}

export type ProgressAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: UserProgress }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'RECORD_ATTEMPT'; payload: LessonAttempt }
  | { type: 'RESET_PROGRESS' };

// ============================================
// Constants
// ============================================

export const DEFAULT_PROGRESS: UserProgress = {
  dailyStreak: 0,
  lastActiveDate: '',
  bestStreak: 0,
  activeDays: [],
  totalLessonsCompleted: 0,
  averageScore: 0,
  domainProgress: {
    people: { completed: 0, averageScore: 0 },
    process: { completed: 0, averageScore: 0 },
    business: { completed: 0, averageScore: 0 },
  },
  recentAttempts: [],
  streakFreeze: {
    available: 1,
    weekStart: '',
    usedDates: [],
  },
};

export const MILESTONES = [
  { name: 'Beginner', threshold: 50 },
  { name: 'Intermediate', threshold: 70 },
  { name: 'Advanced', threshold: 85 },
  { name: 'Elite PMP Master', threshold: 92 },
];

export const initialProgressState: ProgressState = {
  progress: DEFAULT_PROGRESS,
  isLoading: true,
  error: null,
};

// ============================================
// Reducer
// ============================================

export function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null };

    case 'LOAD_SUCCESS':
      return { ...state, isLoading: false, progress: action.payload };

    case 'LOAD_ERROR':
      return { ...state, isLoading: false, error: action.payload };

    case 'RECORD_ATTEMPT': {
      const attempt = action.payload;
      const { progress } = state;
      const today = getLocalDateString();

      // Update streak with freeze support
      const streakResult = calculateStreakWithFreeze(
        progress.lastActiveDate,
        progress.dailyStreak,
        progress.streakFreeze || DEFAULT_PROGRESS.streakFreeze
      );

      // Track active days
      const currentActiveDays = progress.activeDays || [];
      const newActiveDays = currentActiveDays.includes(today)
        ? currentActiveDays
        : [...currentActiveDays, today];

      // Update domain progress
      const domainKey = attempt.domain;
      const currentDomain = progress.domainProgress[domainKey];
      const newDomainCompleted = currentDomain.completed + 1;
      const newDomainAverage =
        (currentDomain.averageScore * currentDomain.completed + attempt.score) / newDomainCompleted;

      // Update overall stats
      const newTotalCompleted = progress.totalLessonsCompleted + 1;
      const newOverallAverage =
        (progress.averageScore * progress.totalLessonsCompleted + attempt.score) / newTotalCompleted;

      // Update recent attempts (keep last 200)
      const newAttempts = [attempt, ...progress.recentAttempts].slice(0, 200);

      const newProgress: UserProgress = {
        ...progress,
        dailyStreak: streakResult.streak,
        lastActiveDate: today,
        bestStreak: Math.max(progress.bestStreak || 0, streakResult.streak),
        activeDays: newActiveDays,
        totalLessonsCompleted: newTotalCompleted,
        averageScore: Math.round(newOverallAverage * 10) / 10,
        domainProgress: {
          ...progress.domainProgress,
          [domainKey]: {
            ...currentDomain,
            completed: newDomainCompleted,
            averageScore: Math.round(newDomainAverage * 10) / 10,
          },
        },
        recentAttempts: newAttempts,
        streakFreeze: streakResult.freeze,
      };

      return { ...state, progress: newProgress };
    }

    case 'RESET_PROGRESS':
      return { ...state, progress: DEFAULT_PROGRESS };

    default:
      return state;
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get current milestone based on average score
 */
export function getCurrentMilestone(averageScore: number): {
  name: string;
  threshold: number;
  progress: number;
} {
  // Find current and next milestone
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (averageScore >= MILESTONES[i].threshold) {
      // User has reached this milestone
      if (i === MILESTONES.length - 1) {
        // Already at highest
        return {
          name: MILESTONES[i].name,
          threshold: MILESTONES[i].threshold,
          progress: 100,
        };
      }
      // Show progress to next milestone
      const next = MILESTONES[i + 1];
      const current = MILESTONES[i];
      const progressToNext = ((averageScore - current.threshold) / (next.threshold - current.threshold)) * 100;
      return {
        name: next.name,
        threshold: next.threshold,
        progress: Math.min(progressToNext, 100),
      };
    }
  }

  // Not yet at first milestone
  const first = MILESTONES[0];
  return {
    name: first.name,
    threshold: first.threshold,
    progress: (averageScore / first.threshold) * 100,
  };
}

/**
 * Generate unique ID for lesson attempts
 */
export function generateAttemptId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
