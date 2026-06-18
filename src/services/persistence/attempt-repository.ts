import type { LessonAttempt } from '../../types/progress';

export interface AttemptRepository {
  record(attempt: LessonAttempt): Promise<void>;
  listAll(): Promise<LessonAttempt[]>;
  listRecent(limit: number): Promise<LessonAttempt[]>;
  count(): Promise<number>;
  clear(): Promise<void>;
}
