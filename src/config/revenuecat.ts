// ============================================
// RevenueCat Configuration
// ============================================

import { REVENUECAT_ENABLED } from './env';

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
 * Before App Store / Play release, swap these for the production platform keys
 * (appl_xxx for iOS, goog_xxx for Android) from the same project's API keys page.
 */
export const REVENUECAT_API_KEYS = {
  ios: 'test_UFxNiXpKqWHIZlleFrlzORuIAgL',
  android: 'test_UFxNiXpKqWHIZlleFrlzORuIAgL',
} as const;

/**
 * Entitlement Identifiers
 * These should match the entitlements configured in your RevenueCat dashboard.
 */
export const ENTITLEMENTS = {
  PRO: 'pro',
} as const;

/**
 * Product Identifiers
 * These should match the product IDs configured in App Store Connect / Google Play Console.
 */
export const PRODUCTS = {
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
