import { Redirect } from 'expo-router';
import React from 'react';
import { useOnboarding } from '../contexts/onboarding-context';

export default function Index() {
  const { isLoading, hasCompletedOnboarding } = useOnboarding();

  if (isLoading) return null;

  return (
    <Redirect href={hasCompletedOnboarding ? '/(tabs)/home' : '/(onboarding)'} />
  );
}
