import React from 'react';
import { View } from 'react-native';
import { Txt } from '../../primitives/Txt';
import { SingleSelect } from './SingleSelect';
import { MultiSelect } from './MultiSelect';
import type { Question } from '../../../types/lesson';

export function QuestionView({ question, isLastQuestion }: { question: Question; isLastQuestion: boolean }) {
  if (question.type === 'single_select') {
    return <SingleSelect question={question} isLastQuestion={isLastQuestion} />;
  }
  if (question.type === 'multi_select') {
    return <MultiSelect question={question} isLastQuestion={isLastQuestion} />;
  }
  return (
    <View style={{ padding: 16 }}>
      <Txt variant="body">This question type isn't supported yet.</Txt>
    </View>
  );
}
