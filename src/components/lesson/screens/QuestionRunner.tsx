import React from 'react';
import { View } from 'react-native';
import { useLesson } from '../../../contexts/lesson-context';
import { useQuestionScreen } from './useQuestionScreen';
import { QuestionView } from '../questions/QuestionView';
import { FeedbackModal } from '../FeedbackModal';
import { Button } from '../../primitives/Button';
import type { Question } from '../../../types/lesson';

const SUPPORTED_TYPES = ['single_select', 'multi_select', 'drag_drop'];

type Props = {
  questions: Question[];
};

/**
 * Shared question-iteration component used by ChallengeScreen, PracticeScreen,
 * and TransferScreen.
 *
 * Fixes two soft-locks:
 *   C1 (unsupported question types): renders a "Skip for now" button that records
 *      0 points, marks the question completed, and calls advance() so the lesson
 *      can continue past multi_select / drag_drop questions.
 *   C2 (swipe-dismissed modal): when a question is completed and the feedback
 *      sheet is no longer visible, renders a screen-level "Continue" button so the
 *      user can still advance even if they swipe-dismissed the modal instead of
 *      tapping its Continue button.
 */
export function QuestionRunner({ questions }: Props) {
  const { current, isLast, advance } = useQuestionScreen(questions);
  const { state, isQuestionCompleted, recordQuestionScore, markQuestionCompleted } = useLesson();

  const supported = SUPPORTED_TYPES.includes(current.type);
  const done = isQuestionCompleted(current.q_id);

  // C1 fix: unsupported question types (only text_input remains — single_select,
  // multi_select and drag_drop are all supported) get a Skip button that records 0
  // and marks complete so wrap scoring stays coherent. No bundled lesson currently
  // uses text_input, so this is a graceful fallback rather than a live path.
  const handleSkip = () => {
    recordQuestionScore(current.q_id, 0);
    markQuestionCompleted(current.q_id);
    advance();
  };

  return (
    <View style={{ gap: 16 }}>
      <QuestionView question={current} isLastQuestion={isLast} />
      {/* onRetry is intentionally a no-op: tapping "Try Again" closes the modal, which
          returns the user to the same question — the reducer keeps it incomplete with
          choices re-enabled, so there is no screen-level action to take on retry. */}
      <FeedbackModal onSuccessNext={advance} onRetry={() => {}} onReveal={advance} />
      {/* C1: Skip button for unsupported question types */}
      {!supported && <Button label="Skip for now" onPress={handleSkip} />}
      {/* C2: Fallback Continue button when modal was swipe-dismissed after answering */}
      {supported && done && !state.modalVisible && (
        <Button label="Continue" onPress={advance} />
      )}
    </View>
  );
}
