import type { Domain, LessonAttempt } from '../../types/progress';
import { getLocalDateString } from '../../utils/date';

export interface DomainCompletion {
  completed: number;
  averageScore: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function deriveActiveDays(attempts: LessonAttempt[]): string[] {
  const days = new Set<string>();
  for (const a of attempts) {
    days.add(getLocalDateString(new Date(a.completedAt)));
  }
  return Array.from(days).sort();
}

export function deriveDomainCompletion(
  attempts: LessonAttempt[],
  domain: Domain,
): DomainCompletion {
  const inDomain = attempts.filter((a) => a.domain === domain);
  if (inDomain.length === 0) return { completed: 0, averageScore: 0 };
  const sum = inDomain.reduce((acc, a) => acc + a.score, 0);
  return { completed: inDomain.length, averageScore: round1(sum / inDomain.length) };
}

export function deriveOverall(attempts: LessonAttempt[]): {
  totalLessonsCompleted: number;
  averageScore: number;
} {
  if (attempts.length === 0) return { totalLessonsCompleted: 0, averageScore: 0 };
  const sum = attempts.reduce((acc, a) => acc + a.score, 0);
  return {
    totalLessonsCompleted: attempts.length,
    averageScore: round1(sum / attempts.length),
  };
}
