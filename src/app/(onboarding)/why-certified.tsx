import { router } from 'expo-router';
import React from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { useOnboarding } from '../../contexts/onboarding-context';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

const OPTIONS: ChoiceOption[] = [
  { value: 'promotion', label: 'Get a promotion' },
  { value: 'raise', label: 'Earn a raise' },
  { value: 'required', label: 'It’s required for my role' },
  { value: 'switch', label: 'Switch into project management' },
  { value: 'personal', label: 'Personal goal' },
];

export default function WhyCertified() {
  const { reasons, toggleReason } = useOnboarding();
  function onChange(next: string[]) {
    const added = next.find((v) => !reasons.includes(v));
    const removed = reasons.find((v) => !next.includes(v));
    if (added) toggleReason(added);
    if (removed) toggleReason(removed);
  }
  return (
    <ChoiceScreen
      eyebrow="Your motivation"
      title="Why are you getting certified?"
      subtitle="Pick all that apply."
      options={OPTIONS}
      mode="multi"
      value={reasons}
      onChange={onChange}
      onContinue={() => router.push('/(onboarding)/fact-social')}
      progress={progressFor('why-certified')}
      requireSelection
    />
  );
}
