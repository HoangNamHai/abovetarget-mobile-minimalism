import React from 'react';
import { ScrollView } from 'react-native';
import type { ChallengeScreen as ChallengeScreenType } from '../../../types/lesson';
import { QuestionRunner } from './QuestionRunner';

type Props = {
  screen: ChallengeScreenType;
};

export function ChallengeScreen({ screen }: Props) {
  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24, gap: 24 }}>
      <QuestionRunner questions={screen.interaction.questions} />
    </ScrollView>
  );
}
