import { POINT_MULTIPLIERS } from '../../contexts/reducers/lesson-reducer';
import type { SingleSelectQuestion, MultiSelectQuestion, DragChip, DragDropQuestion } from '../../types/lesson';

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

export function dragDropPlacement(
  answers: Record<string, DragChip | DragChip[]>,
): Record<string, string> {
  const placement: Record<string, string> = {};
  for (const [zoneId, content] of Object.entries(answers)) {
    const chips = Array.isArray(content) ? content : [content];
    for (const chip of chips) {
      if (chip) placement[chip.id] = zoneId;
    }
  }
  return placement;
}

export function allChipsPlaced(
  question: DragDropQuestion,
  answers: Record<string, DragChip | DragChip[]>,
): boolean {
  const placement = dragDropPlacement(answers);
  return question.chips.length > 0 && question.chips.every((c) => placement[c.id] !== undefined);
}

export function isDragDropCorrect(
  question: DragDropQuestion,
  answers: Record<string, DragChip | DragChip[]>,
): boolean {
  const placement = dragDropPlacement(answers);
  return question.chips.length > 0 && question.chips.every((c) => placement[c.id] === c.correctZone);
}
