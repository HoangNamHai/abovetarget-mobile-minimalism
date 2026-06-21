import { paywallCloseAction } from '../paywall-close';

test('closing from onboarding always continues into the app (free tier)', () => {
  expect(paywallCloseAction({ from: 'onboarding', canGoBack: true })).toEqual({ type: 'replaceHome' });
  expect(paywallCloseAction({ from: 'onboarding', canGoBack: false })).toEqual({ type: 'replaceHome' });
});

test('closing elsewhere goes back when possible, else home', () => {
  expect(paywallCloseAction({ canGoBack: true })).toEqual({ type: 'back' });
  expect(paywallCloseAction({ canGoBack: false })).toEqual({ type: 'replaceHome' });
});
