import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLesson } from '../../contexts/lesson-context';
import { useSubscription } from '../../contexts/subscription-context';
import { useLessonLimit } from '../../hooks/use-lesson-limit';
import { TOKENS, RADIUS } from '../../theme/tokens';
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

function LessonHeader({ progress, onExit }: { progress: number; onExit: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
      }}
    >
      <Pressable
        onPress={onExit}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Exit lesson"
        style={{ padding: 4 }}
      >
        <MaterialIcons name="close" size={24} color={TOKENS['on-background']} />
      </Pressable>
      <View
        style={{
          flex: 1,
          height: 6,
          borderRadius: RADIUS.track,
          backgroundColor: TOKENS['surface-container-highest'],
          overflow: 'hidden',
        }}
        accessibilityRole="progressbar"
        accessibilityValue={{ now: Math.round(progress), min: 0, max: 100 }}
      >
        <View
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, progress))}%`,
            backgroundColor: TOKENS.primary,
          }}
        />
      </View>
    </View>
  );
}

export function LessonPlayer({ lessonId }: Props) {
  const { loadLesson, exitLesson, state, currentScreen, progress } = useLesson();
  const { isPremium } = useSubscription();
  const { limitReached, isLoading: limitLoading } = useLessonLimit();

  // Free-tier gate: a non-premium user who has used today's lessons is sent to
  // the paywall instead of into the lesson. Inert while RevenueCat is disabled
  // (everyone is premium) and while the limit is still loading (avoids a flash).
  const blockedByLimit = !limitLoading && !isPremium && limitReached;

  useEffect(() => {
    loadLesson(lessonId);
    return () => {
      exitLesson();
    };
  }, [lessonId, loadLesson, exitLesson]);

  useEffect(() => {
    if (blockedByLimit) {
      // replace so the back gesture doesn't drop the user back into the lesson.
      router.replace('/paywall');
    }
  }, [blockedByLimit]);

  // Leave the lesson → always land on the app home. We deliberately do NOT use
  // router.back(): the first lesson after onboarding is reached via the
  // onboarding stack, so "back" pops into onboarding instead of the app. A lesson
  // belongs to the app shell, so leaving it has a single deterministic home.
  const leaveLesson = () => {
    exitLesson();
    router.replace('/(tabs)/home');
  };

  let content: React.ReactNode;

  if (blockedByLimit) {
    // Redirecting to the paywall — hold a neutral placeholder so no lesson
    // content flashes on screen.
    content = (
      <View className="flex-1 bg-surface items-center justify-center">
        <Txt variant="body" className="text-on-surface">
          Loading…
        </Txt>
      </View>
    );
  } else if (state.loading || !currentScreen) {
    content = (
      <View className="flex-1 bg-surface items-center justify-center">
        <Txt variant="body" className="text-on-surface">
          Loading…
        </Txt>
      </View>
    );
  } else {
    switch (currentScreen.screen_type) {
      case 'hook':
        content = <HookScreen screen={currentScreen as HookScreenType} />;
        break;
      case 'challenge':
        content = <ChallengeScreen screen={currentScreen as ChallengeScreenType} />;
        break;
      case 'reason':
        content = <ReasonScreen screen={currentScreen as ReasonScreenType} />;
        break;
      case 'practice':
        content = <PracticeScreen screen={currentScreen as PracticeScreenType} />;
        break;
      case 'transfer':
        content = <TransferScreen screen={currentScreen as TransferScreenType} />;
        break;
      case 'wrap':
        content = (
          <WrapScreen
            screen={currentScreen as WrapScreenType}
            onFinish={leaveLesson}
          />
        );
        break;
      default:
        content = (
          <View className="flex-1 bg-surface items-center justify-center">
            <Txt variant="body" className="text-on-surface">
              Unknown screen type
            </Txt>
          </View>
        );
    }
  }

  // Lesson screens render full-bleed ScrollViews; apply top + bottom safe-area
  // insets so headings clear the status bar / dynamic island and bottom actions
  // (e.g. "Check Answer", "Continue") clear the Android nav bar / home indicator
  // instead of rendering underneath it. A persistent header gives the user a way
  // out and shows lesson progress.
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: TOKENS.surface }}>
      <LessonHeader progress={progress} onExit={leaveLesson} />
      <View style={{ flex: 1 }}>{content}</View>
    </SafeAreaView>
  );
}
