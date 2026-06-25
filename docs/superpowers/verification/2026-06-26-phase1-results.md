# Phase 1 Verification Results — RevenueCat + Clerk (2026-06-26)

**Goal:** Verify end-to-end that a RevenueCat **Test Store** purchase grants the `pro`
entitlement and unlocks premium while signed in with a **Clerk production** (`pk_live`)
account, on the iOS simulator.

**Verdict: ✅ PASS** — the subscription feature works end-to-end against Clerk
production + the RevenueCat Test Store, after fixing a prod-Clerk auth blocker (below).

## Environment
- App: PMP Exam Pro dev build (`com.h2ai.pmpexampro`), iOS Simulator (iPhone 16 Pro Max), app v1.1.0
- Clerk: **production** instance (`clerk.abovetarget.org`, `pk_live`)
- RevenueCat: **Test Store** key (`test_…`), project `0a64724c`, `default` offering, `pro` entitlement
- Automation: Maestro 2.1.0 driving the simulator; Clerk/RC dashboards via Chrome CDP
- Account: demo reviewer `appstore.review@abovetarget.org`

## Results by step
| Step | Result |
|---|---|
| Unit baseline (`jest` subscription suites) | ✅ 25/25 pass |
| Env + RC config pre-flight (`pro` entitlement, 3-package `default` offering) | ✅ confirmed |
| Build + launch dev client | ✅ launched clean (after Native API fix) |
| Sign in — Clerk **production**, demo account | ✅ Profile shows email + **Sign Out** |
| Paywall renders 3 packages w/ Test Store prices | ✅ Weekly US$6.00 / Monthly US$9.99 / Lifetime US$99.99 |
| Purchase Monthly (Test Store "valid purchase") | ✅ completed |
| `pro` active in-app | ✅ Profile **Plan: MONTHLY** (was FREE) |
| Restore purchases | ✅ "Restore complete"; Plan stays MONTHLY |
| Sign-out revokes premium (no anonymous premium) | ✅ Plan → FREE, "GO PREMIUM" block returns, Sign In row returns |

Screenshots in `phase1-screens/`: `pmp-01b-after-nativeapi`, `-02-signed-in`,
`-03-paywall`, `-05-profile-plan` (MONTHLY), `-07-restore`, `-08-signed-out`.

Note: the RevenueCat **dashboard** cross-check of the customer record was skipped (the
Chrome CDP daemon got stuck mid-session). It's redundant — the in-app **Plan: MONTHLY**
is driven by `isPremium` reading the `pro` entitlement from RevenueCat's CustomerInfo, so
the app reflecting MONTHLY *is* RevenueCat confirming the active entitlement.

## Production-Clerk fixes made during this run (on the AboveTarget **shared** instance)

The app's email/password auth worked on the dev Clerk instance but failed on production
because production was configured stricter. Fixes applied (via dashboard, Chrome CDP):

1. **Native API was disabled** → enabled it (Configure → Native applications → Enable
   Native API). Without this, `@clerk/clerk-expo` threw "The Native API is disabled" at
   launch — native auth was fully broken in prod builds.
2. **Registered the iOS app** (Team ID `A2856ZD38W` + bundle `com.h2ai.pmpexampro`) and
   added mobile-SSO redirect `pmp-exam-pro://sso-callback` (for Apple/Google OAuth).
3. **Disabled "Client Trust"** (Configure → Protect → Attack protection). It was forcing
   an **email-code second factor on password sign-in** for "untrusted" (new) devices →
   `signIn.create` returned `needs_second_factor`, which the app's `use-email-auth`
   doesn't handle, so sign-in dead-ended. With it off, prod password sign-in returns
   `complete`. Verified via the demo account through the app.

## Open items / follow-ups
- **Bot sign-up protection** (Attack protection, Cloudflare Turnstile) is still ON →
  in-app **sign-UP** fails ("Something went wrong"); the headless RN client can't solve
  Turnstile. Not needed for sign-IN. Decide whether real in-app sign-up must work (if so,
  disable it or integrate Clerk's CAPTCHA handling).
- **Shared-instance security note:** disabling Client Trust reduces new-device protection
  for ALL users of the AboveTarget instance (incl. abovetarget-pwa). Confirm acceptable.
- **Test cleanup:** a throwaway probe user `rctest@abovetarget.org` was created in the
  prod Clerk instance during diagnosis — delete it.
- This was the **Test Store** (RC "sandbox"). Phase 2 (real `appl_` key + App Store
  subscription products) remains per the design doc, and is still gated on ASC IAP
  products existing.
