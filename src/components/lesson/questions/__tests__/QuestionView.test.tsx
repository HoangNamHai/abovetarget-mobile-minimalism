import React, { type ReactNode } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LessonProvider } from '../../../../contexts/lesson-context';
import { QuestionView } from '../QuestionView';
import type { SingleSelectQuestion } from '../../../../types/lesson';

const q = {
  type: 'single_select', q_id: 'q1', question: 'Classify this work', points: 100,
  options: [{ id: 'a', text: 'Project', correct: true }, { id: 'b', text: 'Operations', correct: false }],
} as SingleSelectQuestion;

const wrap = ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider>;

test('renders single_select options and a check button', async () => {
  const { getByText } = await render(<QuestionView question={q} isLastQuestion={false} />, { wrapper: wrap });
  expect(getByText('Project')).toBeTruthy();
  expect(getByText('Operations')).toBeTruthy();
  expect(getByText(/check/i)).toBeTruthy();
});

test('renders a placeholder for an unsupported type (text_input)', async () => {
  const tq = { type: 'text_input', q_id: 't1', question: 'Describe it', points: 10 } as any;
  const { getByText } = await render(<QuestionView question={tq} isLastQuestion={false} />, { wrapper: wrap });
  expect(getByText(/isn't supported yet|not supported/i)).toBeTruthy();
});

test('renders DragDrop (not a placeholder) for drag_drop type', async () => {
  const dq = {
    type: 'drag_drop', q_id: 'd1', question: 'Match it', points: 10,
    chips: [{ id: 'c1', label: 'Chip1', correctZone: 'z1' }],
    dropZones: [{ id: 'z1', label: 'Zone1' }],
  } as any;
  const { getByText, queryByText } = await render(<QuestionView question={dq} isLastQuestion={false} />, { wrapper: wrap });
  expect(getByText('Zone1')).toBeTruthy();
  expect(queryByText(/isn't supported yet|not supported/i)).toBeNull();
});
