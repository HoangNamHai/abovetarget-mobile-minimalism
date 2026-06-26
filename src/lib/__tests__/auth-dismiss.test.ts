import { authDismissAction } from '../auth-dismiss';

test('dismiss goes back when there is something to pop (e.g. the paywall, Profile)', () => {
  expect(authDismissAction({ canGoBack: true })).toEqual({ type: 'back' });
});

test('dismiss falls back to the app home when the auth screen is the navigation root', () => {
  expect(authDismissAction({ canGoBack: false })).toEqual({ type: 'replace', href: '/' });
});
