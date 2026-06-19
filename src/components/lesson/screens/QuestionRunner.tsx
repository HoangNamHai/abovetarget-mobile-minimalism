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

  // C1 fix: unsupported question types (multi_select, drag_drop, text_input) get
  // a Skip button that records 0 and marks complete so wrap scoring stays coherent.
  const handleSkip = () => {
    recordQuestionScore(current.q_id, 0);
    markQuestionCompleted(current.q_id);
    advance();
  };

  return (
    <View style={{ gap: 16 }}>
      <QuestionView question={current} isLastQuestion={isLast} />
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
