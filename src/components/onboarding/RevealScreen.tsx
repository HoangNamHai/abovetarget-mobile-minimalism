import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../primitives/Button';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import type { Plan } from '../../lib/onboarding/onboarding-plan';
import { DOMAIN_TITLE } from '../../data/domains';

type Props = { preparing: boolean; plan: Plan; readyByLabel: string | null; ctaLabel: string; onContinue: () => void };

export function RevealScreen({ preparing, plan, readyByLabel, ctaLabel, onContinue }: Props) {
  if (preparing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.primary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Txt variant="display" style={{ fontSize: 28, color: TOKENS['on-primary'], textAlign: 'center' }}>
            Preparing your plan…
          </Txt>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 16 }}>
        <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
          Your study plan
        </Txt>
        <Txt variant="display" style={{ fontSize: 36, lineHeight: 40, letterSpacing: -0.5, color: TOKENS.primary }}>
          Your plan is ready.
        </Txt>
        <View style={{ flex: 1, gap: 12, marginTop: 8 }}>
          <Txt variant="body" style={{ fontSize: 16, color: TOKENS.primary }}>
            Starting with: <Txt style={{ fontWeight: '700' }}>{DOMAIN_TITLE[plan.focusDomain]}</Txt>
          </Txt>
          <Txt variant="body" style={{ fontSize: 16, color: TOKENS.primary }}>
            Pace: <Txt style={{ fontWeight: '700' }}>{plan.dailyMinutes} min/day</Txt>
            {` (~${plan.dailyGoal} ${plan.dailyGoal === 1 ? 'lesson' : 'lessons'})`}
            {readyByLabel ? ` — exam-ready by ${readyByLabel}` : ''}
          </Txt>
          <Txt variant="body" style={{ fontSize: 14, lineHeight: 21, color: TOKENS.outline }}>
            {plan.rationale}
          </Txt>
        </View>
        <Button label={ctaLabel} onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
