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
import { useQuestionScreen } from '../useQuestionScreen';

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

// ─── C1: multi_select now supported — no Skip button ─────────────────────────

test('C1 - multi_select (A1L3 q0) now renders Check Answer, not Skip for now', async () => {
  // A1L3 challenge q0 is multi_select — now fully supported, shows Check Answer
  const { getByText, queryByText } = await render(
    <ChallengeHarness lessonId="A1L3" />,
    { wrapper: lessonWrapper },
  );

  await waitFor(() => expect(getByText(/check answer/i)).toBeTruthy());
  expect(queryByText(/skip for now/i)).toBeNull();
});

test('C1 - multi_select (A1L3) currentQuestionIndex stays at 0 before answering', async () => {
  const handlesRef: { current: LessonHandles | null } = { current: null };

  const { getByText } = await render(
    <LessonProvider>
      <LessonHandleCapture handlesRef={handlesRef} />
      <ChallengeHarness lessonId="A1L3" />
    </LessonProvider>,
  );

  // Wait for Check Answer button (multi_select now rendered properly)
  await waitFor(() => expect(getByText(/check answer/i)).toBeTruthy());

  // Index should still be 0 (not yet answered/advanced)
  expect(handlesRef.current!.getQuestionIndex()).toBe(0);
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

// ─── Practice-loop fix ──────────────────────────────────────────────────────

/** Drives the practice screen's question flow imperatively via a ref. */
function PracticeAdvanceCapture({ handlesRef }: { handlesRef: { current: any } }) {
  const lesson = useLesson();
  const practice = lesson.state.lessonData?.screens.find((s) => s.screen_type === 'practice');
  const questions = (practice?.content as { questions?: unknown[] })?.questions ?? [];
  const qs = useQuestionScreen(questions as never);
  handlesRef.current = {
    load: lesson.loadLesson,
    goToStage: lesson.goToStage,
    setIndex: lesson.setCurrentQuestionIndex,
    advance: qs.advance,
    questionCount: questions.length,
    screenType: lesson.screenType,
    screens: lesson.state.lessonData?.screens.map((s) => s.screen_type) ?? [],
  };
  return null;
}

test('practice as the last screen ends on wrap instead of looping back to question 0', async () => {
  const ref: { current: any } = { current: null };
  await render(<PracticeAdvanceCapture handlesRef={ref} />, { wrapper: lessonWrapper });

  await act(async () => {
    ref.current.load('A1L2');
  });
  await waitFor(() => expect(ref.current.screens.length).toBeGreaterThan(0));

  // Precondition that triggers the bug: practice is the final screen (after wrap).
  expect(ref.current.screens[ref.current.screens.length - 1]).toBe('practice');

  await act(async () => {
    ref.current.goToStage('practice');
  });
  expect(ref.current.screenType).toBe('practice');

  // Move to the last practice question, then advance.
  await act(async () => {
    ref.current.setIndex(ref.current.questionCount - 1);
  });
  await act(async () => {
    ref.current.advance();
  });

  // Lands on wrap — not stuck/looping in practice.
  expect(ref.current.screenType).toBe('wrap');
});
