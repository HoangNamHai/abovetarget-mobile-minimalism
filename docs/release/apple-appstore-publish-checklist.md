# Apple App Store Pre-Publish Checklist — PMP Exam Pro

**App:** PMP Exam Pro · `com.h2ai.pmpexampro` · ASC App ID `6782658779` · SKU `pmpexampro2026`
**Apple team:** account holder **Phan Thien Dao Nguyen** (Apple ID → mobileappmana@gmail.com) — *separate team from Musea/Taptune*
**Stack:** Expo SDK 56 · React Native 0.85 · Clerk auth (email + **Apple** + Google SSO) · RevenueCat/StoreKit · Sentry · **no OTA/expo-updates**, **no IDFA/ad SDK**
**Upload path:** **manual** local build → `xcodebuild` archive → `exportArchive` → `xcrun altool --upload-app` (NOT `eas submit` — its iOS config is still placeholders)
**Last reviewed:** 2026-06-22. App.json version **1.1.0**; current ASC build = **v1.0.0 (build 1)** in TestFlight/processing — **iOS is behind the 1.1.0 you shipped to Android and has no App Store release yet.**

---

## Legend

| Mark | Meaning |
|------|---------|
| ✅ | Verified done (as of last review) |
| ⚠️ | **Action needed / blocker** |
| ❓ | Must verify manually in App Store Connect / Xcode (not checked locally) |
| 💤 | Deferred — monetization, only when paywall goes live |
| 🔁 | Re-check **every release** |
| 1️⃣ | **One-time** setup (stable once done) |

> How to use: go section by section in a future session. Anything ⚠️ or ❓ blocks submission until resolved. This is the **first App Store release** of this app, so expect many ❓ in the one-time sections (App Privacy, agreements, age rating) — they must all be green before "Submit for Review".

---

## 0. ⚠️ TL;DR — OUTSTANDING BEFORE FIRST APP STORE SUBMISSION

1. ⚠️ **Build the 1.1.0 binary for iOS.** ASC only has v1.0.0 (build 1). Produce a 1.1.0 build (build number auto-increments) using the manual recipe in §14, upload, and attach it to the App Store version.
2. ⚠️ **RevenueCat ships the TEST STORE key** (`src/config/revenuecat.ts` → `REVENUECAT_API_KEYS.ios = test_…`) while `EXPO_PUBLIC_REVENUECAT_ENABLED=true`. StoreKit purchases can't complete. Either ship the prod `appl_…` iOS key + real ASC products, or set the flag `false` if monetization isn't going live yet. *(Same root issue as the Android checklist.)*
3. ⚠️ **No StoreKit IAP/subscription products** exist/approved in ASC. Code expects `pmp_pro_weekly`, `pmp_pro_monthly`, `pmp_pro_lifetime` (entitlement `pro`). For a first release **with IAP, the IAPs are reviewed together with the app** — create them, attach to the version, and submit together.
4. ⚠️ **Paid Applications agreement + banking + tax** likely not signed (new team). Required before ANY IAP can go live (and the free-apps agreement before the app itself).
5. ❓ **App Privacy "nutrition label"** must be completed before first submission (Clerk, RevenueCat, Sentry — see §6). Tracking = No.
6. ❓ **App Review demo account** — app is Clerk-gated. Provide working email-login demo creds (or all three SSO won't be testable) in App Review Information, or review fails.
7. ❓ **Support URL** missing from metadata — Apple **requires** a Support URL on the App Information page (privacy URL alone is not enough).
8. ⚠️ **Release notes stale** — `fastlane/ios/metadata/en-US/release_notes.txt` still says "Initial release of PMP Exam Pro." Update for 1.1.0.
9. ❓ **Sign in with Apple works in release** — offered via Clerk SSO (`oauth_apple`); verify the Clerk Apple SSO (Services ID + key) is configured so the button actually completes, else Guideline 4.8 / 2.1 rejection.
10. ⚠️ **Set `ITSAppUsesNonExemptEncryption=false`** in `app.json` → `ios.infoPlist` to stop being asked export compliance on every upload (app uses only standard HTTPS = exempt).

---

## 1. App identity & build config

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| 1️⃣ | Bundle identifier final & matches ASC | ✅ `com.h2ai.pmpexampro` (Bundle ID res `7S9M6KTRR4`) | `app.json` → `expo.ios.bundleIdentifier` |
| 🔁 | `CFBundleShortVersionString` (marketing version) | ⚠️ app.json `1.1.0` but ASC build is `1.0.0` | `app.json` → `expo.version`; build 1.1.0 |
| 🔁 | Build number unique & increasing per upload | ✅ remote autoIncrement | `eas.json` → `build.production.ios.autoIncrement`; manual builds also bump |
| 1️⃣ | Deployment target acceptable (iOS 15.1+ on SDK 56) | ❓ | Expo default; confirm in `ios/` Podfile/project |
| 1️⃣ | Device family = iPhone only (no iPad) | ✅ `supportsTablet: false` | so no iPad screenshots/build required |
| 🔁 | Capabilities match entitlements (Push) | ❓ | expo-notifications → `aps-environment` (Expo plugin adds it); confirm APNs key exists in ASC |
| 🔁 | Sign in with Apple capability (if native) | ❓ | offered via **Clerk SSO web flow** (`oauth_apple`), so native `com.apple.developer.applesignin` entitlement may not be required — verify the flow works in release |
| 🔁 | Export-compliance flag set | ⚠️ not set | add `ios.infoPlist.ITSAppUsesNonExemptEncryption=false` |
| 🔁 | No usage-description strings needed without the feature | ✅ likely | no camera/photos/location/tracking SDKs; SecureStore not using biometric (no `requireAuthentication`/expo-local-authentication) → no `NSFaceIDUsageDescription` |
| 🔁 | Sentry source maps uploaded (or skipped knowingly) | ⚠️ skipped | built with `SENTRY_DISABLE_AUTO_UPLOAD=true` |

---

## 2. Signing & credentials  (mostly 1️⃣)

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| 1️⃣ | Distribution certificate valid | ✅ `C4JKDR7UYK` "iOS Distribution: Phan Thien Dao Nguyen" (SHA1 `EA8E…A598`) | |
| 1️⃣ | App Store provisioning profile | ✅ `RX34CQ2D42` "PMP App Store" (UUID `98ef…5441`) | |
| ⚠️ | **Apple WWDR G6 intermediate** imported | ⚠️ gotcha | without it Xcode shows "0 valid identities"; import before archiving |
| ⚠️ | **Manual** signing for archive | ⚠️ gotcha | Expo Release config hardcodes `CODE_SIGN_IDENTITY="iPhone Developer"`; override `CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY=<dist SHA1> PROVISIONING_PROFILE_SPECIFIER="PMP App Store"` |
| 1️⃣ | ASC API key (for altool upload) | ✅ `G3CD625ZNS` (Team Key, App Manager), issuer `48d421d0-29a7-4799-97ee-4330306500d9` | `AuthKey_G3CD625ZNS.p8` at repo root (gitignored `*.p8`) **and** `~/.appstoreconnect/private_keys/` |
| 1️⃣ | `asc` CLI profile | ✅ `PMP-DaoNguyen` (default, keychain) | individual keys 401 — use the Team key |
| ⚠️ | Don't clobber keychain search list | caution | `security list-keychains -s` with unsanitized `$EXISTING` broke `asc`; restore login.keychain-db + temp kc |

---

## 3. Runtime / code readiness

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| 🔁 | Clerk **production** publishable key | ❓ | `.env` → `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (shared AboveTarget instance; confirm prod) |
| 🔁 | Clerk **Apple SSO** configured (Services ID + key) | ❓ ⚠️ | else "Continue with Apple" fails → rejection |
| 🔁 | Clerk **Google SSO** configured | ❓ | `SocialAuthButtons.tsx` shows it on all platforms |
| 🔁 | Sentry DSN (prod) | ✅ | `.env` → `EXPO_PUBLIC_SENTRY_DSN`; org `manavn`, project `pmp-exam-pro` |
| 🔁 | RevenueCat key = **production** `appl_…` | ⚠️ test key | `src/config/revenuecat.ts` → `REVENUECAT_API_KEYS.ios` |
| 🔁 | RevenueCat enable flag matches intent | ⚠️ `true` with test key | `EXPO_PUBLIC_REVENUECAT_ENABLED` (`src/config/env.ts`) |
| 🔁 | No dev endpoints / secrets in bundle | ❓ | `.env` only public `EXPO_PUBLIC_*` |
| 🔁 | Universal Links / scheme | ❓ | scheme `pmp-exam-pro`; add `associatedDomains` only if used |
| 🔁 | Tests green | ❓ | `npm test` |

---

## 4. App Store listing — metadata & screenshots

Stored in `fastlane/ios/metadata/en-US/` (uploaded via `fastlane upload_metadata` iOS lane → `deliver`).

| ✓ | Item | Status | Limit / Verify |
|---|------|--------|--------|
| 1️⃣ | App name | ✅ "PMP Exam Pro" (12) | ≤ 30 · `name.txt` |
| 🔁 | Subtitle | ✅ "Story-based PMP exam prep" (25) | ≤ 30 · `subtitle.txt` |
| 🔁 | Promotional text | ✅ (153) | ≤ 170 · `promotional_text.txt` (editable without review) |
| 🔁 | Description | ✅ (1270) | ≤ 4000 · `description.txt` |
| 🔁 | Keywords | ⚠️ **99 / 100** (at the limit) | comma-separated, ≤ 100 · `keywords.txt` |
| 🔁 | Release notes ("What's New") | ⚠️ "Initial release…" stale | `release_notes.txt` — rewrite for 1.1.0 |
| 1️⃣ | **Support URL** (required) | ⚠️ missing | add to ASC App Information (no `support_url.txt`) |
| 1️⃣ | Marketing URL (optional) | — none | optional |
| 1️⃣ | Privacy Policy URL (required) | ✅ `https://abovetarget.org/privacy/` | `privacy_url.txt` — confirm it actually covers Clerk/RevenueCat/Sentry |
| 1️⃣ | App icon (1024×1024, no alpha) | ❓ | uploaded with the build's asset catalog / ASC |
| 🔁 | iPhone 6.9" screenshots (1320×2868) | ✅ 6 | `screenshots/en-US/0X-pmp-1320x2868.png` (min 1, max 10) |
| 🔁 | iPad screenshots | ✅ n/a | not needed (`supportsTablet:false`) |
| 1️⃣ | Primary/secondary category | ❓ | Education (verify in ASC) |
| ❓ | Screenshots reflect current 1.1.0 UI | ❓ | confirm they show the redesigned onboarding |

---

## 5. App information & declarations  (ASC → App Information / version page)

| ✓ | Item | Status |
|---|------|--------|
| 1️⃣ | Primary language, name, subtitle | ✅/❓ |
| 1️⃣ | Bundle ID selected | ✅ |
| 1️⃣ | Category | ❓ |
| 1️⃣ | Content rights (uses third-party content?) | ❓ |
| 🔁 | **App Review Information** (contact + **demo account**) | ❓ ⚠️ — Clerk login; supply working email-login creds |
| 🔁 | Sign-in required note for reviewer | ❓ — explain Apple/Google/email options |
| 🔁 | Version release option (manual / auto / phased) | ❓ |
| 🔁 | Export compliance answered (or `ITSApp…=false`) | ⚠️ |

---

## 6. App Privacy ("nutrition label")  (1️⃣, update if SDKs change) — **required before first submission**

Declare accurately per installed SDK:
- **Clerk:** Email Address, Name, User ID → *Contact Info / Identifiers*, linked to user, app functionality + account. **Not** used for tracking.
- **RevenueCat / StoreKit:** Purchase History, RevenueCat/device ID → *Purchases / Identifiers*, app functionality.
- **Sentry:** Crash Data, Performance Data, device diagnostics → *Diagnostics*, app functionality / analytics.
- **Tracking:** **No** — no IDFA, no AppsFlyer/ad SDK, no ATT prompt needed (`expo-tracking-transparency` not installed).
- Data linked to user: yes (auth). Encryption in transit: yes. Account deletion offered: yes (provide path/URL).

---

## 7. Age rating  (1️⃣ / re-check on content change)

- ❓ Complete the age-rating questionnaire in ASC. Educational, no objectionable content → expect 4+. Re-answer if UGC/ads/gambling added.

---

## 8. ⚠️/💤 Monetization — StoreKit IAP & subscriptions  (BLOCKING if paywall goes live)

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| ⚠️ | Auto-renewable subscriptions created in ASC | ⚠️ none | ASC → Monetization → Subscriptions; group + `pmp_pro_weekly`, `pmp_pro_monthly` |
| ⚠️ | Non-consumable for lifetime (if used) | ⚠️ none | `pmp_pro_lifetime` |
| 🔁 | Product IDs match code | expects the 3 above | `src/config/revenuecat.ts` → `PRODUCTS` |
| ⚠️ | RevenueCat production `appl_…` iOS key in build | ⚠️ test key | `REVENUECAT_API_KEYS.ios` |
| 🔁 | RevenueCat offering/entitlement `pro` → ASC products | ❓ | RevenueCat dashboard (project `0a64724c`) |
| 1️⃣ | App-specific shared secret / StoreKit config in RevenueCat | ❓ | RC → App settings (iAP) |
| 🔁 | IAPs attached to the version & submitted **with** the build (first release) | ❓ | ASC version page → In-App Purchases |
| 🔁 | Sandbox purchase verified end-to-end | ❓ | Sandbox tester via TestFlight |
| 🔁 | Restore purchases works | ❓ | profile screen |
| 🔁 | Subscription metadata (display name, review screenshot) | ❓ | each IAP needs a review screenshot or it's rejected |

> If monetization is NOT going live this release: set `EXPO_PUBLIC_REVENUECAT_ENABLED=false` for the production build and this section becomes 💤 deferred.

---

## 9. Pricing, availability & agreements

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| ⚠️ | **Free Apps agreement** active | ❓ | ASC → Business → Agreements (required to publish at all) |
| ⚠️ | **Paid Applications agreement** + Banking + Tax | ❓ ⚠️ | required before any IAP can sell (new team — likely unsigned) |
| 1️⃣ | Price tier (app = Free) | ✅ Free + IAP | ASC → Pricing |
| 1️⃣ | Availability / countries | ❓ | ASC → Pricing and Availability |
| 1️⃣ | Content rights / government / etc. | ❓ | |

---

## 10. Build upload & TestFlight  (🔁)

| ✓ | Item | Status | Verify |
|---|------|--------|--------|
| 🔁 | 1.1.0 archive built & signed (manual) | ⚠️ only 1.0.0 b1 exists | §14 recipe |
| 🔁 | Uploaded via `altool` and processed | ❓ | ASC → TestFlight; wait for "processing" → done |
| 🔁 | Export compliance cleared for the build | ⚠️ | set `ITSApp…=false` or answer per build |
| 🔁 | Internal TestFlight smoke test | ❓ | install, login (all 3 methods), core flow, purchase if enabled |
| 1️⃣ | TestFlight Beta App Review (only if external testers) | ❓ | not needed for internal-only |

---

## 11. Submit for review  (🔁)

| ✓ | Item | Status |
|---|------|--------|
| 🔁 | Build attached to the App Store version | ❓ |
| 🔁 | What's New filled (1.1.0) | ⚠️ stale file |
| 🔁 | Screenshots + metadata final | ✅/⚠️ |
| 🔁 | App Review demo account + notes | ❓ ⚠️ |
| 🔁 | Export compliance | ⚠️ |
| 🔁 | IAPs submitted with version (first release) | ❓ |
| 🔁 | Idempotency: version state = "Prepare for Submission" → "Submit" | ❓ |
| 🔁 | Phased release toggle decided | ❓ |

### Apple-specific rejection traps to self-check
- **4.8 Sign in with Apple** — offered (good); make sure it actually works in the build.
- **3.1.1 IAP** — anything unlocking digital content must use StoreKit IAP (no external purchase links).
- **2.1 Completeness** — reviewer can't get past Clerk login without working demo creds.
- **5.1.1 Privacy** — account-deletion path must exist in-app; privacy label must match behavior.
- **Subscription review screenshot** required for each auto-renewable IAP.

---

## 12. Legal / compliance

| ✓ | Item | Status |
|---|------|--------|
| ✅/❓ | Privacy policy live, covers all SDKs | `abovetarget.org/privacy` — verify coverage |
| ❓ | Terms of use / EULA (auto-renew subs need ToS w/ required clauses + links in metadata) | ❓ |
| ❓ | Account deletion (in-app) | ❓ ⚠️ |
| ✅ | Not child-directed (no Kids Category obligations) | ✅ |

---

## 13. Post-release verification

- ❓ Listing renders (icon, screenshots, description) on device.
- ❓ Install from App Store on a clean device; all three logins work.
- ❓ Sentry receiving production iOS events.
- ❓ (If monetized) real purchase completes and unlocks `pro`; restore works.
- ❓ Monitor crash-free rate + review/ratings.

---

## 14. Reference — manual build & upload recipe (the gotchas, all real)

> `ios/` is CNG/gitignored; run `npx expo prebuild -p ios` if absent. Build with **manual** signing.

```bash
# 0. Prereqs: WWDR G6 intermediate imported; dist cert + "PMP App Store" profile in keychain;
#    p8 staged at ~/.appstoreconnect/private_keys/AuthKey_G3CD625ZNS.p8
export SENTRY_DISABLE_AUTO_UPLOAD=true     # else "Bundle RN code and images" phase fails (no SENTRY_AUTH_TOKEN)

# 1. Archive with MANUAL signing (Expo Release config otherwise picks "iPhone Developer")
xcodebuild -workspace ios/PMPExamPro.xcworkspace -scheme PMPExamPro \
  -configuration Release -archivePath build/PMPExamPro.xcarchive archive \
  CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY="EA8E1E06DD90AEC049BD9C9381E8E4E0BA44A598" \
  PROVISIONING_PROFILE_SPECIFIER="PMP App Store"
#  (CompileAssetCatalogVariant can flake once on Xcode 26 — just retry)

# 2. Export the .ipa (ios/ExportOptions.plist: method app-store-connect, manual)
xcodebuild -exportArchive -archivePath build/PMPExamPro.xcarchive \
  -exportOptionsPlist ios/ExportOptions.plist -exportPath build/export

# 3. Upload to App Store Connect
xcrun altool --upload-app -f build/export/PMPExamPro.ipa -t ios \
  --apiKey G3CD625ZNS --apiIssuer 48d421d0-29a7-4799-97ee-4330306500d9

# Metadata + screenshots (saves as draft, no submit):
fastlane ios upload_metadata      # deliver lane in fastlane/Fastfile (metadata_path fastlane/ios/metadata)
fastlane ios upload_screenshots   # screenshots only
```

**Key files / locations (iOS)**
- ASC creds: `AuthKey_G3CD625ZNS.p8` (repo root, gitignored; also `~/.appstoreconnect/private_keys/`)
- Signing in Fastfile: `ASC_KEY_ID=G3CD625ZNS`, `ASC_ISSUER_ID=48d421d0-…`, `app_store_connect_api_key(...)`
- Metadata: `fastlane/ios/metadata/en-US/` · Screenshots: `fastlane/ios/screenshots/en-US/`
- Export config: `ios/ExportOptions.plist`
- Shared with Android: `app.json`, `src/config/revenuecat.ts`, `.env`, signing material in `/tmp/pmp-signing/`

**ASC facts (last review):** App ID `6782658779`, SKU `pmpexampro2026`; current build v1.0.0 (1) in TestFlight/processing; **no App Store version released yet**; 0 IAP products. `eas submit` iOS config is unset (placeholders) — use the manual `altool` path above.

---

*Status marks reflect 2026-06-22. This is a first App Store release: re-verify all ❓ before "Submit for Review". See the sibling `google-play-publish-checklist.md` for the Android side.*
