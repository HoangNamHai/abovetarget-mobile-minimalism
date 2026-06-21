import { router } from 'expo-router';
import React from 'react';
import { ValueScreen } from '../../components/onboarding/ValueScreen';
import { getLessonImage } from '../../data/lesson-images';

export default function StoryCast() {
  return (
    <ValueScreen
      eyebrow="Your case study"
      title="Welcome to Savory & Co."
      body="You’ll steer real projects for a restaurant group — its sponsors, its team, its crises. Every PMP concept shows up as a decision someone has to make."
      image={getLessonImage('/images/A1L3_comic_investor.webp')}
      onContinue={() => router.push('/(onboarding)/exam-date')}
    />
  );
}
