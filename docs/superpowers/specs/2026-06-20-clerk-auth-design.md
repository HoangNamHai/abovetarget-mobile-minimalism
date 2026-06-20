# Clerk Auth (identity-only) — Design Spec

Date: 2026-06-20 · Branch: `feat/learning-ux-overhaul`

## Goal

Add a real sign-in / sign-up feature backed by Clerk. **Auth is required after
onboarding**: users complete onboarding, then must authenticate before reaching
the tabs. Scope is **identity-only** — Clerk establishes who the user is (account
display + a stable user id for future RevenueCat `logIn`). **No backend progress
sync** in this milestone; lesson progress stays in local SQLite/AsyncStorage
exactly as today. Cross-device progress sync is a separate, later project.

Sign-in methods: **Email + password**, **Google**, **Apple**.

## Context / what already exists

- `@clerk/clerk-expo@2.19.31` installed; `useSSO`, `useSignIn`, `useSignUp`,
  `useAuth`, `useUser` all available.
- `src/contexts/auth-context.tsx`: `ClerkGate` mounts `ClerkProvider` only when a
  publishable key is configured (else passthrough); `AuthProvider` exposes
  `{ isSignedIn, isLoading, user, signOut }` via `useAppAuth()`. A stub provider
  is used when no key is present.
- `src/services/infra/clerk-token-cache.ts`: SecureStore-backed token cache, wired.
- `src/config/env.ts`: `CLERK_PUBLISHABLE_KEY`, `hasClerkKey()`.
- Profile screen already renders Email + Sign Out when `isSignedIn`.
- Routing: `app/index.tsx` redirects on onboarding state only. Route groups
  `(onboarding)` and `(tabs)` exist; **no `(auth)` group yet**.
- App `scheme: pmp-exam-pro`; native iOS project present (dev client, not Expo Go).
- `expo-linking@56` and `expo-web-browser@56` present (`expo-crypto` is NOT —
  so we use `expo-linking` for the OAuth redirect, not `expo-auth-session`).

## Approach (chosen)

Custom native auth screens built on Clerk's **headless** Expo hooks, styled with
the monograph design system. (`@clerk/clerk-expo` has no drop-in UI components, so
screens are hand-built.) Thin screens delegate to two hooks + small shared
components, so the Clerk-coupled logic is isolated and the pure logic is testable.

## File layout

```
src/app/(auth)/
  _layout.tsx          # Stack, headerShown:false, background canvas
  sign-in.tsx          # email+password + social; links → sign-up, forgot
  sign-up.tsx          # email+password + social; link → sign-in
  verify-email.tsx     # 6-digit email code (Clerk sign-up requirement)
  forgot-password.tsx  # two-step: request reset code → set new password
src/components/auth/
  AuthScreenShell.tsx  # title/subtitle + monograph layout shell (Appear, padding)
  AuthTextField.tsx    # design-system text input (label, error, secure, a11y)
  SocialAuthButtons.tsx# "Continue with Apple/Google" → useSocialAuth
src/hooks/
  use-email-auth.ts    # wraps useSignIn/useSignUp: signIn, signUp, verify, reset
  use-social-auth.ts   # wraps useSSO for google/apple (redirect, setActive)
src/lib/auth/
  auth-route.ts        # resolveLandingRoute(...) pure gate logic (testable)
  clerk-errors.ts      # mapClerkError(err) → friendly string (testable)
```

## Routing & gating

`app/index.tsx` becomes a pure-function-driven redirect. New helper
`authRequired()` = `hasClerkKey()` (no key → auth disabled, preserving today's
behavior for tests / key-less dev so the app never traps on the auth screen).

```ts
resolveLandingRoute({
  onboardingLoading, authLoading, hasCompletedOnboarding, authRequired, isSignedIn,
}): string | null
// null (render splash/null) while:  onboardingLoading || (authRequired && authLoading)
// '/(onboarding)'        when:       !hasCompletedOnboarding
// '/(auth)/sign-in'      when:       authRequired && !isSignedIn
// '/(tabs)/home'         otherwise
```

`(auth)` screens are only ever mounted when `authRequired` is true, i.e. when
`ClerkProvider` is present — so Clerk hooks inside them always have a provider.

## Screens & UX

Shared: monograph styling (Anton headline, Hanken body, pill `Button`,
`TOKENS`/`RADIUS`, `Appear`, `PressableFeedback`); inline field errors mapped from
Clerk codes (never raw API text); submit shows loading + disables inputs;
`KeyboardAvoidingView`; email `autoCapitalize="none"` + `textContentType` for
iOS autofill; password `secureTextEntry`.

- **sign-in**: email + password → `signIn.create({ identifier, password })` →
  on `status==='complete'` `setActive`. Social buttons. Links: forgot, sign-up.
- **sign-up**: email + password → `signUp.create(...)` →
  `prepareEmailAddressVerification({ strategy: 'email_code' })` → push verify-email.
- **verify-email**: 6-digit code → `signUp.attemptEmailAddressVerification({ code })`
  → `setActive`. "Resend code" re-prepares. (Clerk keeps the in-progress signUp
  resource across screens via `useSignUp()`, so no params threading needed.)
- **forgot-password** (modular, cuttable): step 1 email →
  `signIn.create({ strategy: 'reset_password_email_code', identifier })`; step 2
  code + new password → `signIn.attemptFirstFactor({ strategy:
  'reset_password_email_code', code, password })` → `setActive`.

## OAuth (Google / Apple)

`use-social-auth.ts`:

```ts
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSSO } from '@clerk/clerk-expo';

WebBrowser.maybeCompleteAuthSession();            // module scope
// warm up / cool down browser in a useEffect (perf)

const { startSSOFlow } = useSSO();
const { createdSessionId, setActive } = await startSSOFlow({
  strategy,                                        // 'oauth_google' | 'oauth_apple'
  redirectUrl: Linking.createURL('sso-callback'), // pmp-exam-pro://sso-callback
});
if (createdSessionId) await setActive({ session: createdSessionId });
```

Apple: offering Sign in with Apple satisfies App Store guideline 4.8 (required
alongside Google). We use Clerk's `oauth_apple` web flow for now; a fully native
`expo-apple-authentication` upgrade is possible later but out of scope.

## Sign-out

Already implemented on Profile (`useAppAuth().signOut`). After sign-out,
`isSignedIn` flips false and the gate redirects to `/(auth)/sign-in` on next
landing. No change needed beyond confirming the redirect.

## Error handling

`mapClerkError(err)` reads Clerk's `errors[0].code` / `longMessage` and returns a
short, human string for known cases (invalid credentials, taken email, incorrect
code, weak/pwned password, network). Unknown → generic fallback. Screens show it
inline; never surface raw Clerk payloads.

## RevenueCat seam (future, not built now)

When RevenueCat is enabled later, call `Purchases.logIn(user.id)` on sign-in and
`Purchases.logOut()` on sign-out so entitlements tie to the Clerk user. Noted here
as the integration point; not implemented in this milestone (RevenueCat is
currently disabled).

## Testing

- Unit (pure, no Clerk needed): `resolveLandingRoute` truth table (loading,
  onboarding-incomplete, auth-required-not-signed-in, signed-in, no-key bypass);
  `mapClerkError` for each known code + fallback.
- Existing suites must stay green: with no Clerk key in jest, `authRequired` is
  false → gate behaves exactly as today; `(auth)` screens are not mounted, so no
  ClerkProvider is required in tests.
- Clerk-bound screens are not unit-tested against the live SDK (needs keys); they
  stay thin so the logic under test lives in the pure modules + hooks.

## Prerequisites (manual, outside code)

1. Clerk dashboard: enable **Email/Password** with email-code verification, and
   **Google** + **Apple** social connections. For production, supply own Google
   OAuth credentials and Apple Services ID; Clerk shared dev creds work in dev.
2. Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to `.env` (and EAS env). Until set,
   `authRequired()` is false and the app runs key-less (no auth gate) — useful for
   continued local testing.
3. Native: redirect uses the existing `pmp-exam-pro` scheme; no new native module
   added (we avoid `expo-crypto`/`expo-auth-session`). A dev-client rebuild is only
   needed if Clerk’s native deps require it; the JS integration ships via OTA-safe
   packages already present.

## Out of scope

Backend progress sync; account-management UI beyond Sign Out; MFA; org/teams;
native Apple `ASAuthorization`; RevenueCat wiring (separate milestone).
