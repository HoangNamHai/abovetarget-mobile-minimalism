# RevenueCat Integration — Design

Date: 2026-06-20
App: PMP Exam Pro (`com.h2ai.pmpexampro`)
Scope chosen: **Code + new RC project (sandbox) + custom RN paywall.** Production billing stays **off**.

## Goal

Take the existing half-scaffolded, deliberately-disabled RevenueCat setup to a complete,
testable integration: real offerings/purchase/restore flow, a custom paywall, and a free-tier
gate that actually enforces the 3-lessons/day limit — without changing current production
behavior (all users treated premium) until store subscription products exist.

## Current state (verified)

- `react-native-purchases ^10.4.0` installed.
- `src/contexts/subscription-context.tsx` has two paths:
  - **Disabled** (`REVENUECAT_DISABLED = true`): everyone `isPremium: true`, SDK never configured.
    The just-shipped production build relies on this.
  - **Inner** (live): configures `Purchases`, listens for customer info, but `purchasePackage`
    is a no-op stub and no offerings are fetched.
- `src/config/revenuecat.ts`: Test Store key, entitlement `pro`, products
  `pmp_pro_monthly` / `pmp_pro_annual` / `pmp_pro_lifetime`, `FREE_DAILY_LESSON_LIMIT = 3`.
- `src/hooks/use-lesson-limit.ts`: computes `limitReached` / `canAccessLesson` but **nothing
  enforces it**. `consumeLesson()` only runs at lesson end (`WrapScreen`).
- `src/app/(tabs)/profile.tsx`: shows PREMIUM/FREE badge; Restore Purchases row is hidden while
  the flag is on. No upgrade entry point.
- Provider mounted in `src/app/_layout.tsx`.
- Jest mock for `react-native-purchases` exists in `jest-setup-mocks.js`
  (`getOfferings`, `purchasePackage`, `restorePurchases`, listeners).

## Store / dashboard reality (verified live via CDP)

- **No RevenueCat project for this app.** Existing projects are other apps. A new project is needed.
- **Play Console:** zero subscription products for `com.h2ai.pmpexampro` (empty state).
- **App Store Connect:** no active browser session — not verified; assume none.
- Therefore real StoreKit / Play **sandbox purchases cannot run until store products are
  created.** The full flow is testable now via the **RevenueCat Test Store offering**, which
  needs no store products.

## Approach

Extend the existing provider; do not rewrite. Drive dev testing with the Test Store offering;
wire the real RC project so production is one flag away once store products exist.

### 1. Config flag (`src/config/revenuecat.ts`)
- Replace the hardcoded `REVENUECAT_DISABLED = true` with an env-driven enable flag:
  `EXPO_PUBLIC_REVENUECAT_ENABLED` (default **off** → preserves production "everyone premium").
- Keep a derived `REVENUECAT_DISABLED` export for existing call sites (invert the env flag) to
  minimize churn.
- Enable the flag in `development` and `preview` EAS profiles only. `production` stays off.

### 2. Provider (`src/contexts/subscription-context.tsx`)
- Enabled path additions:
  - `getOfferings()` on init; expose `currentOffering` + `packages` (monthly/annual/lifetime).
  - Real `purchasePackage(pkg)`: calls `Purchases.purchasePackage`, sets `isPremium` from
    `customerInfo.entitlements.active.pro`, surfaces a typed `error`, treats user-cancellation
    as a non-error.
  - `restorePurchases()` updates `isPremium`.
  - `error` becomes `string | null` (currently typed `null`); `clearError` clears it.
- Disabled path keeps everyone premium and no-ops, unchanged in behavior.
- Update `SubscriptionValue` interface accordingly.

### 3. Custom paywall
- New modal route `src/app/paywall.tsx` (expo-router, `presentation: 'modal'`).
- `src/components/paywall/Paywall.tsx`: design-system UI (uniwind / heroui-native), lists
  packages with price/period, primary purchase CTA, Restore, dismiss, loading + error states.
- Falls back gracefully when no offering is available (e.g. flag off / network) — closes or
  shows an unavailable state rather than crashing.

### 4. Gate enforcement
- In `LessonPlayer` (entry `src/app/lesson/[id].tsx`): when a non-premium user has
  `limitReached`, route to `/paywall` instead of starting the lesson.
- Profile: add an "Upgrade to Premium" row (visible to free users when the flag is on) that
  opens `/paywall`; keep the existing Restore row.

### 5. RC dashboard (via CDP session, during implementation)
- Create project "PMP Exam Pro"; add iOS + Android apps for `com.h2ai.pmpexampro`.
- Create entitlement `pro`; products `pmp_pro_monthly/annual/lifetime`; a `default` offering
  with the three packages; ensure a Test Store offering is usable for dev.
- Copy real `appl_` / `goog_` public SDK keys into `.env` (inert while flag is off).

### 6. Tests
- Extend the jest mock as needed (offerings with packages, purchase success/cancel/error).
- Unit tests: provider purchase/restore/entitlement transitions; paywall render + interactions;
  lesson-gate routes free+limited users to the paywall and lets premium through.

## Out of scope (follow-ups)

- Creating Play / App Store Connect subscription products, pricing, and sandbox testers.
- Flipping `EXPO_PUBLIC_REVENUECAT_ENABLED` on for **production** (deferred until store products
  exist and are approved).

## Alternatives considered

- **Single always-on provider** (drop the disabled path): rejected — would immediately stop
  treating production users as premium.
- **Inline packages in Profile, no paywall route**: rejected — worse UX; a custom paywall was
  requested.

## Risks

- Don't enable the flag for production. The env default and per-profile config guard this.
- RC SDK is a native module — testing requires a dev/preview build (not Expo Go). No config
  plugin is required (autolinking).
- Real sandbox purchase verification is blocked until store products exist; Test Store covers
  the flow meanwhile.
