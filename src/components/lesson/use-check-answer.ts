import { useCallback } from 'react';
import { useLesson } from '../../contexts/lesson-context';
import { MAX_ATTEMPTS } from '../../contexts/reducers/lesson-reducer';
import { isSingleSelectCorrect, pointsForAttempt, correctOptionOf, isMultiSelectCorrect, correctOptionsOf, isDragDropCorrect, allChipsPlaced } from './scoring';
import type { Question, MultiSelectQuestion, DragDropQuestion } from '../../types/lesson';

export function useCheckAnswer() {
  const {
    state,
    incrementAttempt,
    addDisabledChoice,
    toggleMultiSelect,
    setDropZoneAnswer,
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

      if (question.type === 'drag_drop') {
        const qid = (question as DragDropQuestion).q_id;
        const answers = state.dropZoneAnswers[qid] ?? {};
        if (!allChipsPlaced(question as DragDropQuestion, answers)) return; // wait until everything is placed
        const attempt = incrementAttempt(qid);
        if (isDragDropCorrect(question as DragDropQuestion, answers)) {
          const pts = pointsForAttempt((question as DragDropQuestion).points, attempt);
          recordQuestionScore(qid, pts);
          markQuestionCompleted(qid);
          showSuccessModal({ points: pts, explanation: (question as DragDropQuestion).explanation, isLastQuestion });
        } else if (attempt < MAX_ATTEMPTS) {
          const correctZoneOf: Record<string, string> = {};
          for (const chip of (question as DragDropQuestion).chips) correctZoneOf[chip.id] = chip.correctZone;
          // Keep only correctly-placed chips per zone; remove mis-placed ones
          for (const [zoneId, content] of Object.entries(answers)) {
            const chips = Array.isArray(content) ? content : content ? [content] : [];
            const kept = chips.filter((c) => correctZoneOf[c.id] === zoneId);
            if (kept.length !== chips.length) {
              setDropZoneAnswer(qid, zoneId, kept.length ? kept : null);
            }
          }
          showRetryModal({ hint: (question as DragDropQuestion).retryHint });
        } else {
          recordQuestionScore(qid, 0);
          markQuestionCompleted(qid);
          const zoneLabel: Record<string, string> = {};
          for (const z of (question as DragDropQuestion).dropZones) zoneLabel[z.id] = z.label;
          showRevealModal({
            correctAnswer: (question as DragDropQuestion).chips.map((c) => `${c.label} → ${zoneLabel[c.correctZone] ?? c.correctZone}`).join('; '),
            explanation: (question as DragDropQuestion).explanation,
            isLastQuestion,
          });
        }
        return;
      }
    },
    [
      state.answers,
      state.multiSelectAnswers,
      state.dropZoneAnswers,
      incrementAttempt,
      addDisabledChoice,
      toggleMultiSelect,
      setDropZoneAnswer,
      recordQuestionScore,
      markQuestionCompleted,
      showSuccessModal,
      showRetryModal,
      showRevealModal,
    ],
  );

  return { checkAnswer };
}
