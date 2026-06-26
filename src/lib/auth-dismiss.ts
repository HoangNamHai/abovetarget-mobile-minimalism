// Decides where the dismiss (✕) on an (auth) screen should lead. Signing in is
// always optional — anonymous use is fully supported — so every auth screen must
// offer an exit: go back to wherever the user came from (e.g. the paywall, the
// Profile tab), or fall back to the app home when there's nothing to pop.
export type AuthDismissAction = { type: 'back' } | { type: 'replace'; href: string };

export function authDismissAction(opts: { canGoBack: boolean }): AuthDismissAction {
  return opts.canGoBack ? { type: 'back' } : { type: 'replace', href: '/' };
}
