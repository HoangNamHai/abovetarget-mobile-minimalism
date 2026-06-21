import { paywallCloseAction } from '../paywall-close';

test('an explicit next destination always wins', () => {
  expect(paywallCloseAction({ from: 'onboarding', next: '/lesson/A1L1', canGoBack: true }))
    .toEqual({ type: 'replace', href: '/lesson/A1L1' });
});

test('closing from onboarding without a next continues into the app (free tier)', () => {
  expect(paywallCloseAction({ from: 'onboarding', canGoBack: true })).toEqual({ type: 'replace', href: '/' });
  expect(paywallCloseAction({ from: 'onboarding', canGoBack: false })).toEqual({ type: 'replace', href: '/' });
});

test('closing elsewhere goes back when possible, else home', () => {
  expect(paywallCloseAction({ canGoBack: true })).toEqual({ type: 'back' });
  expect(paywallCloseAction({ canGoBack: false })).toEqual({ type: 'replace', href: '/' });
});
