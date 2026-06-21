import { resolvePlanStatus, type ActiveEntitlementSnapshot } from '../plan-status';

const ent = (over: Partial<ActiveEntitlementSnapshot> = {}): ActiveEntitlementSnapshot => ({
  productIdentifier: 'monthly',
  periodType: 'NORMAL',
  willRenew: true,
  expirationDate: '2026-08-12T00:00:00Z',
  ...over,
});

test('RevenueCat disabled → Full Access (the unrestricted default/dev state)', () => {
  expect(resolvePlanStatus({ disabled: true, isPremium: true, entitlement: null })).toEqual({
    label: 'Full Access',
    tone: 'premium',
  });
});

test('not premium → Free', () => {
  expect(resolvePlanStatus({ disabled: false, isPremium: false, entitlement: null })).toEqual({
    label: 'Free',
    tone: 'free',
  });
});

test('active auto-renewing subscription → tier name, no detail', () => {
  expect(
    resolvePlanStatus({ disabled: false, isPremium: true, entitlement: ent({ willRenew: true }) }),
  ).toEqual({ label: 'Monthly', tone: 'premium' });
});

test('trial period → "Free trial" detail', () => {
  expect(
    resolvePlanStatus({ disabled: false, isPremium: true, entitlement: ent({ periodType: 'TRIAL' }) }),
  ).toEqual({ label: 'Monthly', detail: 'Free trial', tone: 'premium' });
});

test('canceled-but-active subscription → "Expires <date>" detail', () => {
  expect(
    resolvePlanStatus({
      disabled: false,
      isPremium: true,
      entitlement: ent({ willRenew: false, expirationDate: '2026-08-12T10:30:00Z' }),
    }),
  ).toEqual({ label: 'Monthly', detail: 'Expires 12 Aug 2026', tone: 'premium' });
});

test('lifetime never shows an expiry, even if willRenew is false', () => {
  expect(
    resolvePlanStatus({
      disabled: false,
      isPremium: true,
      entitlement: ent({
        productIdentifier: 'lifetime',
        willRenew: false,
        expirationDate: '2026-08-12T00:00:00Z',
      }),
    }),
  ).toEqual({ label: 'Lifetime', tone: 'premium' });
});

test('premium but entitlement unreadable (offline) → generic Premium', () => {
  expect(resolvePlanStatus({ disabled: false, isPremium: true, entitlement: null })).toEqual({
    label: 'Premium',
    tone: 'premium',
  });
});

test('premium with an unmapped product id → generic Premium', () => {
  expect(
    resolvePlanStatus({
      disabled: false,
      isPremium: true,
      entitlement: ent({ productIdentifier: 'some_unknown_sku' }),
    }),
  ).toEqual({ label: 'Premium', tone: 'premium' });
});

test('a malformed expiration date is ignored rather than rendered', () => {
  expect(
    resolvePlanStatus({
      disabled: false,
      isPremium: true,
      entitlement: ent({ willRenew: false, expirationDate: 'not-a-date' }),
    }),
  ).toEqual({ label: 'Monthly', tone: 'premium' });
});
