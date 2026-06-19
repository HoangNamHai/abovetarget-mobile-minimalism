import { CLERK_PUBLISHABLE_KEY, SENTRY_DSN, hasClerkKey, sentryEnabled } from '../env';

test('env exposes string defaults (empty when unset)', () => {
  expect(typeof CLERK_PUBLISHABLE_KEY).toBe('string');
  expect(typeof SENTRY_DSN).toBe('string');
});

test('hasClerkKey reflects whether a publishable key is set', () => {
  expect(hasClerkKey()).toBe(CLERK_PUBLISHABLE_KEY.length > 0);
});

test('sentryEnabled is false in dev/test regardless of DSN', () => {
  // __DEV__ is true under jest-expo, so Sentry must be disabled.
  expect(sentryEnabled()).toBe(false);
});
