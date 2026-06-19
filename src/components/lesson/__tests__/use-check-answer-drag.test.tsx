import React, { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { LessonProvider, useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import type { DragDropQuestion } from '../../../types/lesson';

const wrapper = ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider>;
function harness() {
  return renderHook(() => ({ lesson: useLesson(), check: useCheckAnswer() }), { wrapper });
}
async function loadQ(result: Awaited<ReturnType<typeof harness>>['result']): Promise<DragDropQuestion> {
  await act(async () => { await result.current.lesson.loadLesson('A1L3'); });
  const ch = result.current.lesson.state.lessonData!.screens.find(
    (s: { screen_type: string }) => s.screen_type === 'challenge',
  );
  return (ch as any).interaction.questions[1] as DragDropQuestion; // q2 is drag_drop
}
function placeAll(result: Awaited<ReturnType<typeof harness>>['result'], q: DragDropQuestion, correct: boolean) {
  // correct: place each chip into its correctZone
  // wrong: rotate each chip to zone (i+1) % len — all chips placed, all mis-matched
  const zones = q.dropZones;
  q.chips.forEach((chip, i) => {
    const zone = correct ? chip.correctZone : zones[(i + 1) % zones.length].id;
    result.current.lesson.setDropZoneAnswer('q2', zone, chip);
  });
}

test('all chips placed correctly scores full points and shows success', async () => {
  const { result } = await harness();
  const q = await loadQ(result);
  await act(async () => { placeAll(result, q, true); });
  await act(async () => { result.current.check.checkAnswer(q, false); });
  expect(result.current.lesson.state.questionScores['q2']).toBe(250);
  expect(result.current.lesson.state.modalType).toBe('success');
});

test('check is a no-op until all chips are placed', async () => {
  const { result } = await harness();
  const q = await loadQ(result);
  await act(async () => { result.current.lesson.setDropZoneAnswer('q2', q.chips[0].correctZone, q.chips[0]); });
  await act(async () => { result.current.check.checkAnswer(q, false); });
  expect(result.current.lesson.state.modalType).toBeNull(); // no modal, no attempt burned
});

test('wrong placement to MAX_ATTEMPTS reveals and scores zero', async () => {
  const { result } = await harness();
  const q = await loadQ(result);
  for (let i = 0; i < 3; i++) {
    await act(async () => { placeAll(result, q, false); }); // rotate chips into wrong zones (all placed, all wrong)
    await act(async () => { result.current.check.checkAnswer(q, false); });
  }
  expect(result.current.lesson.state.modalType).toBe('reveal');
  expect(result.current.lesson.state.questionScores['q2']).toBe(0);
});

test('chips>zones question (transfer_q2) is completable when all chips placed correctly', async () => {
  const { result } = await harness();
  // Load A1L2 and find the transfer screen
  await act(async () => { await result.current.lesson.loadLesson('A1L2'); });
  const transferScreen = result.current.lesson.state.lessonData!.screens.find(
    (s: { screen_type: string }) => s.screen_type === 'transfer',
  );
  const q = (transferScreen as any).content.questions.find(
    (q: { q_id: string }) => q.q_id === 'transfer_q2',
  ) as DragDropQuestion;

  // Group chips by correctZone and place them as arrays
  const chipsByZone: Record<string, typeof q.chips> = {};
  for (const chip of q.chips) {
    if (!chipsByZone[chip.correctZone]) chipsByZone[chip.correctZone] = [];
    chipsByZone[chip.correctZone].push(chip);
  }

  await act(async () => {
    for (const [zoneId, chips] of Object.entries(chipsByZone)) {
      result.current.lesson.setDropZoneAnswer('transfer_q2', zoneId, chips);
    }
  });

  await act(async () => { result.current.check.checkAnswer(q, false); });

  expect(result.current.lesson.state.modalType).toBe('success');
  expect(result.current.lesson.state.questionScores['transfer_q2']).toBeGreaterThan(0);
});
