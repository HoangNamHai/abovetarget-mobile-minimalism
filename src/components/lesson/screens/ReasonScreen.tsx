import React from 'react';
import { ScrollView, View } from 'react-native';
import type { ReasonScreen as ReasonScreenType } from '../../../types/lesson';
import { useLesson } from '../../../contexts/lesson-context';
import { Txt } from '../../primitives/Txt';
import { RichText } from '../../primitives/RichText';
import { Appear } from '../../primitives/Appear';
import { Button } from '../../primitives/Button';
import { Hairline } from '../../primitives/Hairline';

type Props = {
  screen: ReasonScreenType;
};

export function ReasonScreen({ screen }: Props) {
  const { nextScreen } = useLesson();
  const { microTeach } = screen;
  const firstTab = microTeach.tabs[0];

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24 }}>
      <Appear index={0}>
        <Txt variant="display" className="text-3xl text-on-surface mb-4" style={{ lineHeight: 42 }}>
          {microTeach.title}
        </Txt>
        <Hairline />
      </Appear>
      {firstTab ? (
        <Appear index={1}>
          <View className="mt-4 mb-8">
            {firstTab.title ? (
              <Txt variant="label" className="text-primary uppercase tracking-widest mb-2 text-xs">
                {firstTab.title}
              </Txt>
            ) : null}
            <RichText className="text-on-surface text-lg leading-relaxed">
              {firstTab.content}
            </RichText>
          </View>
        </Appear>
      ) : null}
      <Appear index={2}>
        <Button label="Continue" onPress={nextScreen} />
      </Appear>
    </ScrollView>
  );
}
