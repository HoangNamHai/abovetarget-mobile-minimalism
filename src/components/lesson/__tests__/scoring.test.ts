import { isSingleSelectCorrect, pointsForAttempt, correctOptionOf, isMultiSelectCorrect, correctOptionsOf, isDragDropCorrect, allChipsPlaced, dragDropPlacement } from '../scoring';
import type { SingleSelectQuestion, MultiSelectQuestion, DragDropQuestion, DragChip } from '../../../types/lesson';

const q = {
  type: 'single_select',
  q_id: 'q1',
  question: 'Pick',
  points: 100,
  options: [
    { id: 'a', text: 'A', correct: false },
    { id: 'b', text: 'B', correct: true },
  ],
} as SingleSelectQuestion;

test('isSingleSelectCorrect matches the correct option id', () => {
  expect(isSingleSelectCorrect(q, 'b')).toBe(true);
  expect(isSingleSelectCorrect(q, 'a')).toBe(false);
  expect(isSingleSelectCorrect(q, undefined)).toBe(false);
});

test('pointsForAttempt applies the multiplier ladder', () => {
  expect(pointsForAttempt(100, 1)).toBe(100);
  expect(pointsForAttempt(100, 2)).toBe(70);
  expect(pointsForAttempt(100, 3)).toBe(50);
  expect(pointsForAttempt(100, 4)).toBe(0);
});

test('correctOptionOf returns the correct option', () => {
  expect(correctOptionOf(q)?.id).toBe('b');
});

const mq = {
  type: 'multi_select', q_id: 'm1', question: 'Pick all', points: 250,
  options: [
    { id: 'A', text: 'A', correct: true }, { id: 'B', text: 'B', correct: true },
    { id: 'C', text: 'C', correct: true }, { id: 'D', text: 'D', correct: false },
  ],
} as MultiSelectQuestion;

test('isMultiSelectCorrect requires the exact correct set', () => {
  expect(isMultiSelectCorrect(mq, ['A', 'B', 'C'])).toBe(true);
  expect(isMultiSelectCorrect(mq, ['A', 'B'])).toBe(false);        // missing C
  expect(isMultiSelectCorrect(mq, ['A', 'B', 'C', 'D'])).toBe(false); // extra incorrect
  expect(isMultiSelectCorrect(mq, [])).toBe(false);                // empty
});

test('correctOptionsOf returns all correct options', () => {
  expect(correctOptionsOf(mq).map((o) => o.id)).toEqual(['A', 'B', 'C']);
});

const c = (id: string, correctZone: string): DragChip => ({ id, label: id, correctZone });
const dq = {
  type: 'drag_drop', q_id: 'd1', question: 'Match', points: 250,
  chips: [c('x', 'z1'), c('y', 'z2')],
  dropZones: [{ id: 'z1', label: 'Z1' }, { id: 'z2', label: 'Z2' }],
} as DragDropQuestion;

test('dragDropPlacement maps chip ids to their zone', () => {
  const answers = { z1: c('x', 'z1'), z2: c('y', 'z2') };
  expect(dragDropPlacement(answers)).toEqual({ x: 'z1', y: 'z2' });
});

test('allChipsPlaced is true only when every chip is in a zone', () => {
  expect(allChipsPlaced(dq, { z1: c('x', 'z1') })).toBe(false);
  expect(allChipsPlaced(dq, { z1: c('x', 'z1'), z2: c('y', 'z2') })).toBe(true);
});

test('isDragDropCorrect requires every chip in its correctZone', () => {
  expect(isDragDropCorrect(dq, { z1: c('x', 'z1'), z2: c('y', 'z2') })).toBe(true);
  expect(isDragDropCorrect(dq, { z1: c('y', 'z2'), z2: c('x', 'z1') })).toBe(false); // swapped
  expect(isDragDropCorrect(dq, { z1: c('x', 'z1') })).toBe(false);                    // incomplete
});
