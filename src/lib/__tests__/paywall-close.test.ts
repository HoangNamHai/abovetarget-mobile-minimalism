import { paywallCloseAction } from '../paywall-close';

test('an explicit next destination wins when offer already shown', () => {
  expect(paywallCloseAction({ from: 'onboarding', next: '/lesson/A1L1', canGoBack: true, offerShown: true }))
    .toEqual({ type: 'replace', href: '/lesson/A1L1' });
});

test('first onboarding dismiss routes to the win-back offer', () => {
  const action = paywallCloseAction({
    from: 'onboarding', next: '/lesson/intro', canGoBack: true, offerShown: false,
  });
  expect(action).toEqual({ type: 'replace', href: '/win-back?next=%2Flesson%2Fintro' });
});

test('after the offer was shown, onboarding dismiss goes forward to next', () => {
  const action = paywallCloseAction({
    from: 'onboarding', next: '/lesson/intro', canGoBack: true, offerShown: true,
  });
  expect(action).toEqual({ type: 'replace', href: '/lesson/intro' });
});

test('non-onboarding dismiss is unchanged by offerShown', () => {
  expect(paywallCloseAction({ next: '/x', canGoBack: true, offerShown: false }))
    .toEqual({ type: 'replace', href: '/x' });
});

test('closing from onboarding without a next (offer not shown) routes to win-back with no query', () => {
  expect(paywallCloseAction({ from: 'onboarding', canGoBack: true })).toEqual({ type: 'replace', href: '/win-back' });
  expect(paywallCloseAction({ from: 'onboarding', canGoBack: false })).toEqual({ type: 'replace', href: '/win-back' });
});

test('closing from onboarding without a next (offer shown) continues into the app (free tier)', () => {
  expect(paywallCloseAction({ from: 'onboarding', canGoBack: true, offerShown: true })).toEqual({ type: 'replace', href: '/' });
  expect(paywallCloseAction({ from: 'onboarding', canGoBack: false, offerShown: true })).toEqual({ type: 'replace', href: '/' });
});

test('premium close from onboarding goes forward to next, NOT the win-back offer', () => {
  expect(paywallCloseAction({
    from: 'onboarding', next: '/lesson/intro', canGoBack: true, offerShown: false, isPremium: true,
  })).toEqual({ type: 'replace', href: '/lesson/intro' });
});

test('premium close from onboarding with no next continues into the app, NOT the win-back offer', () => {
  expect(paywallCloseAction({
    from: 'onboarding', canGoBack: true, offerShown: false, isPremium: true,
  })).toEqual({ type: 'replace', href: '/' });
});

test('non-premium first onboarding dismiss still routes to the win-back offer (guard regression)', () => {
  expect(paywallCloseAction({
    from: 'onboarding', next: '/lesson/intro', canGoBack: true, offerShown: false, isPremium: false,
  })).toEqual({ type: 'replace', href: '/win-back?next=%2Flesson%2Fintro' });
});

test('closing elsewhere goes back when possible, else home', () => {
  expect(paywallCloseAction({ canGoBack: true })).toEqual({ type: 'back' });
  expect(paywallCloseAction({ canGoBack: false })).toEqual({ type: 'replace', href: '/' });
});
