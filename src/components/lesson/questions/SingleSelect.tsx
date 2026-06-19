import React from 'react';
import { View } from 'react-native';
import { useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import { QuizOption } from '../../quiz/QuizOption';
import { Appear } from '../../primitives/Appear';
import { Button } from '../../primitives/Button';
import { QuestionPrompt } from './QuestionPrompt';
import type { SingleSelectQuestion } from '../../../types/lesson';

export function SingleSelect({ question, isLastQuestion }: { question: SingleSelectQuestion; isLastQuestion: boolean }) {
  const { state, selectAnswer, isChoiceDisabled, isQuestionCompleted } = useLesson();
  const { checkAnswer } = useCheckAnswer();
  const selected = state.answers[question.q_id] ?? null;
  const done = isQuestionCompleted(question.q_id);

  return (
    <View style={{ gap: 16 }}>
      <QuestionPrompt>{question.question}</QuestionPrompt>
      <View style={{ gap: 12 }}>
        {question.options.map((opt, i) => (
          <Appear key={opt.id} index={i + 1}>
            <View pointerEvents={isChoiceDisabled(question.q_id, opt.id) || done ? 'none' : 'auto'}>
              <QuizOption
                option={{ key: opt.id, label: opt.text }}
                selected={selected === opt.id}
                disabled={isChoiceDisabled(question.q_id, opt.id)}
                brand="monograph"
                onPress={() => selectAnswer(question.q_id, opt.id)}
              />
            </View>
          </Appear>
        ))}
      </View>
      {!done && (
        <Appear index={question.options.length + 1}>
          <Button label="Check Answer" onPress={() => checkAnswer(question, isLastQuestion)} />
        </Appear>
      )}
    </View>
  );
}
