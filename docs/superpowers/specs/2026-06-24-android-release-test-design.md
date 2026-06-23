# Android Release-Readiness Test — PMP Exam Pro

**Date:** 2026-06-24
**App:** PMP Exam Pro · `com.h2ai.pmpexampro` · Android · free build (RevenueCat OFF, 51 lessons open, no paywall)
**Goal:** Verify the release artifact has no significant bugs and the content is correct, so the app is ready to ship to Google Play. Automated end-to-end, driven by the assistant via adb; user reviews the resulting report.

## Decisions (locked)

- **Artifact:** `pmp-1.1.0.aab` (the AAB that will be submitted to Play). Convert AAB → universal APK via `bundletool build-apks --mode=universal` (signed with bundletool's debug key, which is fine for emulator install), then `install-apks`. **No dev build** — we test the real release binary (Hermes + minified).
- **Devices:** two emulators — existing `Pixel_8_API_36` (primary) **plus a second, smaller/older AVD** (lower density + smaller screen, e.g. Pixel 4 / lower API) to catch layout breakage. No physical device in scope.
- **Driver:** fully automated via adb (tap/swipe/type, screenshots, `uiautomator dump`, background `logcat`). User only reviews results.
- **Auth:** sign-in with the existing demo reviewer account `appstore.review@abovetarget.org`. No new sign-up (avoids the email-verification-code blocker).
- **Coverage:** comprehensive + edge cases.
- **Content depth:** open a **sample of 2 lessons per module** (8 modules → ~16 lesson details opened on-device), and **audit the remaining lessons directly from the JSON source** (`assets/data/*.json`, `lessons-index.json`, `src/data/questions.ts`).

## Detection method (three senses per step)

1. **Screenshot** every screen → visual review (layout overflow, clipped text, broken images, dead buttons, wrong state).
2. **`uiautomator dump`** (UI tree) → detect empty/placeholder text ("lorem", "TODO", "undefined", blank), missing accessibility labels, overlapping nodes.
3. **`adb logcat`** running in the background for the whole session, filtered for `FATAL` / `AndroidRuntime` / `ReactNativeJS` errors / `ANR` → catches crashes and JS exceptions even when the screen still looks fine.

A finding requires at least one of: a crash/exception in logcat, a visually broken screenshot, or a content defect from the UI tree / JSON audit.

## Test phases (run on BOTH emulators)

1. **Cold launch & boot** — splash renders, no crash, clean logcat, reasonable startup time, app reaches first screen.
2. **Onboarding (~16 screens)** — walk the full flow (`splash → why-certified → story-* → fact-* → belief → confidence → experience → domain → exam-date → commit → reminder`), screenshot each; exercise option selection (exam-date, experience, confidence, belief, domain) and Next/Back; confirm no dead-ends.
3. **Auth** — sign-in with demo account (happy path); wrong password shows a correct error; forgot-password screen opens. (No new account creation.)
4. **Home tab** — content renders, domain progress shows, navigation works.
5. **Lessons tab** — all 51 lessons listed; open the 2-per-module sample (~16) into lesson detail (`LessonPlayer` + `QuestionRunner`): no white screen, content renders, question→answer flow works, scoring/points behave.
6. **Profile tab** — settings render, reminder settings, sign-out returns to auth/onboarding.
7. **Edge cases (comprehensive):** Android hardware Back at every level; rotation portrait↔landscape on key screens; background → resume (state preserved); airplane-mode / offline behavior (graceful, no crash); rapid/double taps; relaunch after kill (progress/auth persists); deep links; reminder scheduling (notification permission + scheduled-time set).

## Content verification — 51 lessons

- **JSON source audit** (`assets/data/*.json` + `lessons-index.json` + `questions.ts`): count matches index (51), no empty/null required fields, no placeholder text (`TODO`/`lorem`/`undefined`/`TBD`), every question has exactly one correct answer with no duplicate options, sane field lengths, no mojibake / encoding errors, thumbnails referenced exist.
- **Render cross-check:** for the ~16 sampled lessons, confirm the on-screen content matches the JSON (no truncation, markdown renders correctly, images load).

## Deliverables

- **Findings report** with severity (🔴 blocker / 🟠 major / 🟡 minor), each with screenshot evidence, repro steps, and the relevant logcat line(s). Saved under `docs/` (or `artifacts/`).
- **Screenshot folder** per phase per device for later review.
- **Residual human checklist** (short) — items automation can't fully assert: subjective UX feel, real FCM push (if used), behavior on a physical device.
- **Verdict:** release-ready / not — and if not, the exact list of fixes required.

## Out of scope

- New-account sign-up / email verification flow.
- iOS (already near-submission).
- Paywall / purchase flows (disabled in the free build).
- Physical-device testing (no device available).
