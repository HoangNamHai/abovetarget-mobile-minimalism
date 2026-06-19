import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LessonProvider } from '../../../../contexts/lesson-context';
import { QuestionView } from '../QuestionView';
import type { DragDropQuestion } from '../../../../types/lesson';

const dq = {
  type: 'drag_drop', q_id: 'd1', question: 'Match each person to their role', points: 250,
  chips: [
    { id: 'alice', label: 'Alice', correctZone: 'sponsor' },
    { id: 'bob', label: 'Bob', correctZone: 'user' },
  ],
  dropZones: [{ id: 'sponsor', label: 'Sponsor' }, { id: 'user', label: 'End User' }],
} as DragDropQuestion;

const wrap = ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider>;

test('QuestionView renders DragDrop chips and zones (not a placeholder)', async () => {
  const { getByText, queryByText } = await render(
    <QuestionView question={dq} isLastQuestion={false} />, { wrapper: wrap },
  );
  expect(getByText('Alice')).toBeTruthy();
  expect(getByText('Bob')).toBeTruthy();
  expect(getByText('Sponsor')).toBeTruthy();
  expect(getByText('End User')).toBeTruthy();
  expect(queryByText(/isn't supported|not supported/i)).toBeNull();
});

test('tapping a chip then a zone places it (chip leaves the tray)', async () => {
  const { getByText, getByTestId } = await render(
    <QuestionView question={dq} isLastQuestion={false} />, { wrapper: wrap },
  );
  fireEvent.press(getByText('Alice'));          // select chip
  fireEvent.press(getByTestId('zone-sponsor')); // place into Sponsor
  // Alice now shown inside the zone; assert via a placed-chip testID
  await waitFor(() => expect(getByTestId('placed-alice')).toBeTruthy());
});
