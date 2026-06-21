import { router } from 'expo-router';
import React, { useState } from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { useLocalNotifications } from '../../hooks/use-local-notifications';
import type { ReminderTime } from '../../services/infra/notifications';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

// Values and times mirror the notification service's TIME_MAPPING so the copy is
// truthful: morning 9:00, afternoon 12:00, evening 20:00.
const OPTIONS: ChoiceOption[] = [
  { value: 'morning', label: 'Morning', description: 'Start the day sharp — 9:00 AM.' },
  { value: 'afternoon', label: 'Afternoon', description: 'A productive midday habit — 12:00 PM.' },
  { value: 'evening', label: 'Evening', description: 'Wind down with learning — 8:00 PM.' },
  { value: 'disabled', label: 'No reminder', description: 'I’ll open the app on my own.' },
];

export default function Reminder() {
  const { setReminderTime } = useLocalNotifications();
  const [value, setValue] = useState<string[]>(['morning']);

  async function onContinue() {
    await setReminderTime((value[0] ?? 'morning') as ReminderTime);
    router.push('/(onboarding)/commit');
  }

  return (
    <ChoiceScreen
      eyebrow="Daily reminder"
      title="When should we remind you?"
      subtitle="Consistency beats intensity. A nudge goes a long way."
      options={OPTIONS}
      mode="single"
      value={value}
      onChange={setValue}
      onContinue={onContinue}
      progress={progressFor('reminder')}
      requireSelection
    />
  );
}
