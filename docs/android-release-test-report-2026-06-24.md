# Android Release-Readiness Test — PMP Exam Pro

**Date:** 2026-06-24
**Artifact:** `pmp-1.1.0.aab` → universal APK (bundletool, debug-signed) installed on emulator
**App:** `com.h2ai.pmpexampro` · v1.1.0 · free build (RevenueCat OFF, all 51 lessons open, no paywall, no sign-in UI)
**Devices:** `Pixel_8_API_36` (1080×2400 @420dpi, API 36); small-screen layout pass via display override `720×1280 @320dpi`
**Method:** automated via adb + Maestro 2.1.0; reusable flows committed under `.maestro/release/`

---

## Verdict: ✅ Blocker fixed — release-ready pending a fresh signed AAB

The app is functionally solid and the content is clean. The one high-severity issue (blank screen on cold launch when offline/slow, caused by the whole UI being gated behind Clerk's network load) **has been fixed and verified on a rebuilt release APK** (see Blocker 1 below). Remaining before shipping: produce a fresh **signed production AAB** (`.env.production`, Play upload key) that includes this fix, and re-run the offline cold-launch check on it. Optional: address the minor accessibility gap (M1).

---

## ✅ BLOCKER 1 — FIXED & VERIFIED (2026-06-24, branch `fix/clerk-offline-blank`)

**Fix:** removed the `<ClerkLoaded>` wrapper in `ClerkGate` (`src/contexts/auth-context.tsx`) so the app renders immediately and Clerk hydrates in the background. Regression test added: `src/contexts/__tests__/auth-context-gate.test.tsx`.
**Verified on a rebuilt release APK:** airplane-mode + `pm clear` + cold launch now shows the onboarding splash ("GET STARTED") in ~9s instead of a permanent blank screen (`scratchpad/offline-after-fix.png`). Online Maestro flows `01-onboarding` and `02-tabs-profile` still PASS (no regression).

Original analysis below, kept for the record.

## 🔴 BLOCKER 1 — Blank/white screen on cold launch when offline or on a slow network

**What happens**
- Cold launch on a **stable** network → onboarding appears in ~4s. Fine.
- Cold launch while the network is **slow/flaky** → **blank screen for ~20–35s** before anything renders.
- Cold launch with **no network** (airplane mode) → **blank screen indefinitely** (never rendered in 50s+). Restoring the network makes the UI appear ~4s later (it auto-recovers).
- Affects **every cold launch**, onboarded or not — the gate sits above the router, so even the onboarding splash is blocked.

**Root cause** — `src/contexts/auth-context.tsx:20`
```jsx
<ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
  <ClerkLoaded>{children}</ClerkLoaded>   // ⟵ wraps the ENTIRE app tree
</ClerkProvider>
```
`ClerkGate` wraps the whole app (`src/app/_layout.tsx`) and `<ClerkLoaded>` renders children **only after Clerk finishes loading**, which requires a network round-trip to the Clerk API. Offline/slow → children (the whole app, including onboarding) never mount → blank screen.

**Why it matters**
- A fresh install opened on the subway / a plane / poor signal shows a blank white screen that looks like the app crashed → abandonment and 1-star reviews. A study app is frequently opened in exactly those conditions.
- **The free build has no sign-in UI at all** (auth is bypassed; profile shows only "Plan: FULL ACCESS"). So this hard network dependency delivers **zero user benefit** in the shipping configuration — it is pure downside.

**Evidence:** `scratchpad/offline-launch-sm.png` (blank), `launch_logcat.txt` (TLS/DNS failures while the app waits), repeated timing repros (4s online / 24–35s flaky / ∞ offline).

**Fix direction (low risk)**
- Don't gate the whole tree on `ClerkLoaded`. Render the app/onboarding immediately and let Clerk hydrate in the background; gate only the few auth-dependent surfaces on `isLoaded`. Or wrap `ClerkLoaded` with a timeout fallback that renders the app after N seconds.
- In the free build (no auth UI), consider not mounting `ClerkProvider` at all (`hasClerkKey()` already supports a passthrough path).

---

## 🟡 MINOR

**M1 — Accessibility: option rows & tab bar expose no text labels.**
Onboarding select rows ("When's your exam?", motivation, belief…), the rating circles, and the bottom tab items render visible text but expose **no accessibility label** to the OS tree (TalkBack can't read or select them; automation had to fall back to coordinate taps). Same issue already noted in the iOS audit (`docs/ux-audit-ios/`). Not a launch blocker, but an accessibility gap and a Play "accessibility" quality flag.

---

## ℹ️ Observations (confirm intent — not bugs)

- **No account/sign-in in the free build.** Profile → ACCOUNT shows only "Plan: FULL ACCESS"; there is no Sign In / Sign Out / email. Auth is fully bypassed. If progress-sync or accounts are expected for v1.1.0, this needs a product decision. (The planned "sign-in with demo account" test was therefore N/A for this artifact.)
- **Privacy Policy / Terms / Contact Support** links fire an external browser intent (Chrome) — wired correctly, satisfies Play's privacy-policy-link requirement. The hosted page content itself was not validated here.
- **Version** shows **1.1.0** in Profile — matches the release.

---

## ✅ What passed

| Area | Result |
|------|--------|
| Cold launch (stable net) | ✓ ~2.4s to first frame, ~4s to content, no crash |
| Onboarding (16 screens) | ✓ all value/fact/story + single-select, multi-select, 1–5 ratings, day-picker; progress bar correct |
| Notification permission (Android 13+) | ✓ prompt shown, Allow → `POST_NOTIFICATIONS granted=true` |
| Lesson player + interactive question | ✓ challenge multi-select graded end-to-end ("EXCELLENT WORK +200 pts" + explanation) |
| Lessons content — 16 sampled (2/module ×8) | ✓ all rendered real content + images, no white screens |
| Lessons content — all 51 (JSON source audit) | ✓ 51/51 match index, 486 questions each with exactly 1 correct answer, no empty/dup options, 274/274 images present, no placeholder/mojibake |
| Home dashboard | ✓ streak, today, mastery, "Continue learning", next milestone |
| Tabs navigation (Home/Lessons/Profile) | ✓ tab bar + deep links (`://home`, `://profile`, `://lesson/<id>`) |
| Profile + preference toggles (Haptics/Sounds/Notifications) | ✓ |
| Hardware Back navigation | ✓ lesson → tabs, no exit/crash |
| Background → resume | ✓ state preserved (resume can re-trigger the slow Clerk launch — see Blocker 1) |
| Rotation | ✓ app is portrait-locked (`app.json`), stays portrait, no squish |
| Small screen 720×1280 @320 | ✓ splash, belief, reminder (7 day-pills + time wheel), domain cards, commit, lesson — all clean, no overflow/clipping |
| Crash/JS-exception scan (logcat) | ✓ no app `FATAL` / `AndroidRuntime` / RN JS errors during the runs |

---

## Reusable regression suite — `.maestro/release/`

| Flow | Status |
|------|--------|
| `01-onboarding.yaml` | ✓ pass — full 16-screen walk, auto-allows the notification prompt, ends in first lesson |
| `02-tabs-profile.yaml` | ✓ pass — home dashboard + profile content + Haptics toggle |
| `03-lessons-sample.yaml` | ✓ pass — opens 16 lessons (2/module) by deep link, asserts content |
| `04-edge-cases.yaml` | ✓ pass — hardware Back + background/resume |

Run: `maestro --device <serial> test .maestro/release/`. (Cold-launch waits use a 60s timeout to tolerate Blocker 1; once that's fixed they can be tightened.)

---

## Residual manual checklist (things automation can't fully assert)

- [ ] Confirm the **Privacy Policy / Terms** URLs actually load the correct hosted pages (open them in a browser).
- [ ] **Real push notification** delivery at the scheduled reminder time on a physical device (only the permission + scheduling path was verified).
- [ ] Subjective UX feel / animation smoothness on a **real device** (tested on emulator only).
- [ ] Product decision on the **no-account free build** (Observation above).

---

## Recommendation

Fix **Blocker 1** (un-gate the app from `ClerkLoaded` / add an offline fallback) and re-test the offline cold-launch path. Optionally address **M1 (accessibility labels)** — small change, improves the Play quality profile. Everything else is green; content is clean across all 51 lessons.
