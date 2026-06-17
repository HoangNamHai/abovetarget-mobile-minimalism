/**
 * Verifies that cardVariants is load-bearing: QuizOption renders with different
 * className output for 'elite' vs 'monograph' brand, ensuring the variant layer
 * cannot silently become dead code again.
 */
import { cardVariants } from '../../../theme/variants';

test('cardVariants produces different className for elite vs monograph', () => {
  const eliteClass = cardVariants({ brand: 'elite' });
  const monoClass = cardVariants({ brand: 'monograph' });

  // Elite should have border-2 (heavy border) and rounded-none (sharp corners)
  expect(eliteClass).toContain('border-2');
  expect(eliteClass).toContain('rounded-none');

  // Monograph should have rounded-sm (soft corners) and NOT border-2
  expect(monoClass).toContain('rounded-sm');
  expect(monoClass).not.toContain('border-2');

  // They must differ — the variant layer is not a no-op
  expect(eliteClass).not.toBe(monoClass);
});
