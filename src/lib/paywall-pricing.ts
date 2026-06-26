import type { PurchasesPackage } from 'react-native-purchases';

const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

/** A free trial exists only when the intro offer is genuinely $0. */
export function freeTrial(pkg: PurchasesPackage): { days: number } | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const days = (UNIT_DAYS[intro.periodUnit] ?? 0) * intro.periodNumberOfUnits;
  return days > 0 ? { days } : null;
}

/** "$0.00" CTA only when a real trial backs it (Apple 3.1.2). */
export function ctaLabel(pkg: PurchasesPackage | null | undefined): string {
  if (pkg && freeTrial(pkg)) return 'Start — $0.00 today';
  return 'Continue';
}

/** Localized per-month figure for annual plans only (the legible anchor). */
export function perMonthAnchor(pkg: PurchasesPackage): string | null {
  if (pkg.packageType !== 'ANNUAL') return null;
  return pkg.product.pricePerMonthString ?? null;
}

/** Auto-renew disclosure rendered adjacent to the CTA (Apple 3.1.2). */
export function disclosure(pkg: PurchasesPackage | null | undefined): string {
  if (!pkg) return 'Auto-renews until cancelled. Cancel anytime in Settings.';
  const price = pkg.product.priceString;
  const trial = freeTrial(pkg);
  const head = trial
    ? `${trial.days}-day free trial, then ${price}, `
    : `${price}, `;
  return `${head}auto-renews until cancelled. Cancel anytime in Settings.`;
}
