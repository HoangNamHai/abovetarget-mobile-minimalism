# PMP Exam Pro — Pricing & RevenueCat / App Store Config

> Single source of truth for the monetization setup (App Store Connect products,
> RevenueCat config, and how they map to the code). Created 2026-06-27.
> If you change a price or add a product, update this file too.

## TL;DR

- 4 products: Weekly **$6/wk**, Monthly **$18/mo**, Yearly **$59.99/yr**, Lifetime **$99 one-time**.
- **No free trial** (deliberate — the "$0.00 today" CTA only shows when a trial exists, so it currently shows "Continue").
- Priced in **all 175 App Store territories**.
- RevenueCat is wired (products → `pro` entitlement → `default` offering) on **both iOS and Android**. **Billing is ENABLED in production** (Task 8 done — flag on, live keys by build profile). Remaining store tasks: build + smoke test, Android Lifetime one-time (Play Console UI), submit for review.

---

## Accounts & projects

| Thing | Value |
|---|---|
| App Store Connect app | **PMP Exam Pro**, app id `6782658779`, bundle `com.h2ai.pmpexampro`, SKU `pmpexampro2026` |
| ASC team | "Phan Thien Dao Nguyen" (separate from Musea) |
| `asc` CLI profile | `PMP-DaoNguyen` (Team key `G3CD625ZNS`) — it's the default profile |
| RevenueCat project | **PMP Exam Pro**, id `0a64724c` |
| RevenueCat App Store app | id `appceb15304ed` |
| RevenueCat Test Store app | id `appf0a4b4fa4e` (dev only) |

---

## Prices (base = USD / USA; equalized worldwide)

| Tier | Store product ID | Period | Price (USD) | Type | ASC id |
|---|---|---|---|---|---|
| Weekly | `pmp_pro_weekly` | 1 week | $6.00 | auto-renewable | sub `6784758082` |
| Monthly | `pmp_pro_monthly` | 1 month | $18.00 | auto-renewable | sub `6784758193` |
| Yearly | `pmp_pro_annual` | 1 year | $59.99 | auto-renewable | sub `6784758128` |
| Lifetime | `pmp_pro_lifetime` | — | $99.00 | non-consumable (one-time) | iap `6784758503` |

- ASC subscription group: **PMP Pro**, id `22190614` (holds the 3 auto-renewables).
- Availability: all 175 territories, `availableInNewTerritories = true`.
- Prices in non-US territories were set via Apple equalization from the US base
  (subs: `asc subscriptions pricing equalize`; IAP: Apple auto-equalize).
- **No introductory/free-trial offer** on any product.

> Prices are **not** authoritative in code. The live localized amount comes from
> RevenueCat (`product.priceString`). `fallbackPrice` in `src/config/pricing.ts`
> is only an offline placeholder. To change a price, change it in App Store
> Connect (+ Play later) — no app release needed.

---

## App Store Connect credentials for RevenueCat

In-App Purchase Key (required for StoreKit 2 / `react-native-purchases` v10 — without
it, purchases silently fail to record):

| Field | Value |
|---|---|
| Key name | RevenueCat |
| Key ID | `6H744J5U6J` |
| Issuer ID | `48d421d0-29a7-4799-97ee-4330306500d9` |
| `.p8` file | **download-once** — backed up to `~/Downloads/SubscriptionKey_6H744J5U6J.p8`. Move to a password manager / secret store; do NOT commit. |

Generate at: ASC → Users and Access → Integrations → **In-App Purchase** tab → Generate.
(This is a different key type than the "App Store Connect API / Team Keys" tab.)

---

## RevenueCat SDK keys

| App | Public SDK key | Use |
|---|---|---|
| App Store (production) | `appl_NymCurBoIwDypfVEFOMiENeOlxS` | goes in `src/config/revenuecat.ts` iOS for production |
| Test Store (dev) | `test_UFxNiXpKqWHIZlleFrlzORuIAgL` | current value in code (both iOS + Android), dev/sandbox only |
| Play Store (production) | `goog_dxWeLkyQEgvCQPuPTVaWTJHihGs` | goes in `src/config/revenuecat.ts` android for production (RC Play app `appf6471ce469`) |

## Android / Google Play

Package: `com.h2ai.pmpexampro` (same as iOS). Play Developer API managed via the
service account `ai-cli@pc-api-9211159543626347762-239.iam.gserviceaccount.com`
(`./pc-api-9211159543626347762-239-4d9390d4bf09.json`, also used by `eas submit`).

**Done (2026-06-27, via Play Developer API):**
- 3 auto-renewable subscriptions created + **ACTIVE**, priced US + auto-equalized worldwide (`otherRegionsConfig` usd+eur):
  - `pmp_pro_weekly` — base plan `weekly` (P1W) $5.99
  - `pmp_pro_monthly` — base plan `monthly` (P1M) $18.00
  - `pmp_pro_annual` — base plan `annual` (P1Y) $59.99
  - (Play requires globally-unique base-plan ids — reusing `annual` across products 500s; use suffixed ids like `annual-wb`.)

- **Win-back discounted offer** ✅ — `pmp_pro_annual_winback` sub (base plan `annual-wb`, $59.99/yr, **US-only** — worldwide 500s flakily, expand later) + ACTIVE Play offer `intro-1y` ($39.99 first year, new-customer). Note: base-plan ids must be globally unique (reusing `annual` 500s → used `annual-wb`).
- **RevenueCat Play app** ✅ — app `appf6471ce469` (pkg `com.h2ai.pmpexampro`), service-account JSON uploaded, key `goog_dxWeLkyQEgvCQPuPTVaWTJHihGs`. 4 Android products created + attached to `pro`; default offering packages (weekly/monthly/annual) + winback offering carry the Play products.

**Still pending for Android:**
- **Lifetime one-time `pmp_pro_lifetime` ($99)** — **blocked via API** (legacy `inappproducts` returns 403 "migrate"; new one-time endpoint 404s). Create it in the **Play Console UI**, then add it to the default offering's `$rc_lifetime` package (Play column) + the `pro` entitlement.
- **Win-back worldwide pricing** — the win-back sub is US-only (the worldwide create 500s intermittently); add `otherRegionsConfig` later.
- **Code** — `revenuecat.ts` android key swap to `goog_…` happens in Task 8 (with the flag flip), NOT before (dev runs flag-ON against Test Store). The cutover value is recorded in a comment there.

Public SDK keys are safe to ship in the app. The RevenueCat **secret** API key (`sk_`) is a different thing — not used here.

---

## RevenueCat catalog

- **Entitlement:** `pro` (id `entlbeaa511152`) — all 4 App Store products attached (+ the legacy Test Store products).
- **Offering:** `default` (id `ofrng4701ad8ba7`), packages:

  | Package | Identifier | App Store product | Test Store product (dev) |
  |---|---|---|---|
  | Annual | `$rc_annual` | `pmp_pro_annual` | `yearly` |
  | Weekly | `$rc_weekly` | `pmp_pro_weekly` | `weekly` |
  | Monthly | `$rc_monthly` | `pmp_pro_monthly` | `monthly` |
  | Lifetime | `$rc_lifetime` | `pmp_pro_lifetime` | `lifetime` |

- The paywall renders the live offering packages directly; the app's
  `defaultPackageId()` selects the **ANNUAL** package by default.

---

## Code mapping (`src/config/`)

- `revenuecat.ts` → `PRODUCTS = { WEEKLY: 'pmp_pro_weekly', MONTHLY: 'pmp_pro_monthly', ANNUAL: 'pmp_pro_annual', LIFETIME: 'pmp_pro_lifetime' }`, `ENTITLEMENTS.PRO = 'pro'`, `FREE_DAILY_LESSON_LIMIT = 3`.
- `pricing.ts` → presentation tiers (order/badge/features) + `fallbackPrice`. Consumed only by `plan-status.ts` (Profile "Plan" row), **not** the paywall.
- Flag: `EXPO_PUBLIC_REVENUECAT_ENABLED` (per build profile in `eas.json`; `.env.production` mirrors it). When false → SDK never inits, everyone treated as premium (ship-as-free).

> ⚠️ Known mismatch: `pricing.ts` tiers use a **bare** `productId` (`'annual'`) but
> the store/RC product id is `pmp_pro_annual`, so `tierForProductId()` won't
> resolve the Profile plan label until reconciled.

---

## Task 8 — billing enabled (DONE in code, 2026-06-27)

- `EXPO_PUBLIC_REVENUECAT_ENABLED=true` in the `eas.json` production profile **and** `.env.production`.
- Keys selected by build profile (`IS_PRODUCTION_BUILD` = `EXPO_PUBLIC_ENV === 'production'`, in `src/config/env.ts`): production → live `appl_`/`goog_`; dev/preview → Test Store. A Test-Store key can never ship in a production build.
- iOS win-back compliance (3.1.2/5.6) and the `productId` mismatch were resolved in earlier commits.

**Still needs a human / store action (does NOT block the code being live):**
1. **Build + store-review smoke test** — production build → TestFlight / Play internal testing. Verify: paywall shows price + auto-renew + Terms/Privacy + Restore; ✕ dismisses; first dismiss → win-back once (discounted $39.99 first year); win-back exitable. **Real billing is live for that build.**
2. **Android Lifetime** — create one-time `pmp_pro_lifetime` ($99) in the **Play Console UI** (API blocked), then add it to the `$rc_lifetime` package (Play column) + `pro` entitlement.
3. **Win-back Android worldwide** — currently US-only.
4. **Submit IAPs/subscriptions for review** — attach to an app version; review screenshot required.

---

## How this was created (for next time)

- ASC products: `asc subscriptions setup` / `asc iap setup` (CLI, profile `PMP-DaoNguyen`), then `asc subscriptions pricing equalize --confirm` for worldwide pricing. See the `asc` skill.
- RevenueCat: configured through the dashboard in the logged-in Chrome via the `chrome-cdp` skill (Chrome on port 9333). No RevenueCat API/secret key was needed.
