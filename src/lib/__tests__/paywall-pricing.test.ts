import { freeTrial, ctaLabel, perMonthAnchor, disclosure, introOffer } from '../paywall-pricing';

function pkg(over: any = {}) {
  return {
    identifier: over.identifier ?? 'annual',
    packageType: over.packageType ?? 'ANNUAL',
    product: {
      identifier: 'prod',
      title: 'Yearly',
      priceString: over.priceString ?? '$59.99',
      pricePerMonthString: over.pricePerMonthString ?? '$5.00',
      currencyCode: 'USD',
      price: 59.99,
      introPrice: over.introPrice ?? null,
    },
  } as any;
}

const trial7 = { price: 0, priceString: '$0.00', cycles: 1, period: 'P1W', periodUnit: 'WEEK', periodNumberOfUnits: 1 };
// Paid intro: $39.99 for the first year (PAY_UP_FRONT), then standard price.
const intro1y = { price: 39.99, priceString: '$39.99', cycles: 1, period: 'P1Y', periodUnit: 'YEAR', periodNumberOfUnits: 1 };

test('introOffer returns the paid intro price + period', () => {
  expect(introOffer(pkg({ introPrice: intro1y }))).toEqual({ priceString: '$39.99', period: 'year' });
});

test('introOffer is null for a free trial (that is freeTrial, not a paid intro)', () => {
  expect(introOffer(pkg({ introPrice: trial7 }))).toBeNull();
});

test('introOffer is null when there is no intro', () => {
  expect(introOffer(pkg())).toBeNull();
  expect(introOffer(null)).toBeNull();
});

test('disclosure names a paid intro offer then the standard price', () => {
  const d = disclosure(pkg({ introPrice: intro1y }));
  expect(d).toContain('$39.99 for the first year');
  expect(d).toContain('then $59.99');
  expect(d).toContain('auto-renews');
});

test('freeTrial returns day count for a zero-price intro', () => {
  expect(freeTrial(pkg({ introPrice: trial7 }))).toEqual({ days: 7 });
});

test('freeTrial is null when intro price is non-zero', () => {
  expect(freeTrial(pkg({ introPrice: { ...trial7, price: 1.99 } }))).toBeNull();
});

test('freeTrial is null when there is no intro price', () => {
  expect(freeTrial(pkg())).toBeNull();
});

test('ctaLabel is the $0.00 trial CTA when a free trial exists', () => {
  expect(ctaLabel(pkg({ introPrice: trial7 }))).toBe('Start — $0.00 today');
});

test('ctaLabel is Continue without a trial or package', () => {
  expect(ctaLabel(pkg())).toBe('Continue');
  expect(ctaLabel(null)).toBe('Continue');
});

test('perMonthAnchor returns the localized per-month string only for annual', () => {
  expect(perMonthAnchor(pkg())).toBe('$5.00');
  expect(perMonthAnchor(pkg({ packageType: 'MONTHLY', pricePerMonthString: '$9.99' }))).toBeNull();
});

test('disclosure names trial length, price, period and auto-renew', () => {
  const d = disclosure(pkg({ introPrice: trial7 }));
  expect(d).toContain('7-day free trial');
  expect(d).toContain('$59.99');
  expect(d).toContain('auto-renews');
});

test('disclosure without a trial still names price + auto-renew', () => {
  const d = disclosure(pkg());
  expect(d).toContain('$59.99');
  expect(d).toContain('auto-renews');
  expect(d).not.toContain('free trial');
});
