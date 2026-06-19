import { useCallback } from 'react';
import { useLesson } from '../../contexts/lesson-context';
import { MAX_ATTEMPTS } from '../../contexts/reducers/lesson-reducer';
import { isSingleSelectCorrect, pointsForAttempt, correctOptionOf } from './scoring';
import type { Question } from '../../types/lesson';

export function useCheckAnswer() {
  const {
    state,
    incrementAttempt,
    addDisabledChoice,
    recordQuestionScore,
    markQuestionCompleted,
    showSuccessModal,
    showRetryModal,
    showRevealModal,
  } = useLesson();

  const checkAnswer = useCallback(
    (question: Question, isLastQuestion: boolean) => {
      if (question.type !== 'single_select') return; // multi/drag: Slices 2-3

      const qid = question.q_id;
      const selected = state.answers[qid];
      const attempt = incrementAttempt(qid);
      const correct = isSingleSelectCorrect(question, selected);

      if (correct) {
        const pts = pointsForAttempt(question.points, attempt);
        recordQuestionScore(qid, pts);
        markQuestionCompleted(qid);
        showSuccessModal({ points: pts, explanation: question.explanation, isLastQuestion });
      } else if (attempt < MAX_ATTEMPTS) {
        if (selected) addDisabledChoice(qid, selected);
        showRetryModal({ hint: question.retryHint });
      } else {
        recordQuestionScore(qid, 0);
        markQuestionCompleted(qid);
        showRevealModal({
          correctAnswer: correctOptionOf(question)?.text,
          explanation: question.explanation,
          isLastQuestion,
        });
      }
    },
    [
      state.answers,
      incrementAttempt,
      addDisabledChoice,
      recordQuestionScore,
      markQuestionCompleted,
      showSuccessModal,
      showRetryModal,
      showRevealModal,
    ],
  );

  return { checkAnswer };
}
