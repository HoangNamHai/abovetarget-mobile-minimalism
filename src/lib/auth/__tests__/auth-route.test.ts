import { resolveLandingRoute, type LandingRouteInput } from '../auth-route';

const base: LandingRouteInput = {
  onboardingLoading: false,
  authLoading: false,
  hasCompletedOnboarding: true,
  authRequired: true,
  isSignedIn: true,
};

test('renders nothing while onboarding is loading', () => {
  expect(resolveLandingRoute({ ...base, onboardingLoading: true })).toBeNull();
});

test('renders nothing while auth is loading (auth required)', () => {
  expect(resolveLandingRoute({ ...base, authLoading: true })).toBeNull();
});

test('ignores auth loading when auth is not required', () => {
  expect(
    resolveLandingRoute({ ...base, authRequired: false, authLoading: true, isSignedIn: false }),
  ).toBe('/(tabs)/home');
});

test('sends to onboarding when not completed', () => {
  expect(resolveLandingRoute({ ...base, hasCompletedOnboarding: false })).toBe('/(onboarding)');
});

test('onboarding takes precedence over auth', () => {
  expect(
    resolveLandingRoute({ ...base, hasCompletedOnboarding: false, isSignedIn: false }),
  ).toBe('/(onboarding)');
});

test('sends to sign-in when auth required and not signed in', () => {
  expect(resolveLandingRoute({ ...base, isSignedIn: false })).toBe('/(auth)/sign-in');
});

test('no-key bypass: not signed in but auth not required goes to app', () => {
  expect(resolveLandingRoute({ ...base, authRequired: false, isSignedIn: false })).toBe(
    '/(tabs)/home',
  );
});

test('signed in and onboarded goes to app', () => {
  expect(resolveLandingRoute(base)).toBe('/(tabs)/home');
});
