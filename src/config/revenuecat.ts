// ============================================
// RevenueCat Configuration
// ============================================

import { REVENUECAT_ENABLED, IS_PRODUCTION_BUILD } from './env';

/**
 * Feature Flag: whether RevenueCat is live, driven by the env var
 * EXPO_PUBLIC_REVENUECAT_ENABLED (set per build profile in eas.json).
 *
 * Default is DISABLED (env unset → REVENUECAT_ENABLED false). While disabled:
 *   - RevenueCat SDK will NOT initialize (no API calls)
 *   - All users treated as premium (no paywalls, no limits)
 *   - Subscription/paywall UI hidden on the profile screen
 *
 * Enabled in development/preview profiles for sandbox/Test-Store testing.
 * Production stays disabled until store subscription products exist.
 */
export const REVENUECAT_DISABLED = !REVENUECAT_ENABLED;

/**
 * RevenueCat API Keys
 *
 * Currently the "PMP Exam Pro" RevenueCat project's **Test Store** public key
 * (project id 0a64724c). The Test Store works for both iOS and Android in dev
 * builds and needs no App Store / Play products, so the paywall + purchase flow
 * can be exercised end-to-end before store products exist.
 *
 * Keys are selected by build profile (Task 8 cutover, 2026-06-27): production
 * builds use the LIVE store keys (App Store / Play); dev & preview keep the Test
 * Store key so the paywall/purchase flow can be exercised without real billing.
 * A Test-Store key in a production build crashes the SDK, so the split is by
 * IS_PRODUCTION_BUILD (EXPO_PUBLIC_ENV === 'production'), flipped together with
 * EXPO_PUBLIC_REVENUECAT_ENABLED. See docs/monetization/pricing-and-revenuecat-config.md.
 */
const TEST_STORE_KEY = 'test_UFxNiXpKqWHIZlleFrlzORuIAgL';
const PRODUCTION_API_KEYS = {
  ios: 'appl_NymCurBoIwDypfVEFOMiENeOlxS', // App Store app appceb15304ed
  android: 'goog_dxWeLkyQEgvCQPuPTVaWTJHihGs', // Play Store app appf6471ce469
} as const;

export const REVENUECAT_API_KEYS = IS_PRODUCTION_BUILD
  ? PRODUCTION_API_KEYS
  : { ios: TEST_STORE_KEY, android: TEST_STORE_KEY };

/**
 * Entitlement Identifiers
 * These should match the entitlements configured in your RevenueCat dashboard.
 */
export const ENTITLEMENTS = {
  PRO: 'pro',
} as const;

/**
 * Offering Identifiers (the RevenueCat `default`/`current` offering is implicit).
 * WINBACK is a separate offering surfaced ONLY on the win-back screen — it carries
 * the discounted intro offer so the win-back is a genuinely different offer than the
 * main paywall (Apple 5.6). The paywall always uses the current/default offering.
 */
export const OFFERINGS = {
  WINBACK: 'winback',
} as const;

/**
 * Product Identifiers
 * These should match the product IDs configured in App Store Connect / Google Play Console.
 * Lineup mirrors the `default` offering (Weekly / Monthly / Annual / Lifetime — see src/config/pricing.ts).
 */
export const PRODUCTS = {
  WEEKLY: 'pmp_pro_weekly',
  MONTHLY: 'pmp_pro_monthly',
  ANNUAL: 'pmp_pro_annual',
  LIFETIME: 'pmp_pro_lifetime',
} as const;

/**
 * Daily Lesson Limit for Free Users
 */
export const FREE_DAILY_LESSON_LIMIT = 3;

/**
 * Storage Keys for Subscription Data
 * Note: IS_PREMIUM uses SecureStore (encrypted), others use AsyncStorage
 * SecureStore keys must not contain colons - using underscores instead
 */
export const SUBSCRIPTION_STORAGE_KEYS = {
  IS_PREMIUM: 'subscription_isPremium', // Stored in SecureStore (encrypted)
  CUSTOMER_INFO: 'subscription:customerInfo',
  LESSON_LIMIT: 'subscription:lessonLimit',
} as const;

/**
 * Full configuration object for convenience
 */
export const REVENUECAT_CONFIG = {
  apiKeys: REVENUECAT_API_KEYS,
  entitlements: ENTITLEMENTS,
  products: PRODUCTS,
  freeDailyLessonLimit: FREE_DAILY_LESSON_LIMIT,
  storageKeys: SUBSCRIPTION_STORAGE_KEYS,
} as const;

export default REVENUECAT_CONFIG;
