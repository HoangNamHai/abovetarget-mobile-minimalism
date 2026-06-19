import { isSingleSelectCorrect, pointsForAttempt, correctOptionOf } from '../scoring';
import type { SingleSelectQuestion } from '../../../types/lesson';

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
