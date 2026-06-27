# Monetization — remaining tasks (not finished)

> As of 2026-06-27. Code is done & committed on `main` (not pushed): productId fix,
> win-back compliance (3.1.2/5.6), Android products + RevenueCat Play app, Task 8
> (billing enabled by build profile). Below is what's still open.
> Full reference: `docs/monetization/pricing-and-revenuecat-config.md`.

## 1. Android "Lifetime" one-time product (BLOCKED — needs human, Play Console UI)
Could not be done via API (legacy 403 "migrate" / new one-time endpoint 404) nor via
chrome-cdp (Play Console renders black screenshots + Material dialogs that don't
drive reliably; "Save as draft" silently didn't persist). **No partial product was
created** — the list is clean.

- [ ] **You:** Play Console → app PMP Exam Pro (`4973114420414820491`) → **One-time products → Create one-time product**
  - Product ID `pmp_pro_lifetime`, Name "PMP Exam Pro Premium", a description, Tax category "Digital content" → Next
  - Purchase option ID `lifetime` → **Set prices** $99 (US, apply worldwide) → **Activate**
- [ ] **Me (once it exists):** RevenueCat → create Play product for `pmp_pro_lifetime`, attach to `pro` entitlement, add to the `$rc_lifetime` package (Play Store column) in the `default` offering.

(iOS Lifetime `pmp_pro_lifetime` is already done.)

## 2. Win-back discounted offer — worldwide (currently US-only)
The $39.99-first-year intro is only configured for the US on both platforms.
- [ ] **iOS:** add intro-offer price points for the other territories on `pmp_pro_annual_winback` (ASC `subscriptions offers introductory ... --territory`).
- [ ] **Android:** the win-back sub `pmp_pro_annual_winback` is US-only (worldwide create 500s intermittently) — add `otherRegionsConfig`/regional prices to the base plan + the `intro-1y` offer.

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
