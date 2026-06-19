// Mock bottom-sheet to avoid native Worklets/Reanimated initialization
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => React.createElement(View, null, children),
    BottomSheetModal: React.forwardRef(({ children }: any, _ref: any) =>
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

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

import React, { type ReactNode } from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { LessonProvider, useLesson } from '../../../../contexts/lesson-context';
import { ChallengeScreen } from '../ChallengeScreen';

// ─── Wrappers ─────────────────────────────────────────────────────────────────

function lessonWrapper({ children }: { children: ReactNode }) {
  return <LessonProvider>{children}</LessonProvider>;
}

// ─── ChallengeHarness ─────────────────────────────────────────────────────────

/** Loads a lesson inside LessonProvider and renders its challenge screen. */
function ChallengeHarness({ lessonId }: { lessonId: string }) {
  const { loadLesson, state } = useLesson();
  React.useEffect(() => {
    loadLesson(lessonId);
  }, [loadLesson, lessonId]);
  if (!state.lessonData) return null;
  const challenge = state.lessonData.screens.find((s) => s.screen_type === 'challenge')!;
  return <ChallengeScreen screen={challenge} />;
}

// ─── LessonHandleCapture ──────────────────────────────────────────────────────

/** Exposes lesson context actions/state to tests imperatively via a ref object. */
type LessonHandles = {
  selectAnswer: (qId: string, optId: string) => void;
  closeModal: () => void;
  getQuestionIndex: () => number;
};

function LessonHandleCapture({ handlesRef }: { handlesRef: { current: LessonHandles | null } }) {
  const { selectAnswer, closeModal, state } = useLesson();
  // Update ref every render so callers always get the latest closures/state
  handlesRef.current = {
    selectAnswer,
    closeModal,
    getQuestionIndex: () => state.currentQuestionIndex,
  };
  return null;
}

// ─── Existing smoke test ───────────────────────────────────────────────────────

test('challenge screen renders the first question of a real lesson', async () => {
  // B1L5's first challenge question is single_select — guarantees "Check Answer" button renders
  const { getByText } = await render(<ChallengeHarness lessonId="B1L5" />, { wrapper: lessonWrapper });
  await waitFor(() => expect(getByText(/check/i)).toBeTruthy());
});

// ─── C1: Skip button appears for unsupported question types ───────────────────

test('C1 - Skip for now button appears when challenge q0 is multi_select (A1L3)', async () => {
  // A1L3 challenge q0 is multi_select — should show Skip button, not Check Answer
  const { getByText, queryByText } = await render(
    <ChallengeHarness lessonId="A1L3" />,
    { wrapper: lessonWrapper },
  );

  await waitFor(() => expect(getByText(/skip for now/i)).toBeTruthy());
  expect(queryByText(/check answer/i)).toBeNull();
});

test('C1 - pressing Skip advances currentQuestionIndex past the unsupported question', async () => {
  const handlesRef: { current: LessonHandles | null } = { current: null };

  const { getByText } = await render(
    <LessonProvider>
      <LessonHandleCapture handlesRef={handlesRef} />
      <ChallengeHarness lessonId="A1L3" />
    </LessonProvider>,
  );

  // Wait for the skip button to appear (q0 = multi_select)
  await waitFor(() => expect(getByText(/skip for now/i)).toBeTruthy());

  await act(async () => {
    fireEvent.press(getByText(/skip for now/i));
  });

  // After skip, currentQuestionIndex should have advanced to 1
  await waitFor(() => {
    expect(handlesRef.current!.getQuestionIndex()).toBe(1);
  });
});

// ─── C2: Screen-level Continue appears after swipe-dismiss ────────────────────

test('C2 - Continue button appears after answering correctly then dismissing the modal without tapping Continue', async () => {
  // B1L5 challenge q0 is single_select, correct option is 'B'
  const handlesRef: { current: LessonHandles | null } = { current: null };

  const { getByText } = await render(
    <LessonProvider>
      <LessonHandleCapture handlesRef={handlesRef} />
      <ChallengeHarness lessonId="B1L5" />
    </LessonProvider>,
  );

  // Wait for Check Answer button (question rendered)
  await waitFor(() => expect(getByText(/check answer/i)).toBeTruthy());

  // Select the correct answer (B) and press Check Answer
  await act(async () => {
    handlesRef.current!.selectAnswer('q1', 'B');
  });

  await act(async () => {
    fireEvent.press(getByText(/check answer/i));
  });

  // Simulate swipe-dismiss: close the modal without pressing its Continue button
  await act(async () => {
    handlesRef.current!.closeModal();
  });

  // Screen-level Continue must now be visible
  await waitFor(() => expect(getByText(/^continue$/i)).toBeTruthy());
});

test('C2 - pressing the screen-level Continue advances to the next question', async () => {
  const handlesRef: { current: LessonHandles | null } = { current: null };

  const { getByText } = await render(
    <LessonProvider>
      <LessonHandleCapture handlesRef={handlesRef} />
      <ChallengeHarness lessonId="B1L5" />
    </LessonProvider>,
  );

  await waitFor(() => expect(getByText(/check answer/i)).toBeTruthy());

  await act(async () => {
    handlesRef.current!.selectAnswer('q1', 'B');
  });
  await act(async () => {
    fireEvent.press(getByText(/check answer/i));
  });
  await act(async () => {
    handlesRef.current!.closeModal();
  });

  // Press the screen-level Continue
  await waitFor(() => expect(getByText(/^continue$/i)).toBeTruthy());

  await act(async () => {
    fireEvent.press(getByText(/^continue$/i));
  });

  // Index should advance to 1 (next question)
  await waitFor(() => {
    expect(handlesRef.current!.getQuestionIndex()).toBe(1);
  });
});
