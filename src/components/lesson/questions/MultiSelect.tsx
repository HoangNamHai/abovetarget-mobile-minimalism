import React from 'react';
import { View } from 'react-native';
import { useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import { QuizOption } from '../../quiz/QuizOption';
import { Button } from '../../primitives/Button';
import { Txt } from '../../primitives/Txt';
import type { MultiSelectQuestion } from '../../../types/lesson';

export function MultiSelect({ question, isLastQuestion }: { question: MultiSelectQuestion; isLastQuestion: boolean }) {
  const { state, toggleMultiSelect, isQuestionCompleted } = useLesson();
  const { checkAnswer } = useCheckAnswer();
  const selected = state.multiSelectAnswers[question.q_id] ?? [];
  const done = isQuestionCompleted(question.q_id);

  return (
    <View style={{ gap: 16 }}>
      <Txt variant="display">{question.question}</Txt>
      <View style={{ gap: 12 }}>
        {question.options.map((opt) => (
          <View key={opt.id} pointerEvents={done ? 'none' : 'auto'}>
            <QuizOption
              option={{ key: opt.id, label: opt.text }}
              selected={selected.includes(opt.id)}
              brand="monograph"
              onPress={() => toggleMultiSelect(question.q_id, opt.id, question.maxSelections)}
            />
          </View>
        ))}
      </View>
      {!done && (
        <Button label="Check Answer" onPress={() => checkAnswer(question, isLastQuestion)} />
      )}
    </View>
  );
}
