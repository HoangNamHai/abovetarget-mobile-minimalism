# PMP Exam Pro ("Monograph") — UX/UI Audit

- **Date:** 2026-06-19
- **Scope:** Full first-run journey — onboarding → home → lessons list → lesson player (hook + challenge questions) → profile. Goal: surface high-severity UX/UI issues before launch.
- **Method:** Drove the **running** app live, screenshotting and visually evaluating each screen, then traced findings to source. Maestro for interaction, `xcrun simctl` for capture, accessibility-tree dumps to test reachability.
- **Build:** Expo dev-client on **iPhone 17 simulator, iOS 26.0**, JS served live from Metro for this repo (`monograph-elite-native`). New Architecture enabled; `@gorhom/bottom-sheet` 5.2.14, Reanimated 4.3.1, RN 0.85.3.
- **Screenshots:** `docs/ux-audit/screenshots/` (numbered in journey order).

> Platform note: the bundled skill targets Android; the live Metro instance was building for the iOS simulator, so the app was audited there. Rubric and journey map transfer 1:1.

> **Update 2026-06-19 (round 1) — text-clipping/readability fixes applied & re-audited.** **H-01** (clipped hero stats) and the Anton glyph-clipping across all display text are fixed via a min line-height (1.35×) safety net in the `Txt` primitive plus explicit line-heights on className-sized headings; the tiny arena subtitle ("Interpersonal Leadership" 9px→13px) and labels were enlarged. **L-03** (lesson headings under the status bar) is fixed with a top safe-area inset in `LessonPlayer`. Re-audited live (`screenshots/19b`, `20`, `22`, `23`, `24`).
>
> **Update 2026-06-19 (round 2) — lesson core loop fixed & re-audited.**
> - **L-01 (P0) FIXED** — `FeedbackModal` rewritten from `@gorhom/bottom-sheet` to a native RN `Modal`. The feedback sheet now presents reliably ("EXCELLENT WORK." / "NOT QUITE." / "HERE'S THE ANSWER." with Continue/Try Again), and **Continue advances to the next question** — verified end-to-end (`screenshots/26`, `27`). The soft-lock is gone.
> - **L-02 (P1) FIXED** — new dependency-free `RichText` primitive parses `**bold**`; applied to Hook/Reason/Wrap body text, takeaways, and feedback explanations. Literal asterisks no longer render (`screenshots/25`).
> - **L-05 (P2) FIXED** — `LessonPlayer` now has a persistent header with a close (✕) button (`exitLesson()` + `router.back()`) and a progress bar bound to lesson `progress` (`screenshots/25`–`27`).
> - Test gap closed: the shipped `react-native-safe-area-context` jest mock was added; all 41 lesson/primitive tests pass. (`@gorhom/bottom-sheet` is no longer used by the app; its root provider is now dead code and can be removed.)
>
> Remaining open items below: **O-01** (dead reminder step), **A-01** (a11y labels), **L-04** (placeholder drag-drop content), **H-02/H-03** (branding/arena copy), **P-01** (Profile gaps), **O-02/O-03**.

---

## Executive summary

The app has a **genuinely strong editorial identity** — Anton/Hanken type pairing, strict monochrome palette, generous whitespace, crisp onboarding copy, and an illustrated lessons list that feels premium. The onboarding flow is short, well-written, and persists correctly across app kills.

However, the audit found a **P0 that makes the core product loop unusable**: after answering *any* challenge question and tapping "Check Answer", the feedback sheet never appears and the lesson **soft-locks with no in-app recovery** (even the iOS back gesture is blocked — the app must be force-quit). Lessons cannot be completed. Alongside this sit four P1s that undermine trust and polish on every screen of the learning experience: raw `**markdown**` leaking into all lesson text, headings colliding with the status bar/dynamic island, clipped hero numerals on the dashboard, and a non-functional "daily reminder" onboarding step (no permission requested, no notification ever scheduled).

### Headline counts by severity

| Severity | Count | Examples |
| --- | --- | --- |
| **P0 — blocker** | 1 | Lesson feedback sheet never presents → lessons uncompletable, hard soft-lock |
| **P1 — trust/conversion** | 4 | Markdown leak, status-bar collision, clipped hero stats, dead reminder step |
| **P2 — functional polish** | 7 | A11y tree empty, malformed drag-drop content, brand copy, "Join Arena" dead-end, no lesson exit/progress, Profile gaps, reminder-time copy mismatch |
| **P3 — nitpick** | 2 | Onboarding radio affordance, dev LogBox toast overlapping CTAs |

---

## Findings at a glance

| ID | Sev | Screen | Issue |
| --- | --- | --- | --- |
| L-01 | P0 | Lesson / question | Feedback sheet never presents after "Check Answer" → hard soft-lock, lessons uncompletable |
| L-02 | P1 | Lesson (all) | Raw `**markdown**` renders as literal asterisks (3,088 occurrences across content) |
| L-03 | P1 | Lesson (all) | No safe-area inset → heading/question text collides with status bar & dynamic island |
| H-01 | P1 | Home | Hero stats clipped — `lineHeight == fontSize` on Anton ("0 DAYS"→"U DAYS", "0 PTS"→"U PTS") |
| O-01 | P1 | Onboarding | "When should we remind you?" is a dead control — no permission requested, no reminder scheduled |
| A-01 | P2 | Lesson (all) | Lesson content not exposed to accessibility tree; options/chips/buttons lack labels |
| L-04 | P2 | Lesson | Malformed drag-drop content shipped (placeholder chip "Chip" → "description" zone) in A1L4/A1L2 |
| H-02 | P2 | Home | Off-brand copy: "COMPETE WITH TOP-TIER MONOGRAPHS FOR INDUSTRY DOMINANCE" |
| H-03 | P2 | Home | "Join Arena" / "Challenge Arenas" promise a feature that just opens the lessons list; "nearing professional tier" at 0 pts |
| L-05 | P2 | Lesson | No exit/close affordance and no progress indicator within a multi-section lesson |
| P-01 | P2 | Profile | No Sign Out / Restore Purchases / Terms & Privacy; Notifications toggle is non-functional |
| O-02 | P2 | Onboarding | Reminder copy times (8:00/12:30/7:00) don't match the code mapping (9:00/12:00/20:00) |
| O-03 | P3 | Onboarding | Unselected single-select options show no empty radio affordance |
| S-01 | P3 | Global (dev) | Dev LogBox warning toast overlaps CTAs and the tab bar; warnings are firing |

---

## Cross-cutting findings

### L-01 · P0 · Lesson feedback sheet never presents → hard soft-lock
**Screenshots:** `11-challenge-q1` → `13/13b/13c-q1-feedback` → `14-after-feedback-probe` → `15-after-swipe-recover`.

After selecting an answer and tapping **Check Answer**, the `@gorhom/bottom-sheet` `FeedbackModal` (snapPoints `['75%']`) is "presented" but renders **invisibly / zero-height** — no "EXCELLENT WORK." sheet, no Continue button. Confirmed across 5+ captures over ~15 s:
- The "Check Answer" button is consumed (state advanced to "answered"), so there is no longer any visible control.
- The accessibility tree contains **only OS status-bar elements** — neither the modal's content (`Continue`) nor the underlying question is reachable. The modal is on top and inert.
- `tapOn "Continue"` is not found; swipe-down does not dismiss; **the iOS left-edge back gesture is also blocked** by the modal. The only escape observed was navigating away through a prior stack entry (losing lesson progress); a real user would have to force-quit.
- The screen-level fallback Continue button (`QuestionRunner.tsx:56`) is gated on `!state.modalVisible`, and `modalVisible` stays `true` while the invisible sheet is "presented" — so the safety net never renders.

**Why it shipped:** the unit tests mock `BottomSheetModal`/`BottomSheetView` with plain `View`s (`FeedbackModal.test.tsx`, `LessonPlayer.test.tsx`), so they pass while the real on-device sheet fails. Likely root cause is the `BottomSheetView` `flex:1` content under a fixed percentage snapPoint with `enableDynamicSizing={false}`, compounded by gorhom v5 behavior on the New Architecture (Reanimated 4 / worklets).

**Impact:** the entire core loop (lessons) is unusable. This must be fixed and verified on a **release build** before any launch.

### L-02 · P1 · Raw markdown leaks into all lesson text
**Screenshots:** `10-lesson-hook`, `16-after-exit-lesson`.

Lesson copy authored with markdown emphasis renders literally: `**Alex Mitchell**`, `**PMs lead through INFLUENCE, not command.**`, `**Not all projects are the same.**`. There is **no markdown renderer** anywhere in `src/components/lesson` — `HookScreen` puts `intro`/`learning_hook` straight into `<Txt>`. There are **3,088 `**` markers across `assets/data/*.json`**, so virtually every lesson is affected. Highly visible; reads as broken/unfinished.

### L-03 · P1 · Lesson screens collide with the status bar / dynamic island
**Screenshots:** `10-lesson-hook`, `11-challenge-q1`, `16-after-exit-lesson`.

Lesson screens use a bare `ScrollView` with `padding:24` and **no `SafeAreaView`/top inset** (`HookScreen.tsx:18`, question screens). The heading renders at y≈0, so on the challenge screen the question text literally overlaps the clock ("22:38"), the dynamic island, and the battery icon — the single most important element on the screen is partly unreadable. Affects every lesson screen.

### A-01 · P2 · Lesson content is invisible to assistive tech
**Evidence:** accessibility-tree dumps on the question and drag-drop screens returned **zero** app content (only status-bar nodes), despite visible text. Quiz options, drag-drop chips, and the primitive `Button` expose no `accessibilityLabel`/`testID` (drag-drop only tags zones/placed chips, not tray chips). Tab-bar items are not matchable by their visible labels either. VoiceOver users cannot read or operate lessons; it also makes the app hard to test (every interaction above had to fall back to coordinates).

---

## Screen-by-screen

### Onboarding — `src/app/(onboarding)`
**Strong overall.** Splash (`01-onboarding-splash`), "How it works" (`02-welcome`), "Daily goal" (`03-goal-selection`, "2 per day" pre-selected as recommended — good), "Daily reminder" (`04-reminder`). Clean hierarchy, consistent layout, confident copy.

- **O-01 · P1 — dead reminder step.** `question-reminder.tsx:26` `handleFinish()` calls `completeOnboarding()` (which takes no arguments) and routes home; the selected reminder is discarded. `scheduleDailyReminder()` is called **0 times** anywhere in `src/`, the notification service is never instantiated, and `requestPermission()` is never invoked. No OS permission prompt appears (`05-permission-prompt` shows "Setting up…" → straight to home, `05b-after-begin`), and no reminder is ever scheduled. A core onboarding promise is non-functional.
- **O-02 · P2 — reminder time copy mismatch.** Options read 8:00 AM / 12:30 PM / 7:00 PM, but `TIME_MAPPING` (notifications.ts) uses 9:00 / 12:00 / 20:00. Latent today (nothing fires); fix alongside O-01.
- **O-03 · P3 — affordance.** Unselected single-select rows show no empty radio/marker; only the selected row gets an indicator, so the control doesn't read as a picker until acted on.

### Home / Dashboard — `src/components/dashboard/MonographDashboard.tsx`
**Screenshots:** `00-current-state`, `05b-after-begin`, `06-home-top`.

- **H-01 · P1 — clipped hero stats.** `fontSize:64/lineHeight:64` and `fontSize:40/lineHeight:40` on the Anton face clip glyph tops; "0 DAYS" reads as "U DAYS" and "0 PTS" as "U PTS" — on the most prominent numbers on the screen.
- **H-02 · P2 — off-brand copy.** "JOIN THE GLOBAL ARENA. COMPETE WITH TOP-TIER MONOGRAPHS FOR INDUSTRY DOMINANCE." (line 219). "Monograph" is the product, not a competitor — reads as leftover template copy. (EliteDashboard's equivalent line says "ELITE PROFESSIONALS".)
- **H-03 · P2 — feature promise vs. reality.** "Join Arena" and the "Challenge Arenas" section imply a competitive/leaderboard feature, but the CTA just `router.push('/(tabs)/lessons')`; the arena rows are static (non-interactive) 0% bars. Also the milestone card tells a brand-new (0 pt) user "You are nearing the professional tier."

### Lessons list — `src/app/(tabs)/lessons.tsx`
**Screenshot:** `08-lessons-list`. **Working well** — "FOUNDATION / Introduction to Project Management" module header, illustrated thumbnails, clear title + domain + duration. Good visual hierarchy; no issues beyond the global A-01 (tab labels not matchable).

### Lesson player — `src/components/lesson/`
**Screenshots:** `10-lesson-hook`, `11–15` (challenge + soft-lock), `16/17b` (second lesson + drag-drop).
- L-01 (P0), L-02 (P1), L-03 (P1), A-01 (P2) all manifest here.
- **L-04 · P2 — malformed content.** The drag-drop in `A1L4.json` (and `A1L2.json`) ships a placeholder chip `{id:"chip", label:"Chip", correctZone:"description"}` plus a placeholder "Correct Zone / Description" drop zone (`17b-state`) — a half-authored question.
- **L-05 · P2 — navigation/feedback.** No visible exit/close control and no progress indicator (e.g. "Step 3 of 6") within a multi-section lesson; the user can't tell how far they are or how to leave.

### Profile — `src/app/(tabs)/profile.tsx`
**Screenshot:** `18-profile`. Clean; correctly respects safe area (unlike lesson screens).
- **P-01 · P2.** Account "Status: PREMIUM" for a brand-new user (intended — RevenueCat disabled, `isPremium` defaults true while dormant; gate before launch). Preferences toggles for Haptics/Sounds/**Notifications** — the Notifications toggle has no effect given O-01. Missing **Sign Out**, **Restore Purchases**, and **Terms/Privacy** links — an App Store review risk for a subscription app.

---

## What's working well (don't regress these)

- **Distinctive editorial design** — Anton + Hanken Grotesk, strict monochrome, confident whitespace. Looks premium and intentional.
- **Onboarding copy & pacing** — short, motivating, sensible defaults; "Consistency beats intensity. A nudge goes a long way."
- **Lessons list** — illustrated, scannable, well-structured.
- **Clear selection states** — quiz options fill solid black when chosen (`12-q1-selected`).
- **State coverage** — explicit loading copy ("Setting up…", "Loading…").
- **Persistence** — completing onboarding survives a full app kill (relaunch → Home, not onboarding).

---

## Coverage notes (honest)

- Audited on **iOS (iPhone 17, iOS 26)**, the live Metro target — not Android. Rubric/journey transferred directly.
- **Could not reach** the Reason / Transfer / Practice / Wrap screens or any success-feedback content: the **L-01 P0 blocks all progression** past the first answered question.
- The **drag-drop interaction was not driven** — its chips expose no accessible text (finding A-01). Captured as a representative state.
- L-01 is confirmed by live reproduction + source analysis; **final confirmation on a release/production build is recommended**, since gorhom + New Architecture behavior can differ from a dev client.
- The blue "Refreshing…" banner seen on relaunch is the **Expo dev-client fast-refresh indicator** (no such string exists in `src/`) — a dev-only artifact, excluded from findings.
