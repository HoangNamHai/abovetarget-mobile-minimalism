import { router } from 'expo-router';
import React from 'react';
import { FactScreen } from '../../components/onboarding/FactScreen';
import { getFact } from '../../data/onboarding-facts';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function FactContent() {
  return (
    <FactScreen
      fact={getFact('content')}
      progress={progressFor('fact-content')}
      onContinue={() => router.push('/(onboarding)/confidence')}
    />
  );
}
