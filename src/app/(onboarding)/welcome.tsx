import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/primitives/Button';
import { Hairline } from '../../components/primitives/Hairline';
import { Txt } from '../../components/primitives/Txt';
import { TOKENS } from '../../theme/tokens';

const PILLARS = [
  {
    number: '01',
    title: 'Editorial lessons',
    body: 'Every lesson is crafted like an article — narrative-driven, no bullet-point padding.',
  },
  {
    number: '02',
    title: 'Quiz as you go',
    body: 'Micro-questions after each concept lock in retention before you move on.',
  },
  {
    number: '03',
    title: 'Track your progress',
    body: 'See streaks, scores, and how close you are to exam-ready.',
  },
];

export default function Welcome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS['surface-container-lowest'] }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 40 }}>
        {/* Header */}
        <View style={{ gap: 8 }}>
          <Txt
            variant="label"
            style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}
          >
            How it works
          </Txt>
          <Txt
            variant="display"
            style={{ fontSize: 36, lineHeight: 40, letterSpacing: -0.5, color: TOKENS.primary }}
          >
            A smarter way to study.
          </Txt>
        </View>

        {/* Pillars */}
        <View style={{ flex: 1, gap: 0 }}>
          {PILLARS.map((pillar, i) => (
            <View key={pillar.number}>
              <View style={{ flexDirection: 'row', gap: 16, paddingVertical: 24 }}>
                <Txt
                  variant="display"
                  style={{ fontSize: 13, color: TOKENS.outline, letterSpacing: 2, width: 24, marginTop: 2 }}
                >
                  {pillar.number}
                </Txt>
                <View style={{ flex: 1, gap: 6 }}>
                  <Txt
                    variant="body"
                    style={{ fontSize: 17, fontWeight: '700', color: TOKENS.primary }}
                  >
                    {pillar.title}
                  </Txt>
                  <Txt
                    variant="body"
                    style={{ fontSize: 14, lineHeight: 21, color: TOKENS.outline }}
                  >
                    {pillar.body}
                  </Txt>
                </View>
              </View>
              {i < PILLARS.length - 1 && <Hairline />}
            </View>
          ))}
        </View>

        {/* CTA */}
        <Button
          label="Continue"
          onPress={() => router.push('/(onboarding)/goal-selection')}
        />
      </View>
    </SafeAreaView>
  );
}
