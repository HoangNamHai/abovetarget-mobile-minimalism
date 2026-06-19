import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useLesson } from '../../contexts/lesson-context';
import { Txt } from '../primitives/Txt';
import { HookScreen } from './screens/HookScreen';
import { ChallengeScreen } from './screens/ChallengeScreen';
import { ReasonScreen } from './screens/ReasonScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { TransferScreen } from './screens/TransferScreen';
import { WrapScreen } from './screens/WrapScreen';
import type {
  HookScreen as HookScreenType,
  ChallengeScreen as ChallengeScreenType,
  ReasonScreen as ReasonScreenType,
  PracticeScreen as PracticeScreenType,
  TransferScreen as TransferScreenType,
  WrapScreen as WrapScreenType,
} from '../../types/lesson';

type Props = {
  lessonId: string;
};

export function LessonPlayer({ lessonId }: Props) {
  const { loadLesson, exitLesson, state, currentScreen } = useLesson();

  useEffect(() => {
    loadLesson(lessonId);
    return () => {
      exitLesson();
    };
  }, [lessonId, loadLesson, exitLesson]);

  if (state.loading || !currentScreen) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <Txt variant="body" className="text-on-surface">
          Loading…
        </Txt>
      </View>
    );
  }

  switch (currentScreen.screen_type) {
    case 'hook':
      return <HookScreen screen={currentScreen as HookScreenType} />;
    case 'challenge':
      return <ChallengeScreen screen={currentScreen as ChallengeScreenType} />;
    case 'reason':
      return <ReasonScreen screen={currentScreen as ReasonScreenType} />;
    case 'practice':
      return <PracticeScreen screen={currentScreen as PracticeScreenType} />;
    case 'transfer':
      return <TransferScreen screen={currentScreen as TransferScreenType} />;
    case 'wrap':
      return (
        <WrapScreen
          screen={currentScreen as WrapScreenType}
          onFinish={() => router.back()}
        />
      );
    default:
      return (
        <View className="flex-1 bg-surface items-center justify-center">
          <Txt variant="body" className="text-on-surface">
            Unknown screen type
          </Txt>
        </View>
      );
  }
}
