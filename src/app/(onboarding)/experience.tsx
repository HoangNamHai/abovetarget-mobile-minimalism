import { router } from 'expo-router';
import React, { useState } from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { useOnboarding, type Experience as Exp } from '../../contexts/onboarding-context';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

const OPTIONS: ChoiceOption[] = [
  { value: 'new', label: 'New to project management' },
  { value: 'informal', label: 'I run projects, but no formal training' },
  { value: 'experienced', label: 'Experienced PM — here for the cert' },
];

export default function Experience() {
  const { experience, setExperience } = useOnboarding();
  const [value, setValue] = useState<string[]>([experience]);
  function onContinue() {
    setExperience((value[0] ?? 'new') as Exp);
    router.push('/(onboarding)/fact-content');
  }
  return (
    <ChoiceScreen
      eyebrow="About you"
      title="How much project management experience do you have?"
      options={OPTIONS}
      mode="single"
      value={value}
      onChange={setValue}
      onContinue={onContinue}
      progress={progressFor('experience')}
      requireSelection
    />
  );
}
