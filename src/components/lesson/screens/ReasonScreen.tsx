import React from 'react';
import { ScrollView, View } from 'react-native';
import type { ReasonScreen as ReasonScreenType } from '../../../types/lesson';
import { useLesson } from '../../../contexts/lesson-context';
import { Txt } from '../../primitives/Txt';
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
      <Txt variant="display" className="text-3xl text-on-surface mb-4">
        {microTeach.title}
      </Txt>
      <Hairline />
      {firstTab ? (
        <View className="mt-4 mb-8">
          {firstTab.title ? (
            <Txt variant="label" className="text-primary uppercase tracking-widest mb-2 text-xs">
              {firstTab.title}
            </Txt>
          ) : null}
          <Txt variant="body" className="text-on-surface text-base leading-relaxed">
            {firstTab.content}
          </Txt>
        </View>
      ) : null}
      <Button label="Continue" onPress={nextScreen} />
    </ScrollView>
  );
}
