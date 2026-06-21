import { router } from 'expo-router';
import React from 'react';
import { FactScreen } from '../../components/onboarding/FactScreen';
import { getFact } from '../../data/onboarding-facts';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function FactExam() {
  return (
    <FactScreen
      fact={getFact('exam')}
      progress={progressFor('fact-exam')}
      onContinue={() => router.push('/(onboarding)/why-certified')}
    />
  );
}
