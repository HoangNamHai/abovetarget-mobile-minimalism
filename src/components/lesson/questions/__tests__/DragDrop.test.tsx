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

// Multi-chip fixture: 2 chips both go into the same single zone
const multiChipQ = {
  type: 'drag_drop', q_id: 'd2', question: 'Group the items', points: 10,
  chips: [
    { id: 'a', label: 'A', correctZone: 'z' },
    { id: 'b', label: 'B', correctZone: 'z' },
  ],
  dropZones: [{ id: 'z', label: 'Z' }],
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
  await fireEvent.press(getByText('Alice'));          // select chip
  await fireEvent.press(getByTestId('zone-sponsor')); // place into Sponsor
  // Alice now shown inside the zone; assert via a placed-chip testID
  await waitFor(() => expect(getByTestId('placed-alice')).toBeTruthy());
});

test('tapping two chips into the same zone places both (multi-chip zones)', async () => {
  const { getByText, getByTestId } = await render(
    <QuestionView question={multiChipQ} isLastQuestion={false} />, { wrapper: wrap },
  );
  // Place chip A into zone Z
  await fireEvent.press(getByText('A'));
  await fireEvent.press(getByTestId('zone-z'));
  await waitFor(() => expect(getByTestId('placed-a')).toBeTruthy());

  // Place chip B into the same zone Z
  await fireEvent.press(getByText('B'));
  await fireEvent.press(getByTestId('zone-z'));
  // Both chips should now be in the zone
  await waitFor(() => {
    expect(getByTestId('placed-a')).toBeTruthy();
    expect(getByTestId('placed-b')).toBeTruthy();
  });
});
