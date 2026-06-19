import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/primitives/Button';
import { Txt } from '../../components/primitives/Txt';
import { TOKENS } from '../../theme/tokens';

export default function OnboardingSplash() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 48 }}>
        {/* Wordmark */}
        <View>
          <Txt
            variant="display"
            style={{ fontSize: 32, letterSpacing: -0.5, color: TOKENS.primary }}
          >
            Monograph
          </Txt>
          <View style={{ width: 32, height: 2, backgroundColor: TOKENS.primary, marginTop: 8 }} />
        </View>

        {/* Centre copy */}
        <View style={{ gap: 16 }}>
          <Txt
            variant="display"
            style={{ fontSize: 44, lineHeight: 48, letterSpacing: -1, color: TOKENS.primary }}
          >
            Master the PMP — one lesson at a time.
          </Txt>
          <Txt
            variant="body"
            style={{ fontSize: 16, lineHeight: 24, color: TOKENS.outline, marginTop: 8 }}
          >
            Short, editorial lessons that fit your schedule. Built for professionals who don't have time to waste.
          </Txt>
        </View>

        {/* CTA */}
        <Button
          label="Get Started"
          onPress={() => router.push('/(onboarding)/welcome')}
        />
      </View>
    </SafeAreaView>
  );
}
