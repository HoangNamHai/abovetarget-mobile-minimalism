import { isPremiumGranted } from '../entitlement';

test('no active entitlement → never premium', () => {
  expect(
    isPremiumGranted({ entitlementActive: false, isSignedIn: true, authRequired: true }),
  ).toBe(false);
});

test('active entitlement + signed in → premium', () => {
  expect(
    isPremiumGranted({ entitlementActive: true, isSignedIn: true, authRequired: true }),
  ).toBe(true);
});

test('active entitlement but signed OUT → not premium (no anonymous premium)', () => {
  expect(
    isPremiumGranted({ entitlementActive: true, isSignedIn: false, authRequired: true }),
  ).toBe(false);
});

test('auth not configured → entitlement alone grants premium (no sign-in possible)', () => {
  // A build without Clerk has no notion of "signed in"; requiring it would make
  // the paid product unusable. Fall back to entitlement-only.
  expect(
    isPremiumGranted({ entitlementActive: true, isSignedIn: false, authRequired: false }),
  ).toBe(true);
});
