import { POINT_MULTIPLIERS } from '../../contexts/reducers/lesson-reducer';
import type { SingleSelectQuestion, MultiSelectQuestion } from '../../types/lesson';

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

export function correctOptionsOf(question: MultiSelectQuestion) {
  return question.options.filter((o) => o.correct).map((o) => ({ id: o.id, text: o.text }));
}

export function isMultiSelectCorrect(question: MultiSelectQuestion, selectedIds: string[]): boolean {
  if (selectedIds.length === 0) return false;
  const correct = question.options.filter((o) => o.correct).map((o) => o.id);
  const selectedSet = new Set(selectedIds);
  const correctSet = new Set(correct);
  const allCorrectSelected = correct.every((id) => selectedSet.has(id));
  const noIncorrectSelected = selectedIds.every((id) => correctSet.has(id));
  return allCorrectSelected && noIncorrectSelected;
}
