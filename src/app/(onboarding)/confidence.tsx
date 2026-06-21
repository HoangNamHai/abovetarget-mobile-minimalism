import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/primitives/Button';
import { Txt } from '../../components/primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { ConfidenceRating } from '../../components/onboarding/ConfidenceRating';
import { useOnboarding } from '../../contexts/onboarding-context';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function Confidence() {
  const { confidence, setConfidence } = useOnboarding();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 32 }}>
        <OnboardingProgress progress={progressFor('confidence')!} />
        <View style={{ gap: 8 }}>
          <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
            Your starting point
          </Txt>
          <Txt variant="display" style={{ fontSize: 30, lineHeight: 34, letterSpacing: -0.5, color: TOKENS.primary }}>
            How confident are you in each area?
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <ConfidenceRating value={confidence} onChange={setConfidence} />
        </View>
        <Button label="Continue" onPress={() => router.push('/(onboarding)/fact-study')} />
      </View>
    </SafeAreaView>
  );
}
