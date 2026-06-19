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
 * (by updating the global currentQuestionIndex) or advances the lesson to the
 * next screen when the last question is complete.
 */
export function useQuestionScreen(questions: Question[]): QuestionScreenControls {
  const { state, setCurrentQuestionIndex, nextScreen } = useLesson();
  const index = state.currentQuestionIndex;
  const current = questions[index] ?? questions[0];
  const isLast = index >= questions.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      nextScreen();
    } else {
      setCurrentQuestionIndex(index + 1);
    }
  }, [isLast, index, setCurrentQuestionIndex, nextScreen]);

  return { current, index, isLast, advance };
}
