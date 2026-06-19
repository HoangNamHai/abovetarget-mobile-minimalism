import { useCallback } from 'react';
import { useLesson } from '../../contexts/lesson-context';
import { MAX_ATTEMPTS } from '../../contexts/reducers/lesson-reducer';
import { isSingleSelectCorrect, pointsForAttempt, correctOptionOf, isMultiSelectCorrect, correctOptionsOf } from './scoring';
import type { Question, MultiSelectQuestion } from '../../types/lesson';

export function useCheckAnswer() {
  const {
    state,
    incrementAttempt,
    addDisabledChoice,
    toggleMultiSelect,
    recordQuestionScore,
    markQuestionCompleted,
    showSuccessModal,
    showRetryModal,
    showRevealModal,
  } = useLesson();

  const checkAnswer = useCallback(
    (question: Question, isLastQuestion: boolean) => {
      if (question.type === 'single_select') {
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
        return;
      }

      if (question.type === 'multi_select') {
        const qid = question.q_id;
        const selected = state.multiSelectAnswers[qid] ?? [];
        if (selected.length === 0) return;
        const attempt = incrementAttempt(qid);
        if (isMultiSelectCorrect(question as MultiSelectQuestion, selected)) {
          const pts = pointsForAttempt(question.points, attempt);
          recordQuestionScore(qid, pts);
          markQuestionCompleted(qid);
          showSuccessModal({ points: pts, explanation: question.explanation, isLastQuestion });
        } else if (attempt < MAX_ATTEMPTS) {
          const correctIds = new Set(correctOptionsOf(question as MultiSelectQuestion).map((o) => o.id));
          for (const id of selected) {
            if (!correctIds.has(id)) toggleMultiSelect(qid, id); // deselect incorrect
          }
          showRetryModal({ hint: question.retryHint });
        } else {
          recordQuestionScore(qid, 0);
          markQuestionCompleted(qid);
          showRevealModal({
            correctAnswer: correctOptionsOf(question as MultiSelectQuestion).map((o) => o.text).join(', '),
            explanation: question.explanation,
            isLastQuestion,
          });
        }
        return;
      }

      // drag_drop: Slice 3 (no-op for now)
    },
    [
      state.answers,
      state.multiSelectAnswers,
      incrementAttempt,
      addDisabledChoice,
      toggleMultiSelect,
      recordQuestionScore,
      markQuestionCompleted,
      showSuccessModal,
      showRetryModal,
      showRevealModal,
    ],
  );

  return { checkAnswer };
}
