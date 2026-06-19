// ============================================
// RevenueCat Configuration
// ============================================

/**
 * Feature Flag: Disable RevenueCat for first store release.
 * When true:
 *   - RevenueCat SDK will NOT initialize (no API calls)
 *   - All users treated as premium (no paywalls, no limits)
 *   - Subscription UI hidden on profile screen
 *
 * To re-enable RevenueCat, set this to false.
 */
export const REVENUECAT_DISABLED = true;

/**
 * RevenueCat API Keys
 * Replace these placeholder values with your actual RevenueCat API keys
 * before App Store submission.
 */
export const REVENUECAT_API_KEYS = {
  // Test Store API key - works for both iOS and Android during development
  // Replace with production keys (appl_xxx, goog_xxx) before App Store release
  ios: 'test_MTgcqlwcATwVgTGtFSbyOlqlPtS',
  android: 'test_MTgcqlwcATwVgTGtFSbyOlqlPtS',
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
