// Decides where the paywall's close (✕) button should lead.
// From onboarding the reveal already completed onboarding, so closing must go
// FORWARD into the app (free tier) — never back to the reveal, which would loop.
export type PaywallCloseAction = { type: 'replaceHome' } | { type: 'back' };

export function paywallCloseAction(opts: { from?: string; canGoBack: boolean }): PaywallCloseAction {
  if (opts.from === 'onboarding') return { type: 'replaceHome' };
  return opts.canGoBack ? { type: 'back' } : { type: 'replaceHome' };
}
