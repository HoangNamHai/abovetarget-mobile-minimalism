export type Domain = 'people' | 'process' | 'business';

export const DOMAINS: readonly Domain[] = ['people', 'process', 'business'] as const;

export function isDomain(value: unknown): value is Domain {
  return value === 'people' || value === 'process' || value === 'business';
}

/** A completed lesson attempt — the SQLite source-of-truth row. */
export interface LessonAttempt {
  id: string;
  lessonId: string;
  lessonTitle: string;
  questionCount: number;
  score: number; // 0-100
  completedAt: string; // ISO datetime
  domain: Domain;
}
