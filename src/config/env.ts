// Centralized access to infra-related public env vars.
// EXPO_PUBLIC_* values are statically inlined at build time.

export const CLERK_PUBLISHABLE_KEY: string =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export const SENTRY_DSN: string = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

/** True when a Clerk publishable key is configured (else auth uses the stub). */
export function hasClerkKey(): boolean {
  return CLERK_PUBLISHABLE_KEY.length > 0;
}

/** Sentry only reports outside dev and only when a DSN is configured. */
export function sentryEnabled(): boolean {
  return !__DEV__ && SENTRY_DSN.length > 0;
}
