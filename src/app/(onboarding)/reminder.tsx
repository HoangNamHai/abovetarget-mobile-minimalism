import { router } from 'expo-router';
import React, { useState } from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { useOnboarding, type Reminder as Rem } from '../../contexts/onboarding-context';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

const OPTIONS: ChoiceOption[] = [
  { value: 'morning', label: 'Morning', description: 'Start the day sharp — 8:00 AM.' },
  { value: 'lunch', label: 'Lunch break', description: 'A productive midday habit — 12:30 PM.' },
  { value: 'evening', label: 'Evening', description: 'Wind down with learning — 7:00 PM.' },
  { value: 'none', label: 'No reminder', description: 'I’ll open the app on my own.' },
];

export default function Reminder() {
  const { reminder, setReminder } = useOnboarding();
  const [value, setValue] = useState<string[]>([reminder]);
  function onContinue() {
    setReminder((value[0] ?? 'morning') as Rem);
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
