import { router } from 'expo-router';
import React from 'react';
import { FactScreen } from '../../components/onboarding/FactScreen';
import { getFact } from '../../data/onboarding-facts';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function FactSocial() {
  return (
    <FactScreen
      fact={getFact('social')}
      progress={progressFor('fact-social')}
      onContinue={() => router.push('/(onboarding)/experience')}
    />
  );
}
