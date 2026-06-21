import { router } from 'expo-router';
import React from 'react';
import { FactScreen } from '../../components/onboarding/FactScreen';
import { getFact } from '../../data/onboarding-facts';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function FactStudy() {
  return (
    <FactScreen
      fact={getFact('study')}
      progress={progressFor('fact-study')}
      onContinue={() => router.push('/(onboarding)/belief')}
    />
  );
}
