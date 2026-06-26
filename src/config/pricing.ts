// ============================================
// Pricing tiers — PRESENTATION source of truth (order, features, badges, CTA).
// ============================================
//
// PRICES ARE NOT AUTHORITATIVE HERE. The live, localized amount a user is charged
// for each paid tier comes from RevenueCat at runtime
// (`package.product.priceString`), which mirrors App Store Connect / Google Play.
// Set the real price ONCE in the stores; RevenueCat and the app inherit it — no
// app release needed to change a price or swap which packages are shown.
//
// `fallbackPrice` / `fallbackPeriod` are a non-authoritative placeholder used ONLY
// when offerings fail to load (offline / first paint). Always prefer the RevenueCat
// value when a package is available — see `displayPrice()` below.
//
// RevenueCat mapping (project "PMP Exam Pro" 0a64724c, `default` offering):
//   weekly   → package `$rc_weekly`   → product `pmp_pro_weekly`
//   monthly  → package `$rc_monthly`  → product `pmp_pro_monthly`
//   annual   → package `$rc_annual`   → product `pmp_pro_annual`
//   lifetime → package `$rc_lifetime` → product `pmp_pro_lifetime`
// `productId` holds the LIVE App Store / Play product id. The dev Test Store still
// uses bare ids (weekly/monthly/yearly/lifetime) — `tierForProductId` tolerates both.

import type { PurchasesPackage } from 'react-native-purchases';

export type PricingTierId = 'free' | 'weekly' | 'monthly' | 'annual' | 'lifetime';

export interface PricingTier {
  id: PricingTierId;
  name: string;
  /** Optional ribbon, e.g. "Best Value". */
  badge?: string;
  /** Visually emphasized tier (the recommended plan). */
  highlighted?: boolean;
  /** Feature bullets shown under the tier. */
  features: string[];
  /** Call-to-action label. */
  cta: string;
  /** RevenueCat package identifier within the `default` offering. Absent for the free tier. */
  packageId?: string;
  /** RevenueCat / store product identifier. Absent for the free tier. */
  productId?: string;
  /** NON-AUTHORITATIVE display fallback only (offline / before offerings load). */
  fallbackPrice?: string;
  /** Period suffix for the fallback price, e.g. "/week", "/month", "one-time", "forever". */
  fallbackPeriod?: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    cta: 'Get Started',
    fallbackPrice: '$0',
    fallbackPeriod: 'forever',
    features: [
      'Path A: Free Foundation lessons',
      'Interactive micro-lessons',
      'Comic-strip story hooks',
      'Practice questions',
      'Progress tracking',
    ],
  },
  {
    id: 'weekly',
    name: 'Weekly',
    cta: 'Upgrade',
    packageId: '$rc_weekly',
    productId: 'pmp_pro_weekly',
    fallbackPrice: '$6',
    fallbackPeriod: '/week',
    features: [
      'All lessons unlocked',
      'All learning paths',
      'Flexible weekly billing',
      'Cancel anytime',
    ],
  },
  {
    id: 'annual',
    name: 'Yearly',
    badge: 'Best Value',
    highlighted: true,
    cta: 'Upgrade',
    packageId: '$rc_annual',
    productId: 'pmp_pro_annual',
    fallbackPrice: '$59.99',
    fallbackPeriod: '/year',
    features: [
      'All lessons unlocked',
      'All learning paths',
      'Best price — billed yearly',
      'Cancel anytime',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly',
    cta: 'Upgrade',
    packageId: '$rc_monthly',
    productId: 'pmp_pro_monthly',
    fallbackPrice: '$18',
    fallbackPeriod: '/month',
    features: [
      'Everything in Weekly',
      'Best price per month',
      'Advanced question types',
      'Priority support',
      'Cancel anytime',
    ],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    cta: 'Upgrade',
    packageId: '$rc_lifetime',
    productId: 'pmp_pro_lifetime',
    fallbackPrice: '$99',
    fallbackPeriod: 'one-time',
    features: [
      'Everything in Monthly',
      'One-time payment',
      'Lifetime access',
      'All future updates',
    ],
  },
];

/** Paid tiers only (everything except Free) — what the paywall sells. */
export const PAID_TIERS = PRICING_TIERS.filter((t) => t.id !== 'free');

/** Look up a tier by its RevenueCat package id (e.g. a fetched `PurchasesPackage`). */
export function tierForPackage(pkg: PurchasesPackage): PricingTier | undefined {
  return PRICING_TIERS.find(
    (t) => t.packageId === pkg.identifier || t.productId === pkg.product.identifier,
  );
}

/**
 * Look up a tier by a bare store/RevenueCat product identifier. Use when only the
 * product id is available — e.g. `CustomerInfo.entitlements.active[...].productIdentifier`
 * — and there's no full `PurchasesPackage` to match against.
 */
export function tierForProductId(productId: string): PricingTier | undefined {
  if (!productId) return undefined;
  return PRICING_TIERS.find(
    (t) =>
      // Live App Store / Play product id (e.g. "pmp_pro_annual").
      t.productId === productId ||
      // Dev Test Store bare ids (e.g. "monthly", "lifetime").
      t.id === productId ||
      // Test Store names annual "yearly", but our tier id is "annual".
      (t.id === 'annual' && productId === 'yearly'),
  );
}

/**
 * Resolve the price to show for a tier. Prefers the live, localized RevenueCat
 * price (`product.priceString`); falls back to the static placeholder only when no
 * package is available (offline / before offerings load).
 */
export function displayPrice(tier: PricingTier, pkg?: PurchasesPackage | null): string {
  return pkg?.product?.priceString ?? tier.fallbackPrice ?? '';
}

export default PRICING_TIERS;
