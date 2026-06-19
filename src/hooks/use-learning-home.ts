import { useMemo } from 'react';
import { useOnboarding } from '../contexts/onboarding-context';
import { useProgress } from '../contexts/progress-context';
import { getAllLessons } from '../data/lessons-data';
import { domainLessonTotals } from '../data/domains';
import type { Lesson } from '../types/lesson';
import type { Domain } from '../types/progress';

export type LearningHome = {
  /** Next lesson to study (first incomplete, prefers unlocked); null when all done. */
  nextLesson: Lesson | null;
  /** True once every lesson has at least one recorded attempt. */
  allCaughtUp: boolean;
  /** Lessons completed today (local date). */
  lessonsToday: number;
  /** The user's chosen daily goal (lessons/day). */
  dailyGoal: number;
  /** Whether today's goal has been met. */
  goalMet: boolean;
  /** Total lessons completed all-time. */
  lessonsCompleted: number;
  /** Average score across attempts (0–100). */
  mastery: number;
  /** Real lesson count per domain, derived from the curriculum. */
  domainTotals: Record<Domain, number>;
};

export function useLearningHome(): LearningHome {
  const { progress } = useProgress();
  const { dailyGoal } = useOnboarding();

  return useMemo(() => {
    const completedIds = new Set(progress.recentAttempts.map((a) => a.lessonId));
    const allLessons = getAllLessons();

    // Prefer the first incomplete *unlocked* lesson; fall back to any incomplete.
    const nextLesson =
      allLessons.find((l) => !completedIds.has(l.id) && !l.locked) ??
      allLessons.find((l) => !completedIds.has(l.id)) ??
      null;

    const today = new Date().toDateString();
    const lessonsToday = progress.recentAttempts.filter(
      (a) => new Date(a.completedAt).toDateString() === today,
    ).length;

    return {
      nextLesson,
      allCaughtUp: nextLesson === null,
      lessonsToday,
      dailyGoal,
      goalMet: dailyGoal > 0 && lessonsToday >= dailyGoal,
      lessonsCompleted: progress.totalLessonsCompleted,
      mastery: Math.round(progress.averageScore),
      domainTotals: domainLessonTotals(),
    };
  }, [progress.recentAttempts, progress.totalLessonsCompleted, progress.averageScore, dailyGoal]);
}
