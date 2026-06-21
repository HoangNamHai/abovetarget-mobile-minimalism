import { router } from 'expo-router';
import React, { useState } from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

const OPTIONS: ChoiceOption[] = [
  { value: 'agree', label: 'Yes — it feels like a lot', description: 'You’re not alone. We’ll break it into daily wins.' },
  { value: 'no', label: 'Not really', description: 'Great — we’ll keep your momentum.' },
];

export default function Belief() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <ChoiceScreen
      eyebrow="Be honest"
      title="Does studying for the PMP feel overwhelming?"
      options={OPTIONS}
      mode="single"
      value={value}
      onChange={setValue}
      onContinue={() => router.push('/(onboarding)/reminder')}
      progress={progressFor('belief')}
      requireSelection
    />
  );
}
