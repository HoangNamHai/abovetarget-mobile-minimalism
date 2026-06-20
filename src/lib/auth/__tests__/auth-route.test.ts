import { resolveLandingRoute } from '../auth-route';

test('renders nothing while onboarding is loading', () => {
  expect(
    resolveLandingRoute({ onboardingLoading: true, hasCompletedOnboarding: false }),
  ).toBeNull();
});

test('sends to onboarding when not completed', () => {
  expect(
    resolveLandingRoute({ onboardingLoading: false, hasCompletedOnboarding: false }),
  ).toBe('/(onboarding)');
});

test('sends to the app once onboarding is complete (no forced auth)', () => {
  expect(
    resolveLandingRoute({ onboardingLoading: false, hasCompletedOnboarding: true }),
  ).toBe('/(tabs)/home');
});
