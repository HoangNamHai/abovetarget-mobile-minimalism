// Pure routing decision for the app's landing redirect (app/index.tsx).
// Kept free of React/Clerk so it can be unit-tested in isolation.

export interface LandingRouteInput {
  /** Onboarding context still hydrating from storage. */
  onboardingLoading: boolean;
  /** Clerk still determining the session (only meaningful when authRequired). */
  authLoading: boolean;
  hasCompletedOnboarding: boolean;
  /** Whether auth is enforced at all (false when no Clerk key is configured). */
  authRequired: boolean;
  isSignedIn: boolean;
}

export type LandingRoute = '/(onboarding)' | '/(auth)/sign-in' | '/(tabs)/home';

/**
 * Decide where the root index route should send the user.
 * Returns `null` while we should render nothing (still loading).
 *
 * Order: wait for state → onboarding → auth → app.
 */
export function resolveLandingRoute(input: LandingRouteInput): LandingRoute | null {
  const { onboardingLoading, authLoading, hasCompletedOnboarding, authRequired, isSignedIn } =
    input;

  if (onboardingLoading || (authRequired && authLoading)) return null;
  if (!hasCompletedOnboarding) return '/(onboarding)';
  if (authRequired && !isSignedIn) return '/(auth)/sign-in';
  return '/(tabs)/home';
}
