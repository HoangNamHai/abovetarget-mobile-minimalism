// Decides where the paywall's close (✕) button should lead.
// From onboarding the reveal already completed onboarding, so closing must go
// FORWARD — never back to the reveal. The FIRST onboarding dismiss is routed to a
// single, exitable win-back offer (App Store 5.6: shown once, never an instant
// re-pop). After the offer, dismiss proceeds to `next` (the first lesson) or home.
export type PaywallCloseAction = { type: 'replace'; href: string } | { type: 'back' };

export function paywallCloseAction(opts: {
  from?: string;
  next?: string;
  canGoBack: boolean;
  offerShown?: boolean;
}): PaywallCloseAction {
  if (opts.from === 'onboarding' && !opts.offerShown) {
    const q = opts.next ? `?next=${encodeURIComponent(opts.next)}` : '';
    return { type: 'replace', href: `/win-back${q}` };
  }
  if (opts.next) return { type: 'replace', href: opts.next };
  if (opts.from === 'onboarding') return { type: 'replace', href: '/' };
  return opts.canGoBack ? { type: 'back' } : { type: 'replace', href: '/' };
}
