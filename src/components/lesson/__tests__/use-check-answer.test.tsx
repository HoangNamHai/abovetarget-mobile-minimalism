import React, { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { LessonProvider, useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import type { SingleSelectQuestion } from '../../../types/lesson';
import { MAX_ATTEMPTS } from '../../../contexts/reducers/lesson-reducer';

// B1L5: challenge screen, q1 is single_select, 85 points, correct option = 'B'
const LESSON_ID = 'B1L5';
const Q_ID = 'q1';
const CORRECT_OPTION = 'B';
const WRONG_OPTION = 'A';
const Q_POINTS = 85;

function wrapper({ children }: { children: ReactNode }) {
  return <LessonProvider>{children}</LessonProvider>;
}

function harness() {
  return renderHook(
    () => ({ lesson: useLesson(), check: useCheckAnswer() }),
    { wrapper },
  );
}

async function loadAndGetQuestion(result: ReturnType<typeof harness>['result']) {
  await act(async () => {
    await result.current.lesson.loadLesson(LESSON_ID);
  });

  const challengeScreen = result.current.lesson.state.lessonData!.screens.find(
    (s) => s.screen_type === 'challenge',
  );
  const question = (challengeScreen as any).interaction.questions.find(
    (q: any) => q.q_id === Q_ID,
  ) as SingleSelectQuestion;

  return question;
}

test('correct single_select answer scores full points and shows success', async () => {
  const { result } = await harness();
  const question = await loadAndGetQuestion(result);

  await act(async () => {
    result.current.lesson.selectAnswer(Q_ID, CORRECT_OPTION);
  });

  await act(async () => {
    result.current.check.checkAnswer(question, false);
  });

  expect(result.current.lesson.state.questionScores[Q_ID]).toBe(Q_POINTS);
  expect(result.current.lesson.state.modalType).toBe('success');
});

test('first wrong answer shows retry and disables the wrong choice', async () => {
  const { result } = await harness();
  const question = await loadAndGetQuestion(result);

  await act(async () => {
    result.current.lesson.selectAnswer(Q_ID, WRONG_OPTION);
  });

  await act(async () => {
    result.current.check.checkAnswer(question, false);
  });

  expect(result.current.lesson.state.modalType).toBe('retry');
  expect(result.current.lesson.state.disabledChoices[Q_ID]).toContain(WRONG_OPTION);
});

test('wrong answer at MAX_ATTEMPTS shows reveal and records zero score', async () => {
  const { result } = await harness();
  const question = await loadAndGetQuestion(result);

  // Exhaust all attempts with wrong answers
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await act(async () => {
      result.current.lesson.selectAnswer(Q_ID, WRONG_OPTION);
    });
    await act(async () => {
      result.current.check.checkAnswer(question, false);
    });
  }

  expect(result.current.lesson.state.modalType).toBe('reveal');
  expect(result.current.lesson.state.questionScores[Q_ID]).toBe(0);
});
