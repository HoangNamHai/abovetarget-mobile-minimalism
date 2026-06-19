import React from 'react';
import { ScrollView } from 'react-native';
import type { PracticeScreen as PracticeScreenType } from '../../../types/lesson';
import { QuestionRunner } from './QuestionRunner';

type Props = {
  screen: PracticeScreenType;
};

export function PracticeScreen({ screen }: Props) {
  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24, gap: 24 }}>
      <QuestionRunner questions={screen.content.questions} />
    </ScrollView>
  );
}
