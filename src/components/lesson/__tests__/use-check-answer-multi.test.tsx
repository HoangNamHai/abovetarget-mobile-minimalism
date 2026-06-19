import React, { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { LessonProvider, useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import type { MultiSelectQuestion } from '../../../types/lesson';

const wrapper = ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider>;
function harness() {
  return renderHook(() => ({ lesson: useLesson(), check: useCheckAnswer() }), { wrapper });
}
async function loadQ(result: Awaited<ReturnType<typeof harness>>['result']): Promise<MultiSelectQuestion> {
  await act(async () => { await result.current.lesson.loadLesson('A1L3'); });
  const ch = result.current.lesson.state.lessonData!.screens.find(
    (s: { screen_type: string }) => s.screen_type === 'challenge',
  );
  return (ch as any).interaction.questions[0] as MultiSelectQuestion;
}

test('exact correct multi_select selection scores full points and shows success', async () => {
  const { result } = await harness();
  const q = await loadQ(result);
  for (const id of ['A', 'B', 'C']) {
    await act(async () => { result.current.lesson.toggleMultiSelect('q1', id, 3); });
  }
  await act(async () => { result.current.check.checkAnswer(q, false); });
  expect(result.current.lesson.state.questionScores['q1']).toBe(250);
  expect(result.current.lesson.state.modalType).toBe('success');
});

test('wrong multi_select selection shows retry and deselects the incorrect pick', async () => {
  const { result } = await harness();
  const q = await loadQ(result);
  for (const id of ['A', 'B', 'D']) {
    await act(async () => { result.current.lesson.toggleMultiSelect('q1', id, 3); });
  }
  await act(async () => { result.current.check.checkAnswer(q, false); });
  expect(result.current.lesson.state.modalType).toBe('retry');
  // incorrect 'D' deselected, correct 'A','B' kept
  expect(result.current.lesson.state.multiSelectAnswers['q1'].sort()).toEqual(['A', 'B']);
});

test('multi_select wrong to MAX_ATTEMPTS reveals and scores zero', async () => {
  const { result } = await harness();
  const q = await loadQ(result);
  for (let i = 0; i < 3; i++) {
    await act(async () => { result.current.lesson.toggleMultiSelect('q1', 'D', 3); }); // wrong only
    await act(async () => { result.current.check.checkAnswer(q, false); });
  }
  expect(result.current.lesson.state.modalType).toBe('reveal');
  expect(result.current.lesson.state.questionScores['q1']).toBe(0);
});
