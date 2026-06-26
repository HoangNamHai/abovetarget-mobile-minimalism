import { PRICING_TIERS, PAID_TIERS, tierForProductId } from '../pricing';

test('includes an annual tier mapped to the $rc_annual package', () => {
  const annual = PRICING_TIERS.find((t) => t.id === 'annual');
  expect(annual).toBeDefined();
  expect(annual?.packageId).toBe('$rc_annual');
  expect(annual?.productId).toBe('pmp_pro_annual');
  expect(annual?.highlighted).toBe(true);
});

test('paid tiers carry the live store product ids', () => {
  expect(PRICING_TIERS.find((t) => t.id === 'weekly')?.productId).toBe('pmp_pro_weekly');
  expect(PRICING_TIERS.find((t) => t.id === 'monthly')?.productId).toBe('pmp_pro_monthly');
  expect(PRICING_TIERS.find((t) => t.id === 'lifetime')?.productId).toBe('pmp_pro_lifetime');
});

test('tierForProductId resolves both live store ids and dev Test Store ids', () => {
  // Live App Store / Play product ids.
  expect(tierForProductId('pmp_pro_annual')?.id).toBe('annual');
  expect(tierForProductId('pmp_pro_monthly')?.id).toBe('monthly');
  expect(tierForProductId('pmp_pro_lifetime')?.id).toBe('lifetime');
  // Dev Test Store bare ids (annual is named "yearly" there).
  expect(tierForProductId('monthly')?.id).toBe('monthly');
  expect(tierForProductId('yearly')?.id).toBe('annual');
  expect(tierForProductId('weekly')?.id).toBe('weekly');
  // Unknown stays unresolved.
  expect(tierForProductId('some_unknown_sku')).toBeUndefined();
});

test('annual is the only highlighted paid tier', () => {
  const highlighted = PAID_TIERS.filter((t) => t.highlighted);
  expect(highlighted).toHaveLength(1);
  expect(highlighted[0].id).toBe('annual');
});
