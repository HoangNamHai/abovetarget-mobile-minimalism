import { Redirect } from 'expo-router';
import React from 'react';
import { useOnboarding } from '../contexts/onboarding-context';
import { useAppAuth } from '../contexts/auth-context';
import { authRequired } from '../config/env';
import { resolveLandingRoute } from '../lib/auth/auth-route';

export default function Index() {
  const { isLoading: onboardingLoading, hasCompletedOnboarding } = useOnboarding();
  const { isLoading: authLoading, isSignedIn } = useAppAuth();

  const route = resolveLandingRoute({
    onboardingLoading,
    authLoading,
    hasCompletedOnboarding,
    authRequired: authRequired(),
    isSignedIn,
  });

  if (route === null) return null;

  return <Redirect href={route} />;
}
