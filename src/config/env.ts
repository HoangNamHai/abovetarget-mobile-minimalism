// Centralized access to infra-related public env vars.
// EXPO_PUBLIC_* values are statically inlined at build time.

export const CLERK_PUBLISHABLE_KEY: string =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export const SENTRY_DSN: string = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

/**
 * Whether RevenueCat is live. Off by default so production keeps treating every
 * user as premium (no paywalls, no SDK calls) until store subscription products
 * exist. Enabled per build profile (development/preview) via eas.json.
 */
export const REVENUECAT_ENABLED: boolean =
  process.env.EXPO_PUBLIC_REVENUECAT_ENABLED === 'true';

/** True when a Clerk publishable key is configured (else auth uses the stub). */
export function hasClerkKey(): boolean {
  return CLERK_PUBLISHABLE_KEY.length > 0;
}

/**
 * Whether the auth gate is enforced. Tied to Clerk being configured: with no
 * key, the app runs key-less (no sign-in required) so local/CI flows are
 * unaffected and the app never traps on the auth screen.
 */
export function authRequired(): boolean {
  return hasClerkKey();
}

/** Sentry only reports outside dev and only when a DSN is configured. */
export function sentryEnabled(): boolean {
  return !__DEV__ && SENTRY_DSN.length > 0;
}
