import { useMemo } from 'react';
import { useOnboarding } from '../contexts/onboarding-context';
import { useProgress } from '../contexts/progress-context';
import { getAllLessons } from '../data/lessons-data';
import { domainLessonTotals } from '../data/domains';
import type { Lesson } from '../types/lesson';
import type { Domain } from '../types/progress';

export type LearningHome = {
  /** Next lesson to study — first incomplete after the most recent one, so it
   *  advances as the user progresses; null when all done. */
  nextLesson: Lesson | null;
  /** Most recently completed lesson (to revisit); null when none done yet. */
  recentLesson: Lesson | null;
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
    const lessonById = new Map(allLessons.map((l) => [l.id, l]));

    // recentAttempts is ordered newest-first, so [0] is the last lesson studied.
    const recentLesson =
      progress.recentAttempts.length > 0
        ? lessonById.get(progress.recentAttempts[0].lessonId) ?? null
        : null;

    // First incomplete (unlocked) lesson, anywhere in the curriculum.
    const firstIncomplete =
      allLessons.find((l) => !completedIds.has(l.id) && !l.locked) ??
      allLessons.find((l) => !completedIds.has(l.id)) ??
      null;

    // "Continue" = the first incomplete lesson AFTER the most recent one — so it
    // moves forward as you progress instead of being stuck on an early gap. Falls
    // back to the first incomplete anywhere (and finally null when all done).
    const recentIdx = recentLesson
      ? allLessons.findIndex((l) => l.id === recentLesson.id)
      : -1;
    const nextAfterRecent =
      recentIdx >= 0
        ? allLessons.slice(recentIdx + 1).find((l) => !completedIds.has(l.id) && !l.locked) ?? null
        : null;
    const nextLesson = nextAfterRecent ?? firstIncomplete;

    const today = new Date().toDateString();
    const lessonsToday = progress.recentAttempts.filter(
      (a) => new Date(a.completedAt).toDateString() === today,
    ).length;

    return {
      nextLesson,
      recentLesson,
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
