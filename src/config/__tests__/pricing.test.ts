import { PRICING_TIERS, PAID_TIERS } from '../pricing';

test('includes an annual tier mapped to the $rc_annual package', () => {
  const annual = PRICING_TIERS.find((t) => t.id === 'annual');
  expect(annual).toBeDefined();
  expect(annual?.packageId).toBe('$rc_annual');
  expect(annual?.productId).toBe('annual');
  expect(annual?.highlighted).toBe(true);
});

test('annual is the only highlighted paid tier', () => {
  const highlighted = PAID_TIERS.filter((t) => t.highlighted);
  expect(highlighted).toHaveLength(1);
  expect(highlighted[0].id).toBe('annual');
});
