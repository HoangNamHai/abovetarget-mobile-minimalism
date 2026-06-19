import { POINT_MULTIPLIERS } from '../../contexts/reducers/lesson-reducer';
import type { SingleSelectQuestion } from '../../types/lesson';

export function correctOptionOf(question: SingleSelectQuestion) {
  return question.options.find((o) => o.correct);
}

export function isSingleSelectCorrect(
  question: SingleSelectQuestion,
  optionId: string | undefined,
): boolean {
  if (!optionId) return false;
  return correctOptionOf(question)?.id === optionId;
}

export function pointsForAttempt(basePoints: number, attempt: number): number {
  return Math.round(basePoints * (POINT_MULTIPLIERS[attempt] ?? 0));
}
