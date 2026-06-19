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

const GOALS = [
  { value: 1, label: '1 per day', description: 'Steady pace — great for busy weeks.' },
  { value: 2, label: '2 per day', description: 'Balanced — our recommended default.' },
  { value: 3, label: '3 per day', description: 'Accelerated — exam in sight.' },
] as const;

export default function GoalSelection() {
  const { setDailyGoal } = useOnboarding();
  const [selected, setSelected] = useState<number>(2);

  function handleContinue() {
    setDailyGoal(selected);
    router.push('/(onboarding)/question-reminder');
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
            Daily goal
          </Txt>
          <Txt
            variant="display"
            style={{ fontSize: 36, lineHeight: 40, letterSpacing: -0.5, color: TOKENS.primary }}
          >
            How many lessons per day?
          </Txt>
        </View>

        {/* Options */}
        <View style={{ flex: 1, gap: 0 }}>
          {GOALS.map((goal, i) => {
            const isSelected = selected === goal.value;
            return (
              <View key={goal.value}>
                <PressableFeedback onPress={() => setSelected(goal.value)}>
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
                        {goal.label}
                      </Txt>
                      <Txt
                        variant="body"
                        style={{
                          fontSize: 13,
                          color: isSelected ? 'rgba(255,255,255,0.7)' : TOKENS.outline,
                        }}
                      >
                        {goal.description}
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
                {i < GOALS.length - 1 && <Hairline />}
              </View>
            );
          })}
        </View>

        {/* CTA */}
        <Button label="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}
