import { useCallback } from 'react';
import { useLesson } from '../../../contexts/lesson-context';
import type { Question } from '../../../types/lesson';

export type QuestionScreenControls = {
  current: Question;
  index: number;
  isLast: boolean;
  advance: () => void;
};

/**
 * Shared hook for question-iteration across Challenge, Practice, and Transfer
 * screens. Given an ordered list of questions it surfaces the current one and
 * provides a single `advance()` callback that either moves to the next question
 * (by updating the global currentQuestionIndex) or advances the lesson when the
 * last question is complete.
 *
 * End-of-screen handling mirrors the reference app:
 * - Not the last screen (Challenge/Transfer) → `nextScreen()`.
 * - The last screen (a Practice screen sits *after* Wrap in the screen order) →
 *   `nextScreen()` would cap at the final index and reset the question index,
 *   looping back to question 0 forever. Jump to the Wrap screen to end instead.
 */
export function useQuestionScreen(questions: Question[]): QuestionScreenControls {
  const { state, setCurrentQuestionIndex, nextScreen, goToScreen, isLastScreen } = useLesson();
  const index = state.currentQuestionIndex;
  const current = questions[index] ?? questions[0];
  const isLast = index >= questions.length - 1;

  const advance = useCallback(() => {
    if (!isLast) {
      setCurrentQuestionIndex(index + 1);
      return;
    }
    if (isLastScreen) {
      const wrapIndex =
        state.lessonData?.screens.findIndex((s) => s.screen_type === 'wrap') ?? -1;
      if (wrapIndex !== -1) {
        goToScreen(wrapIndex);
        return;
      }
    }
    nextScreen();
  }, [isLast, isLastScreen, index, setCurrentQuestionIndex, nextScreen, goToScreen, state.lessonData]);

  return { current, index, isLast, advance };
}
