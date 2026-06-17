import { TOKENS } from '../tokens';

test('exposes the portal monochrome palette verbatim', () => {
  expect(TOKENS.background).toBe('#f9f9f9');
  expect(TOKENS['on-background']).toBe('#1a1c1c');
  expect(TOKENS.primary).toBe('#000000');
  expect(TOKENS['surface-container-low']).toBe('#f3f3f3');
  expect(TOKENS['outline-variant']).toBe('#cfc4c5');
});
