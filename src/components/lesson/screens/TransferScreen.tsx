import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { TransferScreen as TransferScreenType } from '../../../types/lesson';
import { Txt } from '../../primitives/Txt';
import { RichText } from '../../primitives/RichText';
import { Appear } from '../../primitives/Appear';
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
        <Appear index={0}>
          <Txt variant="display" className="text-on-surface" style={{ fontSize: 24, lineHeight: 33 }}>
            {scenario.title}
          </Txt>
          <Hairline />
        </Appear>
        <Appear index={1}>
          <RichText className="text-on-surface text-lg leading-relaxed">
            {scenario.description}
          </RichText>
        </Appear>
        {scenario.details && scenario.details.length > 0 && (
          <Appear index={2}>
            <View style={{ gap: 8 }}>
              {scenario.details.map((detail, i) => (
                <RichText key={i} className="text-on-surface text-base leading-relaxed">
                  {detail}
                </RichText>
              ))}
            </View>
          </Appear>
        )}
        <Appear index={3}>
          <Button label="Start" onPress={() => setStarted(true)} />
        </Appear>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24, gap: 24 }}>
      <QuestionRunner questions={screen.content.questions} />
    </ScrollView>
  );
}
