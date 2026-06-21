import { resolveLandingRoute } from '../auth-route';

test('renders nothing while onboarding is loading', () => {
  expect(
    resolveLandingRoute({ onboardingLoading: true, hasCompletedOnboarding: false }),
  ).toBeNull();
});

test('sends to onboarding splash when not completed', () => {
  // Must be a *named* route, not the group index. The group index would
  // resolve to '/' (route-group segments are stripped) and collide with the
  // root gate at app/index.tsx, causing a redirect loop.
  expect(
    resolveLandingRoute({ onboardingLoading: false, hasCompletedOnboarding: false }),
  ).toBe('/(onboarding)/splash');
});

test('sends to the app once onboarding is complete (no forced auth)', () => {
  expect(
    resolveLandingRoute({ onboardingLoading: false, hasCompletedOnboarding: true }),
  ).toBe('/(tabs)/home');
});
