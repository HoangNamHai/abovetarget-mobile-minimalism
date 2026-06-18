import type { LessonAttempt } from '../../types/progress';
import type { AttemptRepository } from './attempt-repository';

function newestFirst(a: LessonAttempt, b: LessonAttempt): number {
  return b.completedAt.localeCompare(a.completedAt);
}

export class InMemoryAttemptRepository implements AttemptRepository {
  private attempts: LessonAttempt[] = [];

  seed(attempts: LessonAttempt[]): void {
    this.attempts = [...attempts];
  }

  async record(attempt: LessonAttempt): Promise<void> {
    this.attempts.push(attempt);
  }

  async listAll(): Promise<LessonAttempt[]> {
    return [...this.attempts].sort(newestFirst);
  }

  async listRecent(limit: number): Promise<LessonAttempt[]> {
    return (await this.listAll()).slice(0, limit);
  }

  async count(): Promise<number> {
    return this.attempts.length;
  }

  async clear(): Promise<void> {
    this.attempts = [];
  }
}
