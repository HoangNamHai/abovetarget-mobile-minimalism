import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/primitives/Button';
import { Txt } from '../../components/primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { DomainPicker } from '../../components/onboarding/DomainPicker';
import { useOnboarding } from '../../contexts/onboarding-context';
import { buildPlan } from '../../lib/onboarding/onboarding-plan';
import { getAllLessons } from '../../data/lessons-data';
import { progressFor } from '../../lib/onboarding/onboarding-steps';
import type { Domain } from '../../types/progress';

export default function DomainScreen() {
  const { confidence, examDate, experience, dailyMinutes, setFocusDomain } = useOnboarding();
  const recommended = useMemo(
    () => buildPlan({ confidence, examDate, experience, dailyMinutes, chosenDomain: 'people', totalLessons: getAllLessons().length, now: Date.now() }).recommendedDomain,
    [confidence, examDate, experience, dailyMinutes],
  );
  const [selected, setSelected] = useState<Domain>(recommended);

  function onContinue() {
    setFocusDomain(selected);
    router.push('/(onboarding)/reveal');
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 24 }}>
        <OnboardingProgress progress={progressFor('domain')!} />
        <View style={{ gap: 8 }}>
          <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
            Your path
          </Txt>
          <Txt variant="display" style={{ fontSize: 32, lineHeight: 36, letterSpacing: -0.5, color: TOKENS.primary }}>
            Where do you want to start?
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <DomainPicker recommended={recommended} selected={selected} onSelect={setSelected} />
        </View>
        <Button label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
