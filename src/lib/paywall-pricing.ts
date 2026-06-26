import type { PurchasesPackage } from 'react-native-purchases';

const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };
const UNIT_LABEL: Record<string, string> = { DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' };

/** Human label for an intro period, e.g. "year", "3 months". */
function periodLabel(unit: string, count: number): string {
  const base = UNIT_LABEL[unit] ?? 'period';
  return count === 1 ? base : `${count} ${base}s`;
}

/** A free trial exists only when the intro offer is genuinely $0. */
export function freeTrial(pkg: PurchasesPackage): { days: number } | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const days = (UNIT_DAYS[intro.periodUnit] ?? 0) * intro.periodNumberOfUnits;
  return days > 0 ? { days } : null;
}

/**
 * A PAID introductory offer (discounted first period, e.g. "$39.99 for the first
 * year") — distinct from a free trial (`freeTrial`, which is $0). Used by the
 * win-back screen to present a genuinely different, discounted offer (Apple 5.6).
 */
export function introOffer(
  pkg: PurchasesPackage | null | undefined,
): { priceString: string; period: string } | null {
  const intro = pkg?.product.introPrice;
  if (!intro || intro.price <= 0) return null;
  return {
    priceString: intro.priceString,
    period: periodLabel(intro.periodUnit, intro.periodNumberOfUnits),
  };
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
  const intro = trial ? null : introOffer(pkg);
  let head: string;
  if (trial) head = `${trial.days}-day free trial, then ${price}, `;
  else if (intro) head = `${intro.priceString} for the first ${intro.period}, then ${price}, `;
  else head = `${price}, `;
  return `${head}auto-renews until cancelled. Cancel anytime in Settings.`;
}
