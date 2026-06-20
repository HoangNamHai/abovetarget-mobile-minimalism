import { RADIUS, TOKENS } from '../tokens';

test('exposes the portal monochrome palette verbatim', () => {
  expect(TOKENS.background).toBe('#f9f9f9');
  expect(TOKENS['on-background']).toBe('#1a1c1c');
  expect(TOKENS.primary).toBe('#000000');
  expect(TOKENS['surface-container-low']).toBe('#f3f3f3');
  expect(TOKENS['outline-variant']).toBe('#cfc4c5');
});

test('exposes the canonical border-radius scale (docs/design-system.md §4)', () => {
  expect(RADIUS).toEqual({ card: 4, media: 8, sheet: 16, pill: 999, track: 3 });
});
