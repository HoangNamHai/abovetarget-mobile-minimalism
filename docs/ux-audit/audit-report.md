# PMP Exam Pro — UI/UX & Feature Audit

- **Date:** 2026-06-21
- **Scope:** Whole app — onboarding funnel (15 screens), Home/Lessons/Profile/Paywall, and lesson flow (driven on lessons A1L2 + B1L1; lesson 1 deliberately skipped).
- **Method:** Drove the **running** dev-client app on the iOS Simulator (iPhone 17, iOS 26) via deep links + synthetic tap/swipe input. Captured 39 screenshots (`docs/ux-audit/screenshots/`), viewed each, and scored against the rubric (visual hierarchy, consistency, copy/voice, affordance/feedback, accessibility, flow, state coverage, brand fidelity).
- **Build:** Metro dev build, fresh (zeroed) progress for empty-state coverage; representative sample data used where noted.

---

## Executive summary

The app has a **genuinely strong foundation**: a distinctive monochrome editorial aesthetic, excellent Anton typography, beautiful lesson illustrations, sharp empathetic microcopy, and a psychology-informed onboarding funnel. The story-based, learn-by-doing pedagogy is well realized and differentiated.

The issues cluster into three themes:

1. **A real flow bug** — every lesson ends on an orphaned, unreachable practice question (the "Lesson Complete!" screen is terminal and sits *before* it).
2. **Brand drift in color** — the lesson flow and Profile introduce blue / green / red / iOS-green that aren't in the monochrome-plus-gold system.
3. **Onboarding is visually barren** — 14 of 15 screens are text on white with large empty voids; only the final screen uses imagery (and it's excellent).

### Counts by severity

| Severity | Count |
| --- | --- |
| **P0** (blocker) | 0 |
| **P1** (trust/conversion/flow) | 4 |
| **P2** (functional polish) | 7 |
| **P3** (nitpick) | 3 |

---

## Findings at a glance

| ID | Sev | Area | Finding |
| --- | --- | --- | --- |
| L2 | P1 | Lesson | "Lesson Complete!" (wrap) screen is terminal but sits before a final `practice` question → that question is **unreachable** in every lesson |
| C2 | P1 | Onboarding | No illustrations/graphics on 14 of 15 screens; large empty voids |
| C1 | P1 | Cross-cut | Off-brand colors: quiz selection = **blue**, correct/wrong = **green/red**, Profile switches = **iOS green** (system is monochrome + gold) |
| H1 | P1 | Home | First-run empty state is zero-heavy (0 DAYS, 0, 0%, milestone "0% of the way") — deflating |
| O2 | P2 | Onboarding | Progress bar missing on first 3 funnel screens (splash, story-concept, story-cast), present from exam-date on |
| O3 | P2 | Onboarding | `why-certified` says "Pick all that apply" but uses **radio-style** circular indicators (implies single-select) |
| O5 | P2 | Onboarding | Reminder time-picker: "8:00 PM" label is detached from the wheel pinned to the bottom; awkward vertical gap |
| V1 | P2 | Paywall | Prices render with **comma decimals** ("US$6,00", "US$9,99") |
| L4 | P2 | Lesson | Drag-drop chips expose no accessible text/testID → not operable by assistive tech, not testable |
| O4 | P2 | Onboarding | Selection screens with few options leave large bottom voids (top-aligned) |
| L3 | P2 | Lesson | Quiz selected-answer color (blue) diverges from onboarding selected-state (black) |
| O1 | P3 | Onboarding | `fact-*` screens are stat-only with ~50% dead space |
| O6 | P3 | Onboarding | Funnel is 15 screens; several `fact-*` interstitials could be consolidated |
| L5 | P3 | Lesson | Challenge intro / some question screens have large empty voids below the action button |

---

## Cross-cutting findings

### C1 (P1) — Color drift from the monochrome + gold system
The design system is ink (`#000`/`#1a1c1c`) on near-white, with a single **gold** premium accent (the new Home upgrade block and onboarding `domain` badge). The lesson flow and Profile break this:
- **Quiz selected answer** is bright **blue** (`les2-09`, `les2-15`) — yet onboarding selected states use **black** (`onb-06`, `onb-08`, `onb-14`). Two different selection visual languages.
- **Correct/wrong feedback** uses **green** (`les2-11`) and (by inference) red — semantic, but adds two more non-system colors.
- **Profile** Haptics/Sounds/Notifications switches are **iOS green** (`app-05`) — the only green chrome in an otherwise monochrome app.

Recommendation: make quiz selection **ink/black** (match onboarding); tint Profile switches to ink. Keep green/red for answer correctness (semantic + accessibility) but treat them as the *only* sanctioned semantic colors and document them.

### C2 (P1) — Onboarding lacks illustration/graphic treatment
Across 15 onboarding screens, only the final `domain` screen (`onb-15`) uses imagery — and it's beautiful (the lesson illustration art + "RECOMMENDED FOR YOU" badge). Every other screen is text + buttons on white with large empty regions, especially the narrative intros (`splash`, `story-concept`, `story-cast`) and the four `fact-*` stat screens. The app already owns rich illustration assets; the onboarding doesn't use them.

---

## Screen-by-screen

### Onboarding (`onb-01` … `onb-15`)
- **Strengths:** Excellent voice ("I'M COMMITTED", "You're not alone — we'll break it into daily wins", "The clock is ticking"); strong Anton headlines; smart funnel psychology (motivation → confidence baseline → belief/overwhelm → commitment); good interactive patterns (1–5 confidence ratings, day pills, pace selector). The `domain` screen is a high point.
- **O1/C2 (P1→P3):** Barren screens, biggest offenders `splash`, `story-concept`, `story-cast` (narrative — beg for the Savory & Co. illustrations) and `fact-exam/social/study/content` (a stat marooned in white). `screenshots: onb-01..03, 05, 07, 09, 11`.
- **O2 (P2):** No progress bar on `splash`/`story-concept`/`story-cast`; it appears from `exam-date`. Either show it throughout the funnel or clearly mark the first three as a pre-funnel intro.
- **O3 (P2):** `why-certified` is multi-select ("Pick all that apply") but uses circular radio indicators → looks single-select. Use square/check indicators. `onb-06`.
- **O4 (P2):** `experience`, `belief`, `commit` top-align few options, leaving large bottom voids. Center the option group or add a supporting visual.
- **O5 (P2):** `reminder` — the "8:00 PM" summary sits high while the time wheel is pinned to the bottom with a big empty gap between; reads as two disconnected controls. `onb-13`.

### Home (`app-01`, `app-02`)
- **Strength:** Clean editorial dashboard, strong streak hierarchy, gold "Continue Learning" imagery.
- **H1 (P1):** First-run is wall-to-wall zeros — "0 DAYS", "0", "MASTERY 0%", "NEXT MILESTONE: BEGINNER · 0% of the way", every domain 0%. It reads as broken/empty rather than "new". Add a first-run treatment: encouraging copy, suppress the milestone bar until ≥1 lesson, or a "start here" nudge.

### Lessons list (`app-03`, `app-04`)
- **Strength (L1):** The strongest screen in the app — full-bleed illustrated lesson cards, consistent metadata (domain · minutes · id). No issues.

### Profile (`app-05`)
- Clean settings; Plan/Restore/Sign-In, preferences, about, version. **C1:** switches are iOS green (off-brand).

### Paywall (`app-06`)
- Matches the Home upgrade CTA voice. **V1 (P2):** prices show comma decimals ("US$6,00"). Verify against real store locale formatting; if app-formatted, use the device locale's decimal separator correctly. Weekly is the pre-selected (most expensive per-month) tier — consider defaulting to annual/lifetime with a savings badge (conversion).

### Lesson flow (`les2-01` … `les2-16`, `les-wrap`)
- **Strengths:** Story hook with illustration + quote card + Quick-Jump nav (`les2-01..03`); accordion theory (`les2-05/06`); scenario-framed questions (`les2-07/08`); clear feedback with PMP rationale + points (`les2-11`); varied item types incl. drag-drop sort (`les2-12`). Pedagogically excellent.
- **L2 (P1):** **Screen order bug.** Every lesson is `hook → challenge → reason → transfer → wrap → practice`. `WrapScreen` ("Lesson Complete!", score, key takeaways — `les-wrap`) is **terminal** (its buttons are "Next Lesson" / "Back to Lessons", both leave the lesson). So the final `practice` screen (index 5) is **never reached in linear play** — orphaned content on all ~51 lessons. Reorder so `practice` precedes `wrap` (wrap last).
- **L3/C1 (P2):** Quiz selection is blue (`les2-09`).
- **L4 (P2):** The drag-drop sort (`les2-12`) couldn't be driven by accessible text — chips expose no label/testID. This is an accessibility + testability gap, not only a tooling one.
- **L5 (P3):** Challenge intro (`les2-07`) and some question screens have large empty voids below the primary button.

---

## What's working well (keep)
- Distinctive monochrome editorial brand + Anton display type.
- Microcopy and voice — among the best parts of the app.
- Lesson illustrations and the Lessons list.
- Story-based, scenario-driven, learn-by-doing pedagogy with clear rationale + gamified points.
- Onboarding funnel structure and psychology.
- The `domain` onboarding screen — the template the rest of onboarding should follow.

---

## Coverage notes (honest)
- **Driven on iOS Simulator, not Android** (the device the user had ready). Behavior is RN/Expo-shared, but native back-gesture, OS notification-permission priming, and Android status-bar contrast were **not** verified.
- **Drag-drop sort not completed** — chips aren't operable via synthetic input or accessible text (itself finding L4). Captured as a representative state.
- **In-progress persistence on background/kill not tested** this pass.
- Wrap-screen score showed 0% because it was reached via instrumented jump, not by answering — not a finding.
- Onboarding screens were reached via direct deep links; a couple show a persisted prior selection rather than a pristine empty state.
