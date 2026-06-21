import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../primitives/Button';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { OnboardingProgress } from './OnboardingProgress';
import type { Fact } from '../../data/onboarding-facts';

type Props = { fact: Fact; onContinue: () => void; progress?: number | null; ctaLabel?: string };

export function FactScreen({ fact, onContinue, progress, ctaLabel = 'Continue' }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS['surface-container-lowest'] }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 24 }}>
        {progress != null && <OnboardingProgress progress={progress} />}
        <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
            Did you know
          </Txt>
          <Txt variant="display" style={{ fontSize: 30, lineHeight: 38, letterSpacing: -0.5, color: TOKENS.primary }}>
            {fact.text}
          </Txt>
        </View>
        <Button label={ctaLabel} onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
