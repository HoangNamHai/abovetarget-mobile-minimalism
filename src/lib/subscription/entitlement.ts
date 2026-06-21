// Pure rule for whether a RevenueCat entitlement actually grants premium access.
// This app does NOT support anonymous premium: a purchase only counts while the
// user is signed in, so entitlements follow the account, not the device.

export interface PremiumGateInput {
  /** Whether RevenueCat reports the `pro` entitlement active for the current customer. */
  entitlementActive: boolean;
  /** Whether the user is signed into an account (Clerk). */
  isSignedIn: boolean;
  /** Whether sign-in is available/enforced (Clerk configured). */
  authRequired: boolean;
}

/**
 * Grant premium only when the entitlement is active AND the user is signed in.
 * When auth isn't configured at all (`authRequired === false`) there's no sign-in
 * to require, so the entitlement alone grants access — otherwise a non-Clerk build
 * could never unlock premium.
 */
export function isPremiumGranted({
  entitlementActive,
  isSignedIn,
  authRequired,
}: PremiumGateInput): boolean {
  if (!entitlementActive) return false;
  if (authRequired && !isSignedIn) return false;
  return true;
}
