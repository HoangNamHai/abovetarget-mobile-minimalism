// Decides where the paywall's close (✕) button should lead.
// From onboarding the reveal already completed onboarding, so closing must go
// FORWARD — to an explicit `next` destination when given (e.g. the first lesson
// of the chosen domain), otherwise into the app — never back to the reveal.
export type PaywallCloseAction = { type: 'replace'; href: string } | { type: 'back' };

export function paywallCloseAction(opts: {
  from?: string;
  next?: string;
  canGoBack: boolean;
}): PaywallCloseAction {
  if (opts.next) return { type: 'replace', href: opts.next };
  if (opts.from === 'onboarding') return { type: 'replace', href: '/' };
  return opts.canGoBack ? { type: 'back' } : { type: 'replace', href: '/' };
}
