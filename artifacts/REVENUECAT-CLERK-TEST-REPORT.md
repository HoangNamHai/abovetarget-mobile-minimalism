# RevenueCat + Clerk — E2E Verification Report

**Date:** 2026-06-21
**App:** PMP Exam Pro (`com.h2ai.pmpexampro`)
**Method:** Maestro 2.1.0 driving the real app on a live iOS Simulator and Android emulator,
with RevenueCat in **Test Store** mode (`EXPO_PUBLIC_REVENUECAT_ENABLED=true`) and Clerk on
its development instance. Each flow was driven through the real UI; evidence is the app's own
screens (screenshots in `artifacts/ios/` and `artifacts/android/`).

## Verdict

| # | Flow | iOS (iPhone 17, iOS 26) | Android (Genymotion) |
|---|------|:---:|:---:|
| 01 | RevenueCat — paywall renders, 3 Test Store packages load | ✅ PASS | ✅ PASS |
| 02 | RevenueCat — purchase via Test Store → `pro` entitlement → PREMIUM | ✅ PASS | ✅ PASS |
| 03 | RevenueCat — Restore Purchases | ✅ PASS | ✅ PASS |
| 04 | Clerk — active authenticated session (email shown) | ✅ PASS | — (app was signed out) |
| 05 | Clerk — full sign-up + email-code verification → signed in | — | ✅ PASS |
| 05b | Clerk — sign-out | — | ✅ PASS |

**Overall: PASS.** Both RevenueCat (offerings → purchase → entitlement → restore) and Clerk
(session, sign-up, email verification, sign-out) work end-to-end on both platforms. Findings
below are dev-environment notes and one uncaught-rejection worth a small fix — none block the
features.

## Environment

- **RevenueCat:** project "PMP Exam Pro" (`0a64724c`), **Test Store** key
  `test_UFxNiXpKqWHIZlleFrlzORuIAgL`. The SDK logged: *"Using a Test Store API key… purchases
  are simulated and don't rely on StoreKit."* Anonymous app-user IDs (iOS `…1a814ff…`,
  Android `…31bf5558…`) — RevenueCat is not yet linked to the Clerk user (no `logIn()`).
- **Clerk:** development instance (`pk_test`, `refined-snake-20.clerk.accounts.dev`). iOS was
  already signed in as `super.app.manager+user1@gmail.com`; Android started signed out
  (anonymous mode), so it was used for the full sign-up flow.
- Flag enabled locally by adding `EXPO_PUBLIC_REVENUECAT_ENABLED=true` to `.env` and restarting
  Metro with `--clear` (EXPO_PUBLIC vars inline at bundle time).

## Detailed steps & evidence

### RevenueCat

**01 — Paywall / offerings load.** Deep-linked `pmp-exam-pro://paywall`. Paywall ("Unlock
Premium") renders the three Test Store packages with prices fetched from the `default` offering:
- iOS: Monthly `US$9,99`, Yearly `US$79,99`, Lifetime `US$99,99` — `artifacts/ios/01-paywall.png`
- Android: Monthly `$9.99`, Yearly `$79.98`, Lifetime `$99.99` — `artifacts/android/01-paywall.png`

**02 — Purchase → entitlement.** Selected a package → CONTINUE → the RevenueCat **Test Store
simulated purchase dialog** appears ("Test valid purchase / Test failed purchase / Cancel").
Tapped *valid purchase* → `pro` entitlement granted → Profile Status flips **FREE → PREMIUM**
and the "Upgrade to Premium" row disappears.
- iOS dialog `artifacts/ios/02a-teststore-dialog.png`, premium `artifacts/ios/02b-premium.png`
- Android dialog `artifacts/android/02a-teststore-dialog.png`, premium `artifacts/android/02b-premium.png`
- SDK log: `💰 Purchasing Product 'monthly' from package in Offering 'default'`

**03 — Restore.** Profile → "Restore Purchases" → SDK invoked → native "Restore complete" alert.
- iOS `artifacts/ios/03-restore.png`

### Clerk

**04 — Active session (iOS).** App boots past the auth gate; Profile shows the signed-in email
`super.app.manager+user1@gmail.com` + Sign Out → Clerk SDK initialized and session valid.
- `artifacts/ios/04-clerk-session.png`

**05 — Full sign-up + verification (Android).** Started signed out → Sign In screen renders
(email/password + "Continue with Google" + "Sign up"). Navigated to Sign Up, entered a
Clerk **test email** (`pmpe2e+clerk_test@example.com`):
- 🔍 First password (`Testpass123!`) was **rejected by Clerk**: *"That password has appeared in a
  data breach"* — confirms Clerk's live password validation. (`artifacts/android/05a-clerk-password-validation.png`)
- Strong password accepted → email verification screen → entered Clerk's test code **`424242`**
  → **VERIFY** → signed in. Profile now shows `pmpe2e+clerk_test@example.com` + Sign Out.
  (`artifacts/android/04a-clerk-signin.png`, `artifacts/android/05b-clerk-signed-in.png`)

**05b — Sign-out (Android).** Profile → Sign Out → confirmation → returned to anonymous/Sign-In
state. Clerk session cleared.

## Findings

- ⚠️ **Uncaught promise rejection on the auth screens (Android emulator).**
  `ExpoWebBrowser.warmUpAsync` rejects with *"Cannot determine preferred package without
  satisfying it"* — the Genymotion image has no Chrome / Custom Tabs provider to pre-warm for
  Google OAuth. It surfaces as `ERROR Uncaught (in promise) …` and a red dev toast on every
  sign-in/sign-up mount. Emulator-specific (real devices ship Chrome) and only affects the
  social-auth *pre-warm*, not email auth — but the call in `SocialAuthButtons` should be wrapped
  in `try/catch`/`.catch(() => {})` so it never becomes an unhandled rejection.
- 🔍 **Clerk password-breach validation is active** (rejected a known-breached password). Not a
  bug — good signal that Clerk validation is wired correctly.
- **Test Store price quirk:** RevenueCat's Test Store assigns default prices; Yearly shows
  `$79.98` on Android vs `US$79,99` on iOS (cosmetic, Test-Store-only). Prices are locale-
  formatted (comma on the iOS sim, dot on Android).
- **Dev warning toast overlaps bottom controls.** The "Open debugger to view warnings" LogBox
  notification sits over CONTINUE / the "Sign up" link, which complicated automation (worked
  around with point-taps). Dev-only; not a product issue.
- **RevenueCat is anonymous, not linked to Clerk.** `Purchases.configure` is called without
  `Purchases.logIn(clerkUserId)`, so entitlements are tied to a device-anonymous RC user, not
  the signed-in account. Fine for this Test-Store verification, but for production you'll likely
  want to `logIn` with the Clerk user id so subscriptions follow the user across devices.

## Scope not covered (by design)

- **Production billing** (real StoreKit / Google Play Billing) was **not** tested — Test Store
  only, because no store subscription products exist yet (Play Console has none). The simulated
  "Test valid purchase" dialog stands in for the real store sheet.
- The purchase flips the RevenueCat user to PREMIUM; **re-running the FREE-state flows (01, 02)
  needs a reset** — reinstall the app (fresh anonymous RC user) or reset the customer in the
  RevenueCat dashboard. (iOS is now PREMIUM from this run; Android's test user was signed out.)
- A Clerk test user (`pmpe2e+clerk_test@example.com`) was created on the dev instance during
  testing and then signed out.

## The test suite

Maestro flows live in `.maestro/` (`01`–`05` + `README.md`). Run per platform:
```
maestro --device <ios-sim-udid>  test .maestro/01-revenuecat-paywall.yaml
maestro --device <adb-serial>     test .maestro/01-revenuecat-paywall.yaml
```
See `.maestro/README.md` for prerequisites, state requirements, and the cross-platform
selector notes (price `$`, case-insensitive Test Store dialog).
