import { router } from 'expo-router';
import React, { useState } from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { useOnboarding } from '../../contexts/onboarding-context';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

const OPTIONS: ChoiceOption[] = [
  { value: '10', label: '10 min / day', description: 'Casual — a steady daily habit.' },
  { value: '20', label: '20 min / day', description: 'Committed — our recommended pace.' },
  { value: '30', label: '30 min / day', description: 'Intense — exam in sight.' },
];

export default function Commit() {
  const { dailyMinutes, setDailyMinutes } = useOnboarding();
  const [value, setValue] = useState<string[]>([String(dailyMinutes)]);

  function onContinue() {
    setDailyMinutes(Number(value[0] ?? '20'));
    router.push('/(onboarding)/domain');
  }

  return (
    <ChoiceScreen
      eyebrow="Your commitment"
      title="How much will you study a day?"
      subtitle="Small and consistent beats big and rare. You can change this later."
      options={OPTIONS}
      mode="single"
      value={value}
      onChange={setValue}
      onContinue={onContinue}
      ctaLabel="I’m committed"
      progress={progressFor('commit')}
      requireSelection
    />
  );
}
