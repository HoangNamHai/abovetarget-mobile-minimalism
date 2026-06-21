import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/primitives/Button';
import { Txt } from '../../components/primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { DayOfWeekPicker } from '../../components/onboarding/DayOfWeekPicker';
import { TimeWheel } from '../../components/onboarding/TimeWheel';
import { useWeeklyReminder } from '../../hooks/use-weekly-reminder';
import { formatTime } from '../../lib/onboarding/weekly-reminder';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function Reminder() {
  const { schedule, setSchedule } = useWeeklyReminder();
  const [weekdays, setWeekdays] = useState<number[]>(schedule.weekdays);
  const [time, setTime] = useState({ hour: schedule.hour, minute: schedule.minute });

  async function onContinue() {
    await setSchedule({ weekdays, hour: time.hour, minute: time.minute });
    router.push('/(onboarding)/commit');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 24 }}>
        <OnboardingProgress progress={progressFor('reminder')!} />

        <View style={{ gap: 8 }}>
          <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
            Daily reminder
          </Txt>
          <Txt variant="display" style={{ fontSize: 30, lineHeight: 34, letterSpacing: -0.5, color: TOKENS.primary }}>
            When should we nudge you?
          </Txt>
          <Txt variant="body" style={{ fontSize: 14, lineHeight: 20, color: TOKENS.outline }}>
            Pick your study days and a time. We’ll send a gentle push notification.
          </Txt>
        </View>

        <DayOfWeekPicker value={weekdays} onChange={setWeekdays} />

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Txt variant="display" style={{ fontSize: 22, color: TOKENS.primary }}>
            {formatTime(time.hour, time.minute)}
          </Txt>
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <TimeWheel hour={time.hour} minute={time.minute} onChange={setTime} />
        </View>

        <Button label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
