import React from 'react';
import { ScrollView } from 'react-native';
import type { PracticeScreen as PracticeScreenType } from '../../../types/lesson';
import { QuestionView } from '../questions/QuestionView';
import { FeedbackModal } from '../FeedbackModal';
import { useQuestionScreen } from './useQuestionScreen';

type Props = {
  screen: PracticeScreenType;
};

export function PracticeScreen({ screen }: Props) {
  const questions = screen.content.questions;
  const { current, isLast, advance } = useQuestionScreen(questions);

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24, gap: 24 }}>
      <QuestionView question={current} isLastQuestion={isLast} />
      <FeedbackModal
        onSuccessNext={advance}
        onRetry={() => {}}
        onReveal={advance}
      />
    </ScrollView>
  );
}
