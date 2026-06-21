import { router } from 'expo-router';
import React from 'react';
import { ValueScreen } from '../../components/onboarding/ValueScreen';
import { getLessonImage } from '../../data/lesson-images';

export default function StoryConcept() {
  return (
    <ValueScreen
      eyebrow="How it works"
      title="One story, start to finish."
      body="Instead of disconnected facts, you learn through a single unfolding project — so concepts build on each other and actually stick."
      image={getLessonImage('/images/A1L1_comic_kitchen.webp')}
      onContinue={() => router.push('/(onboarding)/story-cast')}
    />
  );
}
