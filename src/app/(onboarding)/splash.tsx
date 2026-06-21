import { router } from 'expo-router';
import React from 'react';
import { ValueScreen } from '../../components/onboarding/ValueScreen';
import { getLessonImage } from '../../data/lesson-images';

export default function OnboardingSplash() {
  return (
    <ValueScreen
      eyebrow="PMP Exam Pro"
      title="Learn by doing — not memorizing."
      body="Master the PMP through real project decisions, one lesson at a time."
      ctaLabel="Get Started"
      image={getLessonImage('/images/A1L2_comic_authority.webp')}
      onContinue={() => router.push('/(onboarding)/story-concept')}
    />
  );
}
