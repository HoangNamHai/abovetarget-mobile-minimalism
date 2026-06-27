# Monetization — remaining tasks (not finished)

> As of 2026-06-27. Code is done & committed on `main` (not pushed): productId fix,
> win-back compliance (3.1.2/5.6), Android products + RevenueCat Play app, Task 8
> (billing enabled by build profile). Below is what's still open.
> Full reference: `docs/monetization/pricing-and-revenuecat-config.md`.

## 1. Android "Lifetime" one-time product ✅ CREATED (2026-06-27, via new one-time-products API)
Previously blocked, but the **new `monetization.onetimeproducts` Play Developer API now works**
(the old `inappproducts` 403 / earlier one-time 404 are gone). Created + activated programmatically.

- [x] **Product created:** `pmp_pro_lifetime`, title "PMP Exam Pro Premium", purchase option `lifetime`,
  **state ACTIVE**, `legacyCompatible=true`, **US $99.00**, 173 regions priced (equalized worldwide)
  + `newRegionsConfig` (usd $99 / eur €86.97) for future regions. Tax: digital-content withdrawal right.
- [x] **RevenueCat done (chrome-cdp):** imported `pmp_pro_lifetime` into the Play app (Non-consumable, backwards-compatible identifier `pmp_pro_lifetime`), attached to `pro` entitlement, and added to the `$rc_lifetime` package (Play column) in the `default` offering. Verified: all three platforms now in the Lifetime package.

(iOS Lifetime `pmp_pro_lifetime` is already done.)

### ⚠️ Bug found & fixed (2026-06-27): Android subs were NOT attached to `pro`
While doing the RC work, found the 4 Android subscription products (`pmp_pro_annual_winback:annual-wb`,
`pmp_pro_weekly:weekly`, `pmp_pro_monthly:monthly`, `pmp_pro_annual:annual`) showed **"Attach"** (no
entitlement) — the config doc had claimed they were attached. Without this, **Play subscription purchases
would not unlock premium**. **Fixed:** attached all 4 to `pro`. Verified all 5 Android products (incl.
lifetime) now show "1 Entitlement". The `winback` offering already carries the Play win-back product.

## 2. Win-back discounted offer — worldwide ✅ DONE (2026-06-27)
The $39.99-first-year intro is now configured worldwide on both platforms.
- [x] **iOS:** intro-offer price points created for all 175 territories on `pmp_pro_annual_winback` (`asc subscriptions offers introductory create --territory ... --price-point ...`, equalized from the US $39.99 price point via `price-points equalizations`). Verified: 175 distinct-territory intro offers.
- [x] **Android:** `pmp_pro_annual_winback` base plan `annual-wb` + offer `intro-1y` now worldwide — added `otherRegionsConfig` (usd $59.99 / eur €59.99 base; usd $39.99 / eur €39.99 offer phase) + `otherRegionsNewSubscriberAvailability=true`. Both still ACTIVE.

## 3. Build + store-review smoke test (needs human — real billing goes live)
- [ ] Production build (iOS + Android), test on TestFlight / Play internal testing.
- [ ] Verify App Store 3.1.2/5.6 checklist: paywall shows price + auto-renew + Terms/Privacy + Restore; ✕ dismisses; first dismiss → win-back once (discounted $39.99 first year); win-back exitable + has its own Terms/Privacy/Restore.
- [ ] Confirm purchases + restore actually work in sandbox.

## 4. Submit products for review (needs human)
- [ ] iOS: attach the auto-renewables + Lifetime IAP to an app version and submit (subscription review screenshot required).
- [ ] Android: submit the app version (subs are ACTIVE; ensure they ride with the release).

## 5. Push code (your call)
- [ ] `main` is ahead of `origin/main` by the session's commits and is **not pushed**. Push when ready.

---

### Already DONE this session (for reference)
- productId fix (`tierForProductId` tolerant of dev + live ids).
- Win-back: discounted intro offer (iOS ASC + RC `winback` offering), `introOffer()` helper, intro-aware disclosure, `winbackPackages` in subscription context, win-back screen with Terms/Privacy/Restore + sign-in guard + honest copy + tests.
- Android: weekly/monthly/annual subs ACTIVE worldwide; win-back sub + `intro-1y` offer (US); RevenueCat Play app `appf6471ce469` (key `goog_dxWeLkyQEgvCQPuPTVaWTJHihGs`), products attached to `pro`, in `default` + `winback` offerings.
- Task 8: `EXPO_PUBLIC_REVENUECAT_ENABLED=true` (eas.json prod + .env.production); keys by build profile (`IS_PRODUCTION_BUILD`).
