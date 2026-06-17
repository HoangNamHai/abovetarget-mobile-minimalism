import { iconFor } from '../icon-map';

test('maps known portal symbols to MaterialIcons names', () => {
  expect(iconFor('schedule').name).toBe('schedule');
  expect(iconFor('arrow_forward').name).toBe('arrow-forward');
  expect(iconFor('trending_up').name).toBe('trending-up');
});

test('unknown symbol falls back to help-outline', () => {
  expect(iconFor('totally_made_up').name).toBe('help-outline');
});
