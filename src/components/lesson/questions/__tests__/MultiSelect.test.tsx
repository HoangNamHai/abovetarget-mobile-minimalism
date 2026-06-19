import React, { type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { LessonProvider } from '../../../../contexts/lesson-context';
import { QuestionView } from '../QuestionView';
import type { MultiSelectQuestion } from '../../../../types/lesson';

const mq = {
  type: 'multi_select', q_id: 'm1', question: 'Select all that apply', points: 250, maxSelections: 3,
  options: [
    { id: 'A', text: 'Alpha', correct: true }, { id: 'B', text: 'Bravo', correct: true },
    { id: 'C', text: 'Charlie', correct: false },
  ],
} as MultiSelectQuestion;

const wrap = ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider>;

test('QuestionView renders MultiSelect options and a check button (no longer a placeholder)', async () => {
  const { getByText, queryByText } = await render(
    <QuestionView question={mq} isLastQuestion={false} />, { wrapper: wrap },
  );
  expect(getByText('Alpha')).toBeTruthy();
  expect(getByText('Bravo')).toBeTruthy();
  expect(getByText(/check/i)).toBeTruthy();
  expect(queryByText(/isn't supported|not supported/i)).toBeNull();
});
