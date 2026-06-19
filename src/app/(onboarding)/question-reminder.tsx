import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/primitives/Button';
import { Hairline } from '../../components/primitives/Hairline';
import { PressableFeedback } from '../../components/primitives/PressableFeedback';
import { Txt } from '../../components/primitives/Txt';
import { useOnboarding } from '../../contexts/onboarding-context';
import { TOKENS } from '../../theme/tokens';

const REMINDER_OPTIONS = [
  { id: 'morning', label: 'Morning', description: 'Start the day sharp — 8:00 AM.' },
  { id: 'lunch', label: 'Lunch break', description: 'A productive midday habit — 12:30 PM.' },
  { id: 'evening', label: 'Evening', description: 'Wind down with learning — 7:00 PM.' },
  { id: 'none', label: 'No reminder', description: 'I will open the app on my own.' },
] as const;

type ReminderId = (typeof REMINDER_OPTIONS)[number]['id'];

export default function QuestionReminder() {
  const { completeOnboarding } = useOnboarding();
  const [selected, setSelected] = useState<ReminderId>('morning');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleFinish() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await completeOnboarding();
      router.replace('/(tabs)/home');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 40 }}>
        {/* Header */}
        <View style={{ gap: 8 }}>
          <Txt
            variant="label"
            style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}
          >
            Daily reminder
          </Txt>
          <Txt
            variant="display"
            style={{ fontSize: 36, lineHeight: 40, letterSpacing: -0.5, color: TOKENS.primary }}
          >
            When should we remind you?
          </Txt>
          <Txt
            variant="body"
            style={{ fontSize: 14, lineHeight: 20, color: TOKENS.outline, marginTop: 4 }}
          >
            Consistency beats intensity. A nudge goes a long way.
          </Txt>
        </View>

        {/* Options */}
        <View style={{ flex: 1, gap: 0 }}>
          {REMINDER_OPTIONS.map((option, i) => {
            const isSelected = selected === option.id;
            return (
              <View key={option.id}>
                <PressableFeedback onPress={() => setSelected(option.id)}>
                  <View
                    style={{
                      paddingVertical: 20,
                      paddingHorizontal: 16,
                      backgroundColor: isSelected ? TOKENS.primary : 'transparent',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <Txt
                        variant="body"
                        style={{
                          fontSize: 17,
                          fontWeight: '700',
                          color: isSelected ? TOKENS['on-primary'] : TOKENS.primary,
                        }}
                      >
                        {option.label}
                      </Txt>
                      <Txt
                        variant="body"
                        style={{
                          fontSize: 13,
                          color: isSelected ? 'rgba(255,255,255,0.7)' : TOKENS.outline,
                        }}
                      >
                        {option.description}
                      </Txt>
                    </View>
                    {isSelected && (
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: TOKENS['on-primary'],
                          marginLeft: 12,
                        }}
                      />
                    )}
                  </View>
                </PressableFeedback>
                {i < REMINDER_OPTIONS.length - 1 && <Hairline />}
              </View>
            );
          })}
        </View>

        {/* CTA */}
        <Button
          label={isSubmitting ? 'Setting up...' : "Let's begin"}
          onPress={handleFinish}
        />
      </View>
    </SafeAreaView>
  );
}
