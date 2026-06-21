// Pure mapping from RevenueCat entitlement state → the "Plan" row shown on the
// Profile screen. Kept free of React/RN so it can be unit-tested in isolation and
// is the single source of truth for how a subscription is labelled.

import { tierForProductId } from '../../config/pricing';

/** The minimal slice of a RevenueCat `EntitlementInfo` we need to label a plan. */
export interface ActiveEntitlementSnapshot {
  /** Store/RevenueCat product id of the active entitlement (e.g. "monthly"). */
  productIdentifier: string;
  /** 'NORMAL' | 'INTRO' | 'TRIAL' — RevenueCat's PERIOD_TYPE. */
  periodType: string;
  /** Whether the subscription will auto-renew. False once the user cancels. */
  willRenew: boolean;
  /** ISO expiry timestamp, or null for non-expiring entitlements (e.g. lifetime). */
  expirationDate: string | null;
}

export interface PlanStatus {
  /** Primary badge text, e.g. "Free", "Monthly", "Lifetime", "Premium", "Full Access". */
  label: string;
  /** Optional secondary line, e.g. "Free trial" or "Expires 12 Aug 2026". */
  detail?: string;
  /** Drives the badge colour: muted for free, accent for premium. */
  tone: 'free' | 'premium';
}

export interface PlanStatusInput {
  /** RevenueCat is off — every user has unrestricted access, no real package. */
  disabled: boolean;
  isPremium: boolean;
  /** Active entitlement details, or null when premium state can't be read. */
  entitlement: ActiveEntitlementSnapshot | null;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Format an ISO timestamp as "12 Aug 2026" (UTC, locale-independent). Null if unparseable. */
function formatExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Resolve the Profile "Plan" row from subscription state.
 *
 * Precedence: disabled (Full Access) → not premium (Free) → premium (tier name,
 * with a trial / expiry detail). Falls back to a generic "Premium" when the
 * entitlement can't be read or the product id isn't in our tier table.
 */
export function resolvePlanStatus({ disabled, isPremium, entitlement }: PlanStatusInput): PlanStatus {
  if (disabled) return { label: 'Full Access', tone: 'premium' };
  if (!isPremium) return { label: 'Free', tone: 'free' };
  if (!entitlement) return { label: 'Premium', tone: 'premium' };

  const tier = tierForProductId(entitlement.productIdentifier);
  const label = tier?.name ?? 'Premium';

  let detail: string | undefined;
  if (entitlement.periodType === 'TRIAL') {
    detail = 'Free trial';
  } else if (tier?.id !== 'lifetime' && !entitlement.willRenew) {
    const expiry = formatExpiry(entitlement.expirationDate);
    if (expiry) detail = `Expires ${expiry}`;
  }

  return detail ? { label, detail, tone: 'premium' } : { label, tone: 'premium' };
}
