import { isSingleSelectCorrect, pointsForAttempt, correctOptionOf, isMultiSelectCorrect, correctOptionsOf } from '../scoring';
import type { SingleSelectQuestion, MultiSelectQuestion } from '../../../types/lesson';

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
