# PMP Exam Pro — UX Audit (Android)

| | |
|---|---|
| **Date** | 2026-06-20 |
| **Build** | `monograph-elite-native` @ `feat/learning-ux-overhaul`, Expo SDK 56, dev client (live Metro bundle) |
| **Device** | Genymotion Google Nexus 6 · Android 13 / API 33 · 1440×2560 |
| **Method** | Live app driven over adb; every screen screenshotted to `screenshots/` and visually reviewed against the rubric (hierarchy, consistency, copy/voice, affordance/feedback, accessibility, flow, state coverage, brand) |
| **Scope** | Onboarding → Home → Lessons → full Lesson (Hook · Challenge · Theory · Transfer) → Profile/Settings |
| **Note** | Companion to the 2026-06-19 iOS audit (`audit-report.md`). This pass is Android-specific and re-verifies on a real device. |

## Executive summary

This is a **strong, well-crafted product**. The lesson engine in particular is excellent: a narrative spine ("Alex's first day at Savory & Co."), comic-panel storytelling, retrieval practice across three question formats, in-character feedback that calls back to earlier story beats, expandable theory, and a transfer phase that re-applies the concept to a fresh scenario. Interactive elements are accessibility-labeled, lesson state survives backgrounding, and dark mode is fully functional.

No blockers found. The issues are polish-level: a clipped onboarding option, a primary CTA that sits below the fold on long questions, and a tonal clash between the calm onboarding voice and the aggressive "ELITE / CONQUER" home dashboard.

**Findings by severity:** P0: **0** · P1: **0** · P2: **4** · P3: **4**

## Findings at a glance

| ID | Sev | Screen | Issue |
|----|-----|--------|-------|
| O1 | P2 | Reminder | 4th option ("No reminders") clipped behind the floating "Start Learning" CTA |
| V1 | P2 | Onboarding→Home | Voice whiplash: calm/supportive onboarding vs aggressive gamified home |
| L1 | P2 | Lesson question | "Check Answer" CTA sits below the fold on 4-option questions; full button only after scroll |
| H2 | P2 | Home | Streak/stats don't reflect mid-lesson XP (500 XP earned, Home still "0 DAYS") |
| O2 | P3 | Onboarding | Status-bar contrast: white clock/icons over bright illustration tops (slides 1 & 3) |
| V2 | P3 | Navigation | Post-onboarding lands on Lessons tab; fresh relaunch lands on Home tab |
| H1 | P3 | Home | Jargon ("sectors", "arenas") relationship to lesson "paths" is unclear |
| L2 | P3 | Lesson | Brief overlapping-text artifact during section transitions |

## Cross-cutting findings

**V1 — Two personalities (P2).** Onboarding speaks softly: *"A gentle nudge to keep your streak alive,"* *"You can always adjust later."* The Home dashboard then shouts: **ELITE STATS**, **CHALLENGE ARENAS**, **CONQUER ALL SECTORS**. Both are good in isolation, but the seam between them reads like two different apps. Pick one voice (the calm, confident onboarding tone is the stronger brand fit) or deliberately bridge the two.

**L1 — Primary action below the fold (P2).** On 2-option questions the "Check Answer" button is reachable immediately. On 4-option questions the four cards push the button off-screen; before the user scrolls, its hit-target appears as a thin sliver (observed 38–84px tall mid-animation). The single most-tapped control in the lesson should never require a scroll. A sticky footer fixes every question variant at once.

## Screen-by-screen

### Onboarding
- **Slides 1–3** (`01`,`02`) — Strong illustrated value props ("Built for the Real Exam" / "One Coffee Break, One Lesson Done" / "Progress You Can Feel"). Both swipe and the **Next** CTA advance correctly (verified). **O2 (P3):** white status-bar time/icons sit over bright sky/wall areas — marginal contrast.
- **Pick your pace** (`03`) — Clean. "15–20 min" pre-selected with a *Recommended* badge; *"You can always adjust later"* reduces commitment anxiety.
- **When should we remind you?** (`04`) — Good: the screen itself primes the OS permission. **O1 (P2):** the 4th option ("No reminders / I'll remember on my own") is clipped behind the floating "Start Learning" button; only visible once the permission dialog dims the background.
- **Notification permission** (`05`) — Fired in-context after a time was chosen (correct priming). A "Starting…" loading state is shown — good state coverage.

### Home (`06b`, `34`)
"ELITE STATS" dashboard: current-streak counter, weekday strip, next-milestone card ("BEGINNER — reach 50% average score to unlock"), "CHALLENGE ARENAS". **H1 (P3):** "sectors"/"arenas" terminology isn't defined; unclear how it maps to lesson paths. **H2 (P2):** after earning 500 XP across a lesson, Home still showed "0 DAYS / START YOUR STREAK TODAY!" and a locked milestone — confirm whether streak/XP are meant to update only on full lesson completion, and that the user gets visible credit for partial progress.

### Lessons list (`07`)
"Master PMP concepts step by step" + a green path card + rich comic-art lesson cards with metadata chips (A1L1 · Business Environment · 8 min) and a one-line objective. Clear and inviting.

### Lesson — the standout
- **Hook** (`08`–`10`) — Narrative ("Alex's First Day: Three Failed Projects"), comic carousel with captioned panels, in-character quote card (Carlos Mendez), key-insight callout, "Learn More", and **Quick-Jump chips** (Challenge/Theory/Transfer/Practice) that work.
- **Challenge** (`11`–`27`) — 6 questions across **three formats**: single-select, **drag-drop / tap-to-place** (Triple Constraint), and scenario MCQs. Each: select → Check → feedback sheet → Next. Feedback is excellent — green "Correct!", XP reward (+80/+85/+90), plain-language explanation, and rotating in-character mentors (Carlos, Maya, Morgan) whose lines call back to earlier story beats. XP accumulated correctly 0→410. **L1 (P2)** applies here.
- **Theory** (`28`,`29`) — "Understanding PM Fundamentals" with expandable accordions (Operations, Iron Triangle, What a PM Does, Success Factors) and examples tied back to Savory & Co.
- **Transfer** (`30`–`32`) — New scenario ("Technology Upgrade at Savory & Co.") with Timeline/Budget/Scope framing and its own 2-question challenge — re-applying the concept. Pedagogically excellent.
- **Exit confirmation** (`33`) — Tapping ✕ shows "Exit Lesson? … Your progress will be saved" with Continue/Exit — good reassurance.
- **L2 (P3):** section transitions briefly overlap old content with the new header during the fade.

### Profile / Settings (`35`, `36`)
"Guest User — Sign in to sync progress" with benefit list and "Continue with Google" (Clerk). Settings: Dark Mode, Daily Reminder (Morning 9:00 AM), Haptic Feedback. **Dark Mode verified working** — toggling renders a clean, fully-themed dark UI.

## What's working well
- **Instructional design** — narrative + retrieval + transfer is genuinely well thought out; rare in exam-prep apps.
- **Feedback loop** — fast, rewarding, in-world, and educational.
- **Accessibility** — chips, options, switches, and buttons carry `content-desc` labels; the drag-drop zones are descriptively labeled ("What will be delivered?, 12 new seasonal dishes, Drop here").
- **Persistence** — verified: backgrounding mid-lesson preserved Q-position and XP (160) on resume.
- **Dark mode** — works and looks polished.
- **Onboarding** — recommended defaults, reassurance copy, and permission priming all done right.

## Coverage notes (honest)
- **Fully exercised:** onboarding end-to-end, permission dialog, home, lessons list, lesson hook, all 6 challenge questions (3 formats) + feedback, theory accordions, transfer intro + first transfer question, exit confirmation, profile + settings, dark mode, background/resume persistence.
- **Not reached (timeboxed):** transfer-challenge completion, the Practice section, the lesson **Wrap/completion** screen, the Google sign-in flow, and **error / offline / empty** states. These should be reviewed in a follow-up pass.
- Coordinate-based driving on the 1440×2560 device caused a few mis-taps (documented in the screenshots); none affected the findings.
