// Pure routing decision for the app's landing redirect (app/index.tsx).
// Kept free of React so it can be unit-tested in isolation.
//
// Auth is OPTIONAL (anonymous mode): the app is fully usable signed-out, so the
// landing gate only depends on onboarding. Signing in is offered later (after a
// completed unit, or from Profile), never forced here.

export interface LandingRouteInput {
  /** Onboarding context still hydrating from storage. */
  onboardingLoading: boolean;
  hasCompletedOnboarding: boolean;
}

export type LandingRoute = '/(onboarding)/splash' | '/(tabs)/home';

/**
 * Decide where the root index route should send the user.
 * Returns `null` while we should render nothing (still loading).
 */
export function resolveLandingRoute(input: LandingRouteInput): LandingRoute | null {
  if (input.onboardingLoading) return null;
  if (!input.hasCompletedOnboarding) return '/(onboarding)/splash';
  return '/(tabs)/home';
}
