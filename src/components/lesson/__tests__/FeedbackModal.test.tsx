// Mock bottom-sheet to avoid native Worklets/Reanimated initialization.
// The mock renders children immediately (no sheet animation) so content is
// always in the tree — FeedbackModal gates content on state.modalVisible.
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => React.createElement(View, null, children),
    BottomSheetModal: React.forwardRef(({ children, onDismiss }: any, _ref: any) =>
      React.createElement(View, null, children),
    ),
    BottomSheetView: ({ children }: any) => React.createElement(View, null, children),
    BottomSheetModalProvider: ({ children }: any) => React.createElement(View, null, children),
  };
});

// Mock expo-haptics (Button triggers haptics on press)
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

// Mock @expo/vector-icons (Icon primitive may be referenced)
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LessonProvider, useLesson } from '../../../contexts/lesson-context';
import { FeedbackModal } from '../FeedbackModal';
import { Txt } from '../../primitives/Txt';

// ─── Test rig ─────────────────────────────────────────────────────────────────

function Rig({ onNext }: { onNext: () => void }) {
  const { showSuccessModal } = useLesson();
  return (
    <>
      <FeedbackModal onSuccessNext={onNext} onRetry={() => {}} onReveal={() => {}} />
      <Txt onPress={() => showSuccessModal({ points: 10, explanation: 'Because' })}>trigger</Txt>
    </>
  );
}

function wrapper({ children }: { children: ReactNode }) {
  return <LessonProvider>{children}</LessonProvider>;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('success modal shows explanation and advances on action', async () => {
  const onNext = jest.fn();
  const { getByText } = await render(<Rig onNext={onNext} />, { wrapper });

  fireEvent.press(getByText('trigger'));

  await waitFor(() => expect(getByText('Because')).toBeTruthy());

  fireEvent.press(getByText(/continue/i));

  expect(onNext).toHaveBeenCalled();
});

test('success modal shows points', async () => {
  const onNext = jest.fn();
  const { getByText } = await render(<Rig onNext={onNext} />, { wrapper });

  fireEvent.press(getByText('trigger'));

  await waitFor(() => expect(getByText('+10 pts')).toBeTruthy());
});

test('retry modal shows hint and Try Again button calls onRetry', async () => {
  const onRetry = jest.fn();

  function RetryRig() {
    const { showRetryModal } = useLesson();
    return (
      <>
        <FeedbackModal onSuccessNext={() => {}} onRetry={onRetry} onReveal={() => {}} />
        <Txt onPress={() => showRetryModal({ hint: 'Think harder' })}>trigger</Txt>
      </>
    );
  }

  const { getByText } = await render(<RetryRig />, { wrapper });

  fireEvent.press(getByText('trigger'));

  await waitFor(() => expect(getByText('Think harder')).toBeTruthy());

  fireEvent.press(getByText(/try again/i));

  expect(onRetry).toHaveBeenCalled();
});

test('reveal modal shows correct answer and Continue calls onReveal', async () => {
  const onReveal = jest.fn();

  function RevealRig() {
    const { showRevealModal } = useLesson();
    return (
      <>
        <FeedbackModal onSuccessNext={() => {}} onRetry={() => {}} onReveal={onReveal} />
        <Txt onPress={() => showRevealModal({ correctAnswer: 'Option B', explanation: 'Here why' })}>trigger</Txt>
      </>
    );
  }

  const { getByText } = await render(<RevealRig />, { wrapper });

  fireEvent.press(getByText('trigger'));

  await waitFor(() => expect(getByText('Option B')).toBeTruthy());

  fireEvent.press(getByText(/continue/i));

  expect(onReveal).toHaveBeenCalled();
});
