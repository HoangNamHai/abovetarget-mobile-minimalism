# Subscription Rollout — RevenueCat + Clerk (PMP Exam Pro)

**Date:** 2026-06-25
**Status:** Approved design — Phase 1 to execute, Phase 2 design-only
**Platform scope:** iOS first (Android deferred)

## Goal

Bring the already-built subscription feature to life on production auth, verified
in two stages:

1. **Phase 1 (execute now):** RevenueCat **Test Store** ("sandbox") key + **Clerk
   production** key — verify the full purchase/entitlement flow end to end.
2. **Phase 2 (design only):** real App Store RevenueCat key (`appl_…`) + Clerk
   production key — documented plan, blocked on store products + Apple agreements.

## Key reality (corrects the original framing)

RevenueCat does **not** have separate "sandbox" and "production" API keys. The PMP
project (`0a64724c`) currently has only a **Test Store** configuration:

| Term used | What it actually is | Status |
|---|---|---|
| "sandbox key" | Test Store key (`test_UFx…`) | ✅ exists, wired in `src/config/revenuecat.ts` |
| "production key" | Real-store SDK key (`appl_` iOS / `goog_` Android) | ❌ does not exist; needs an App Store app configuration, which needs real products |

App Store Connect (`PMP Exam Pro`, app `6782658779`) has **zero** subscription
groups and **zero** in-app purchases today. That is why Phase 2 is large and
externally gated.

## Current state (already built)

- **Code:** the subscription feature is complete. `SubscriptionProviderLive`
  (`src/contexts/subscription-context.tsx`) initializes RevenueCat with
  `REVENUECAT_API_KEYS`, links the RC customer to the Clerk user, reads the `pro`
  entitlement, drives the paywall, and gates lessons. Provider only mounts when
  `REVENUECAT_ENABLED` is true (`src/config/env.ts`).
- **Clerk:** production key (`pk_live_…`) already active in `.env`.
- **RevenueCat (`0a64724c`):** `default` offering with 3 packages
  (`$rc_weekly` → `weekly`, `$rc_monthly` → `monthly`, `$rc_lifetime` → `lifetime`),
  attached to the `pro` entitlement. Test Store only.
- **Pricing:** `src/config/pricing.ts` is presentation-only; live prices come from
  RevenueCat at runtime (`package.product.priceString`).
- **Env:** `.env` has `EXPO_PUBLIC_REVENUECAT_ENABLED=true`; `.env.production` has it
  `false` (ship-as-free until store products exist). The `development` EAS profile
  also sets it `true`.
- **RC SDK:** `react-native-purchases@^10.4.0` (Test Store supported).

## Phase 1 — Test Store + Clerk prod (EXECUTE)

### Config changes
None. The `.env` + `revenuecat.ts` + `default` offering already satisfy Phase 1.
(Pre-check only: confirm the `pro` entitlement identifier and that all 3 packages
resolve.)

### Run approach
Approach A — **iOS Simulator via `npm run ios`** (local dev client). `ios/` is
prebuilt; the dev build loads `.env`; the Test Store works in the simulator without
StoreKit.

### Verification procedure (evidence required at each step)
1. `npm run ios` → app launches on the iOS simulator.
2. Sign in with a **Clerk production** account — the reviewer demo
   `appstore.review@abovetarget.org`.
3. Open the paywall → 3 packages render with Test Store prices.
4. Purchase the monthly package → assert: `pro` entitlement active, lesson gate
   lifts, Profile "Plan" row shows the tier.
5. **Restore purchases** works; **sign-out** clears premium (no anonymous premium).
6. Capture a screenshot at each step.

### Success criteria
- A Test Store purchase grants `pro` and unlocks gated content while signed in with
  a Clerk `pk_live_` account.
- Restore re-grants; sign-out revokes.
- No crash/init errors from RevenueCat or Clerk in the dev build.

## Phase 2 — real `appl_` key + Clerk prod (DESIGN ONLY, iOS)

Documented dependency chain; **not executed** in this effort.

1. **Apple prerequisites (account-owner action):** Paid Applications agreement active
   + banking/tax on the "Phan Thien Dao Nguyen" team.
2. **ASC products:** subscription group with weekly + monthly auto-renewables
   (`asc subscriptions setup --app 6782658779 …`) and a lifetime non-consumable
   (`asc iap …`). Final product IDs decided at execution.
3. **RC store config:** add an App Store app configuration (`com.h2ai.pmpexampro`),
   upload the ASC In-App-Purchase key + app-specific shared secret, create RC products
   whose identifiers match the ASC product IDs, attach them to `pro`, and add them to
   the `default` offering packages. This yields the `appl_` key.
4. **App:** swap `REVENUECAT_API_KEYS.ios` → `appl_…`; set
   `EXPO_PUBLIC_REVENUECAT_ENABLED=true` in `.env.production`.
5. **Test:** production-bundle TestFlight build + an ASC sandbox tester → sandbox
   purchase → confirm RC receipt validation; then phased production rollout.

### Pricing (set in ASC; RC + app inherit at runtime)
Weekly ≈ $6/week, Monthly = "Best Value", Lifetime one-time. Real numbers decided at
execution. Changing price later needs no app release.

## Cleanup items (note, low priority)
- Test Store has a `yearly` product the app doesn't use — ignore or remove.
- The `PRODUCTS` constant in `revenuecat.ts` (`pmp_pro_*`) does not match the RC
  product identifiers (`weekly`/`monthly`/`lifetime`); it is not used for purchasing
  (offering packages drive that), so it is effectively unused — tidy up.

## Risks
- RC↔Clerk identity: confirm the anonymous→identified login aliases correctly so a
  purchase made before/after sign-in maps to the same Clerk user.
- Test Store ≠ StoreKit: Phase 1 success does not prove real StoreKit/sandbox
  behavior — that is exactly what Phase 2's sandbox test covers.

## Out of scope
- Android / Google Play setup.
- Executing any Phase 2 step (ASC product creation, RC store config, key swap).
