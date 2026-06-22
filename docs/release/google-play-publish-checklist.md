# Google Play Pre-Publish Checklist — PMP Exam Pro

**App:** PMP Exam Pro · `com.h2ai.pmpexampro` · EAS slug `pmp-exam-pro` · projectId `d31b8c5a-d243-401a-af76-35f0b42342bc`
**Stack:** Expo SDK 56 · React Native 0.85 · Clerk auth · RevenueCat (react-native-purchases) · Sentry · **no OTA/expo-updates**, **no ads SDK**
**Build method:** local EAS build (`--local`) → AAB → `eas submit` (production track, draft)
**Last reviewed:** 2026-06-22 against versionName **1.1.0** / versionCode **16** (draft on Play, alongside completed v11)

---

## Legend

| Mark | Meaning |
|------|---------|
| ✅ | Verified done (as of last review) |
| ⚠️ | **Action needed / blocker** |
| ❓ | Must verify manually in Play Console (not readable via API) |
| 💤 | Deferred — monetization, only when paywall goes live |
| 🔁 | Re-check **every release** |
| 1️⃣ | **One-time** setup (stable once done) |

> How to use: in a future session, go section by section. Anything ⚠️ or ❓ is not safe to publish until resolved. The "Verify" column tells you the exact command or Console path.

---

## 0. ⚠️ TL;DR — OUTSTANDING BEFORE NEXT PRODUCTION RELEASE

These are the live blockers found at last review. Resolve before promoting the draft from "draft" to "rollout".

1. ⚠️ **RevenueCat is enabled in the production build but uses the TEST STORE key.**
   `.env` has `EXPO_PUBLIC_REVENUECAT_ENABLED=true`; `src/config/revenuecat.ts` hardcodes `test_UFxNiXpKqWHIZlleFrlzORuIAgL` for both iOS and Android. The file comment itself says *"swap these for production keys (goog_… / appl_…) before release."* → With this build, the paywall initializes against the Test Store, so **real Play purchases cannot complete**. Either (a) ship the prod `goog_…` key + real Play products, or (b) set `EXPO_PUBLIC_REVENUECAT_ENABLED=false` for the production build if monetization is not meant to be live yet.
2. ⚠️ **No Play subscription/IAP products exist** (`monetization.subscriptions.list` → 0). Products referenced in code — `pmp_pro_weekly`, `pmp_pro_monthly`, `pmp_pro_lifetime` (entitlement `pro`) — must be created and **Active** in Play Console before purchases work.
3. ❓ **App access / test login for review.** App is gated behind Clerk auth. Google reviewers need either a demo account or login instructions in *Play Console → App content → App access*, or review will fail.
4. ❓ **Privacy policy URL** present and live (required; not found in repo — confirm it's set in Console and reachable).
5. ❓ **Account deletion** — app creates user accounts (Clerk), so Play requires an in-app delete path **and** a public account-deletion URL (Data safety / App content).
6. ⚠️ **Sentry source maps not uploaded** — builds run with `SENTRY_DISABLE_AUTO_UPLOAD=true`, so production crashes won't symbolicate. Acceptable, but know that stack traces will be minified unless you upload maps out-of-band.
7. ❓ **`SYSTEM_ALERT_WINDOW` (draw-over-other-apps) permission** is in the merged manifest. Confirm it's intended (some libs pull it in); Play can flag overlay permission and ask for justification.

---

## 1. App identity & build config

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| 1️⃣ | `applicationId` / package final & immutable | ✅ `com.h2ai.pmpexampro` | `app.json` → `expo.android.package` |
| 🔁 | `versionName` bumped for user-facing release | ✅ `1.1.0` | `app.json` → `expo.version` |
| 🔁 | `versionCode` strictly greater than last uploaded | ✅ `16` (> live 11) | `appVersionSource: remote` + `autoIncrement` (EAS); **failed builds consume codes** — confirm real value with `java -jar bundletool.jar dump manifest --bundle <aab> \| grep versionCode` |
| 🔁 | Artifact is **AAB** (app-bundle), not APK | ✅ | `eas.json` → `build.production.android.buildType: "app-bundle"` |
| 1️⃣ | `targetSdkVersion` meets Play's current floor (Android 15 / API 35+) | ✅ `36` | bundletool manifest dump → `targetSdkVersion="36"` |
| 1️⃣ | `minSdkVersion` acceptable | ✅ `24` | same dump |
| 1️⃣ | 64-bit native libs only (no 32-bit-only) | ✅ (RN 0.85 / NDK 27) | implicit in modern Expo |
| 🔁 | Code shrinking / ProGuard-R8 on for release | ✅ | `app.json` → expo-build-properties `enableProguardInReleaseBuilds: true`, `enableShrinkResourcesInReleaseBuilds: true` |
| 🔁 | `EXPO_PUBLIC_ENV=production` in the build | ✅ | `eas.json` → `build.production.env` |
| 🔁 | `console.*` stripped in prod | ✅ | `babel-plugin-transform-remove-console` in `babel.config.js` (prod) |
| 🔁 | No debuggable flag / dev menu / dev endpoints in release | ❓ | confirm no `__DEV__`-only leaks; release config |
| 🔁 | Permissions minimal & justified (see §1a) | ❓ | bundletool manifest dump |

### 1a. Permissions in the built AAB (review each release)

`INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `VIBRATE`, `USE_BIOMETRIC`/`USE_FINGERPRINT`, `c2dm.RECEIVE`, **`com.android.vending.BILLING`** (RevenueCat/Play Billing), **`SYSTEM_ALERT_WINDOW`** (⚠️ verify source/justification), `READ/WRITE_EXTERNAL_STORAGE` (maxSdk 32, fine), many OEM **badge** permissions (notification badge lib — benign).
- ❓ If any are flagged by Play (esp. `SYSTEM_ALERT_WINDOW`), provide justification in the console or remove the offending dependency.

---

## 2. Signing & credentials  (mostly 1️⃣)

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| 1️⃣ | Play App Signing enrolled (Google holds app signing key) | ✅ (v11 already shipped this way) | Console → Setup → App integrity |
| 1️⃣ | Upload keystore present & backed up | ✅ `release.keystore`, alias `pmp-release`, store/key pass `962911` (gitignored) | sourced from `~/Documents/workspace/pmp-prod-v3/`; `credentials.json` + keystore must exist locally for `credentialsSource: local` |
| 🔁 | Build signed with the correct upload key | ✅ | `eas.json` → `credentialsSource: local`; build log shows keystore decode |
| 1️⃣ | Play Developer API service-account key valid | ✅ `pc-api-9211159543626347762-239-4d9390d4bf09.json` (ai-cli@… SA) | used by `eas submit` + `fastlane supply`; copies in `~/Downloads/` and repo (gitignored) |
| 1️⃣ | Service account has correct Play permissions | ✅ (submits + metadata succeed) | Play Console → Users & permissions |

---

## 3. Runtime / code readiness

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| 🔁 | Clerk **production** publishable key in build | ❓ | `.env` → `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (app reuses AboveTarget shared Clerk instance; confirm prod vs dev key) |
| 🔁 | Sentry DSN set (prod) | ✅ | `.env` → `EXPO_PUBLIC_SENTRY_DSN`; plugin org `manavn`, project `pmp-exam-pro` |
| 🔁 | Sentry source maps uploaded (or knowingly skipped) | ⚠️ skipped | built with `SENTRY_DISABLE_AUTO_UPLOAD=true` (no token locally); crashes won't symbolicate |
| 🔁 | RevenueCat key = **production** `goog_…` (not test) | ⚠️ **test key** | `src/config/revenuecat.ts` → `REVENUECAT_API_KEYS.android` |
| 🔁 | RevenueCat enable flag matches intent | ⚠️ `true` in `.env` while keys are test | `EXPO_PUBLIC_REVENUECAT_ENABLED`; `REVENUECAT_DISABLED = !ENABLED` in `src/config/env.ts` |
| 🔁 | No hardcoded secrets / dev URLs in bundle | ❓ | grep source; `.env` only has public `EXPO_PUBLIC_*` |
| 🔁 | Deep links / Android App Links verified | ❓ | scheme `pmp-exam-pro`; confirm intent filters if links used |
| 🔁 | Unit/integration tests green | ❓ | `npm test` (subscription-context tests exist) |

---

## 4. Store listing — graphics & text  (App-level; not version-specific)

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| 1️⃣ | App name ≤ 30 chars | ✅ "PMP Exam Pro" (12) | Console listing / `fastlane/metadata/en-US/title.txt` |
| 🔁 | Short description ≤ 80 | ✅ (68) | `short_description.txt` |
| 🔁 | Full description ≤ 4000 | ✅ (1304) | `full_description.txt` |
| 1️⃣ | App icon 512×512 PNG (32-bit) | ✅ 1 on Play | Console → Main store listing |
| 1️⃣ | Feature graphic 1024×500 | ✅ 1 on Play | required for featuring |
| 🔁 | Phone screenshots 2–8 (correct dims) | ✅ 4 × 1440×2308 | `images/phoneScreenshots/`; bytes match Play (sha256) |
| 🔁 | 7" tablet screenshots | ✅ 4 on Play | only needed if marketed for tablets |
| 🔁 | 10" tablet screenshots | ✅ 4 on Play | same |
| ❓ | Screenshots reflect **current** UI | ❓ | last set dated 2026-06-20; do not show the new 1.1.0 onboarding redesign (optional refresh) |
| 1️⃣ | Promo video (optional) | — none | `video.txt` empty |
| 1️⃣ | Category & tags set | ❓ | Console → Store settings |
| 1️⃣ | Contact email | ✅ `super.app.manager@gmail.com` | `edits.details` |
| 1️⃣ | Website / phone (optional) | ❓ none set | optional but recommended |

---

## 5. App content / policy declarations  (Play Console → App content — all must be green)

| ✓ | Item | Status | Notes |
|---|------|--------|-------|
| ❓ | **Privacy policy URL** (required) | ❓ | live & accurate; covers Clerk, RevenueCat, Sentry |
| ❓ | **App access** (login for review) | ❓ ⚠️ | Clerk-gated app → provide demo creds or instructions, else review fails |
| ❓ | **Ads** declaration | likely "No ads" | no ads SDK present (no AdMob) |
| ❓ | **Content rating** (IARC questionnaire) | ❓ | already rated for v11; re-answer if content/monetization changed |
| ❓ | **Target audience & content** (age) | ❓ | not a kids/families app |
| ❓ | **Data safety** form (see §6) | ❓ | must match actual SDK behavior |
| ❓ | **Government / financial / health** flags | ❓ | none apply |
| ❓ | **Account deletion** path + URL | ❓ ⚠️ | required because app has accounts (Clerk) |
| ❓ | **News app** | No | |
| ❓ | **Data deletion / handling for AI** etc. | n/a | |

---

## 6. Data safety form — must reflect installed SDKs

Disclose accurately (mismatches are a policy violation):

- **Clerk (auth):** collects email/name/user ID, account auth → *Personal info*, linked to user, used for app functionality/account management.
- **RevenueCat / Play Billing:** purchase history, device/RevenueCat ID → *Purchases / App activity*, for functionality.
- **Sentry:** crash logs, diagnostics, device info → *App activity / Diagnostics*, for analytics/crash reporting; may be shared with Sentry.
- **Encryption in transit:** Yes. **Account deletion request mechanism:** Yes (provide URL).
- ❓ Re-confirm there is **no** ads/analytics SDK silently collecting (no Mixpanel/AppsFlyer/AdMob in deps — verified absent at last review).

---

## 7. Content rating  (1️⃣ / re-check on big changes)

- ❓ IARC questionnaire completed; rating issued. Educational content, no objectionable material. Re-run if you add UGC, ads, or gambling-like mechanics.

---

## 8. 💤/⚠️ Monetization (IAP & subscriptions) — BLOCKING (paywall going live)

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| ⚠️ | Subscription products created & **Active** in Play | ⚠️ 0 exist | Console → Monetize → Subscriptions; need `pmp_pro_weekly`, `pmp_pro_monthly` |
| ⚠️ | One-time product for lifetime (if used) | ⚠️ missing | `pmp_pro_lifetime` (in-app product) |
| 🔁 | Product IDs match code | code expects the 3 above | `src/config/revenuecat.ts` → `PRODUCTS` |
| ⚠️ | RevenueCat **production** `goog_…` Android key in build | ⚠️ test key | `REVENUECAT_API_KEYS.android` |
| 🔁 | RevenueCat offering/entitlement `pro` mapped to Play products | ❓ | RevenueCat dashboard (project `0a64724c`) |
| 1️⃣ | Payments profile / merchant account active | ❓ | Console → Setup → Payments |
| 1️⃣ | Tax & legal forms for paid content | ❓ | Console payments settings |
| 1️⃣ | License/closed-testing testers for purchase QA | ❓ | Console → Setup → License testing |
| 🔁 | Real sandbox purchase verified end-to-end | ❓ | test on internal track before production |
| 🔁 | Restore purchases works | ❓ | profile screen flow |

> If monetization is NOT meant to be live this release, the clean path is `EXPO_PUBLIC_REVENUECAT_ENABLED=false` for the production build (treats all users as premium, hides paywall) — then this whole section is 💤 deferred.

---

## 9. Pricing & distribution  (1️⃣, revisit if expanding)

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| 1️⃣ | Countries / regions selected | ❓ | Console → Production → Countries/regions |
| 1️⃣ | Free vs paid app | ✅ Free (IAP) | |
| 1️⃣ | "Contains ads" toggle correct | ❓ No | |
| 1️⃣ | Content guidelines + US export law checkboxes | ❓ | per-release final-step acknowledgements |

---

## 10. Release & rollout  (🔁)

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| 🔁 | Bundle uploaded to chosen track | ✅ production, **draft**, vc16 | `eas submit -p android --profile production` |
| 🔁 | Release "What's new" set per language | ✅ en-US (vc16) | `fastlane supply --version_code 16 --skip_upload_changelogs false`; verify via API |
| 🔁 | Release name sensible | ⚠️ shows "1.0.0" (cosmetic label; bundle versionName is 1.1.0) | optional rename in Console |
| 🔁 | Staged rollout % decided | ❓ | Console → Production → rollout |
| 🔁 | No "Changes not sent for review" surprises | ❓ | Console review banner |
| 🔁 | Promote draft → in review → live | ❓ | manual click in Console |

---

## 11. Pre-launch report & QA  (🔁)

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| 🔁 | Pre-launch report: no crashes/ANRs | ❓ | Console → Testing → Pre-launch report (note: release build ANRs on **Genymotion** past lesson hook — use a real device / different emulator) |
| 🔁 | Accessibility & security warnings reviewed | ❓ | same report |
| 🔁 | App launches on minSdk (API 24) device | ❓ | manual |
| 🔁 | Login (Clerk) works in release build | ❓ | manual |
| 🔁 | Core flows: onboarding → lesson → quiz → home | ❓ | manual |
| 🔁 | Crash-free on a physical device | ❓ | manual |
| 🔁 | Offline behavior acceptable | ❓ | airplane mode |

---

## 12. Legal / compliance

| ✓ | Item | Status |
|---|------|--------|
| ❓ | Privacy policy live, covers all SDKs | ❓ |
| ❓ | Terms of service (recommended w/ subscriptions) | ❓ |
| ❓ | Account deletion (in-app + URL) | ❓ ⚠️ |
| ✅ | No kids/families policy obligations (not child-directed) | ✅ |
| ❓ | Third-party SDK policy compliance (Clerk/RC/Sentry) | ❓ |

---

## 13. Post-publish verification  (after rollout)

- ❓ Store listing renders correctly (icon, screenshots, description) on a device.
- ❓ Install from Play on a fresh device; app opens, login works.
- ❓ Sentry receiving production events.
- ❓ (If monetized) a real purchase completes and unlocks `pro`.
- ❓ Update version live to expected % of users; monitor crash rate.

---

## 14. Reference — app-specific commands & locations

```bash
# Build (local) — note ANDROID_HOME + Sentry skip
export ANDROID_HOME=$HOME/Library/Android/sdk
SENTRY_DISABLE_AUTO_UPLOAD=true \
  eas build -p android --profile production --local --output ./pmp-<ver>.aab

# Confirm the REAL versionCode/versionName of the artifact (failed builds skip codes)
java -jar /tmp/bundletool.jar dump manifest --bundle ./pmp-<ver>.aab | grep -iE "versionCode|versionName"

# Submit to Play (production, draft)
eas submit -p android --profile production --path ./pmp-<ver>.aab --non-interactive

# Push changelog only to an existing draft release (use the REAL versionCode)
fastlane supply --version_code <N> --track production --release_status draft \
  --metadata_path ./fastlane/metadata \
  --skip_upload_apk true --skip_upload_aab true --skip_upload_metadata true \
  --skip_upload_images true --skip_upload_screenshots true --skip_upload_changelogs false

# Push full listing (description + screenshots) as draft
fastlane upload_metadata        # lane in fastlane/Fastfile (skips changelogs)
```

**Key files / locations**
- Build config: `eas.json` (profiles), `app.json` (version, icon, plugins, ProGuard)
- Signing: `credentials.json` + `release.keystore` (gitignored; from `~/Documents/workspace/pmp-prod-v3/`)
- Play API key: `pc-api-9211159543626347762-239-4d9390d4bf09.json` (gitignored)
- Store metadata: `fastlane/metadata/en-US/` (title, short/full description, changelogs, images)
- Monetization config: `src/config/revenuecat.ts`, `src/config/pricing.ts`, `src/contexts/subscription-context.tsx`
- Env flags: `.env` (`EXPO_PUBLIC_*`), gating in `src/config/env.ts`

**Play Console facts (last review):** defaultLanguage `en-US`; production track = 1 completed (vc11) + 1 draft (vc16); subscriptions configured = 0.

---

*Status marks reflect 2026-06-22. Re-verify ⚠️/❓ items each release; ✅/1️⃣ items are stable unless config changed.*
