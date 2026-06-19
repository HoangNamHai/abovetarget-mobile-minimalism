import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { TransferScreen as TransferScreenType } from '../../../types/lesson';
import { Txt } from '../../primitives/Txt';
import { Button } from '../../primitives/Button';
import { Hairline } from '../../primitives/Hairline';
import { QuestionRunner } from './QuestionRunner';

type Props = {
  screen: TransferScreenType;
};

export function TransferScreen({ screen }: Props) {
  const [started, setStarted] = useState(false);

  if (!started) {
    const { scenario } = screen.content;
    return (
      <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24, gap: 24 }}>
        <Txt variant="display" className="text-on-surface">
          {scenario.title}
        </Txt>
        <Hairline />
        <Txt variant="body" className="text-on-surface leading-relaxed">
          {scenario.description}
        </Txt>
        {scenario.details && scenario.details.length > 0 && (
          <View style={{ gap: 8 }}>
            {scenario.details.map((detail, i) => (
              <Txt key={i} variant="body" className="text-on-surface">
                {detail}
              </Txt>
            ))}
          </View>
        )}
        <Button label="Start" onPress={() => setStarted(true)} />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24, gap: 24 }}>
      <QuestionRunner questions={screen.content.questions} />
    </ScrollView>
  );
}
