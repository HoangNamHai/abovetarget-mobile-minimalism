import React from 'react';
import { View } from 'react-native';
import { useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import { QuizOption } from '../../quiz/QuizOption';
import { Button } from '../../primitives/Button';
import { Txt } from '../../primitives/Txt';
import type { SingleSelectQuestion } from '../../../types/lesson';

export function SingleSelect({ question, isLastQuestion }: { question: SingleSelectQuestion; isLastQuestion: boolean }) {
  const { state, selectAnswer, isChoiceDisabled, isQuestionCompleted } = useLesson();
  const { checkAnswer } = useCheckAnswer();
  const selected = state.answers[question.q_id] ?? null;
  const done = isQuestionCompleted(question.q_id);

  return (
    <View style={{ gap: 16 }}>
      <Txt variant="display">{question.question}</Txt>
      <View style={{ gap: 12 }}>
        {question.options.map((opt) => (
          <View key={opt.id} pointerEvents={isChoiceDisabled(question.q_id, opt.id) || done ? 'none' : 'auto'}>
            <QuizOption
              option={{ key: opt.id, label: opt.text }}
              selected={selected === opt.id}
              brand="monograph"
              onPress={() => selectAnswer(question.q_id, opt.id)}
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
