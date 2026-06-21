import { router } from 'expo-router';
import React from 'react';
import { ValueScreen } from '../../components/onboarding/ValueScreen';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function Commit() {
  return (
    <ValueScreen
      eyebrow="Your pledge"
      title="Commit to passing."
      body="You’ve set your goal. The next step is showing up — a little, every day."
      ctaLabel="I’m committed"
      progress={progressFor('commit')}
      onContinue={() => router.push('/(onboarding)/domain')}
    />
  );
}
