import { Redirect } from 'expo-router';
import React from 'react';
import { useOnboarding } from '../contexts/onboarding-context';
import { resolveLandingRoute } from '../lib/auth/auth-route';

export default function Index() {
  const { isLoading, hasCompletedOnboarding } = useOnboarding();

  const route = resolveLandingRoute({
    onboardingLoading: isLoading,
    hasCompletedOnboarding,
  });

  if (route === null) return null;

  return <Redirect href={route} />;
}
