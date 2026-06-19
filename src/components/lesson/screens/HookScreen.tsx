import React from 'react';
import { ScrollView, View } from 'react-native';
import type { HookScreen as HookScreenType } from '../../../types/lesson';
import { useLesson } from '../../../contexts/lesson-context';
import { Txt } from '../../primitives/Txt';
import { Button } from '../../primitives/Button';
import { Hairline } from '../../primitives/Hairline';

type Props = {
  screen: HookScreenType;
};

export function HookScreen({ screen }: Props) {
  const { nextScreen } = useLesson();
  const { headline, intro, learning_hook } = screen.content;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ padding: 24 }}>
      <Txt variant="display" className="text-3xl text-on-surface mb-4">
        {headline}
      </Txt>
      <Hairline />
      <View className="mt-4 mb-4">
        <Txt variant="body" className="text-on-surface text-base leading-relaxed">
          {intro}
        </Txt>
      </View>
      <Hairline />
      <View className="mt-4 mb-8">
        <Txt variant="label" className="text-primary uppercase tracking-widest mb-2 text-xs">
          Learning Hook
        </Txt>
        <Txt variant="body" className="text-on-surface text-base leading-relaxed">
          {learning_hook}
        </Txt>
      </View>
      <Button label="Continue" onPress={nextScreen} />
    </ScrollView>
  );
}
