# TODO — iOS App Store submission (PMP Exam Pro)

App: **PMP Exam Pro** · bundle `com.h2ai.pmpexampro` · ASC app `6782658779` · team `A2856ZD38W` (Phan Thien Dao Nguyen) · `asc` profile `PMP-DaoNguyen`
Shipping config: **free build** (RevenueCat disabled via `.env.production`) — no paywall, all 51 lessons open.

## ✅ SUBMITTED FOR REVIEW (2026-06-24)

**1.1.0 (2)** is in Apple's review queue — submission `0d4348c9-960f-464f-a566-2fa849a38f95`, state **WAITING_FOR_REVIEW**.

- [x] **App Privacy** published (Email, Name, User ID → App Functionality, linked, not tracking) — via `fastlane upload_app_privacy_details_to_app_store` + `fastlane/app_privacy_details.json`
- [x] **Submitted** via `asc submit create --app 6782658779 --version 1.1.0 --build 14ec7105-... --confirm`
- Note: orphaned empty submission `d48d40d9...` (READY_FOR_REVIEW, 0 items) lingers but is harmless.

### Next: monitor review outcome
- `asc status --app 6782658779` / `asc review history --app 6782658779`
- States: WAITING_FOR_REVIEW → IN_REVIEW → PENDING_DEVELOPER_RELEASE / READY_FOR_SALE (or REJECTED → address feedback)

## ✅ Done this round

- [x] Production build set to **free** (RevenueCat off) — verified in bundle + live iOS run (onboarding→lessons, no paywall, nothing locked)
- [x] Version bumped to **1.1.0** (Info.plist + pbxproj + app.json)
- [x] **iPad disabled** — `TARGETED_DEVICE_FAMILY="1"`, rebuilt **1.1.0 (2)** iPhone-only (`UIDeviceFamily=[1]`)
- [x] Signed device archive working via project-local keychain `signing/` (gitignored) — see memory `ios-release-build`
- [x] Uploaded **1.1.0 (2)** → VALID, attached to version record `c50a0324-...`
- [x] Encryption compliance set (`usesNonExemptEncryption=false`) via ASC API
- [x] Content rights set (`DOES_NOT_USE_THIRD_PARTY_CONTENT`)
- [x] ASC version record renamed **1.0 → 1.1.0**
- [x] iPhone screenshots 01–05 uploaded (paywall shot 06 held back — doesn't exist in free build; preserved in `fastlane/ios/_screenshots_excluded/`)
- [x] Metadata, keywords, age rating, reviewer demo account — already set

## 📋 Non-blocking follow-ups

- [ ] Bake `ITSAppUsesNonExemptEncryption=false` into `Info.plist` so export compliance is auto-answered on future builds (avoids the per-build API PATCH)
- [ ] Accessibility: onboarding single-select option rows ("When's your exam?", "overwhelming?"), domain cards, and bottom tab bar expose no accessible text labels (VoiceOver/automation can't select them) — see `docs/ux-audit-ios/`
- [ ] Security cleanup: raw unencrypted distribution key still at `/tmp/pmp-signing/dist.key` (`/tmp` world-readable) — delete `/tmp/pmp-signing/` now that signing works from `signing/`
- [ ] (Optional) Generate a free-app replacement for screenshot 06 if you want 6 screenshots
