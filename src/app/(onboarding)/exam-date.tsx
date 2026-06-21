import { router } from 'expo-router';
import React, { useState } from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { useOnboarding } from '../../contexts/onboarding-context';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

const DAY = 24 * 60 * 60 * 1000;
const OPTIONS: ChoiceOption[] = [
  { value: '30', label: 'Within a month', description: 'The clock is ticking.' },
  { value: '90', label: '1–3 months', description: 'A focused run-up.' },
  { value: '180', label: '3–6 months', description: 'Plenty of runway.' },
  { value: 'none', label: 'Not booked yet', description: 'I’m still planning.' },
];

export default function ExamDate() {
  const { setExamDate } = useOnboarding();
  const [value, setValue] = useState<string[]>([]);
  function onContinue() {
    const pick = value[0];
    setExamDate(pick && pick !== 'none' ? Date.now() + Number(pick) * DAY : null);
    router.push('/(onboarding)/fact-exam');
  }
  return (
    <ChoiceScreen
      eyebrow="Your timeline"
      title="When’s your exam?"
      options={OPTIONS}
      mode="single"
      value={value}
      onChange={setValue}
      onContinue={onContinue}
      progress={progressFor('exam-date')}
      requireSelection
    />
  );
}
