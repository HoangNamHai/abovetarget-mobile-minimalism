import { iconFor } from '../icon-map';

test('maps known portal symbols to MaterialIcons names', () => {
  expect(iconFor('schedule').name).toBe('schedule');
  expect(iconFor('arrow_forward').name).toBe('arrow-forward');
  expect(iconFor('trending_up').name).toBe('trending-up');
});

test('unknown symbol falls back to help-outline', () => {
  expect(iconFor('totally_made_up').name).toBe('help-outline');
});

test('maps takeaways quick-jump symbols to MaterialIcons names', () => {
  expect(iconFor('bolt').name).toBe('bolt');
  expect(iconFor('import_contacts').name).toBe('import-contacts');
  expect(iconFor('swap_horiz').name).toBe('swap-horiz');
  expect(iconFor('model_training').name).toBe('model-training');
});
