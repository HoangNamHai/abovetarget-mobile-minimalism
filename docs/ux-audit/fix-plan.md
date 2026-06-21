# PMP Exam Pro — Fix Plan

Findings from `audit-report.md`, regrouped into impact-ordered phases. Effort: **S** ≤30 min · **M** ~1–3 h · **L** ≥half-day.

## Phase 1 — Correctness & brand integrity (do first)

| # | Finding | Change | Files | Effort |
| --- | --- | --- | --- | --- |
| 1 | **L2** Orphaned final practice question | Reorder each lesson's screens so `practice` precedes the terminal `wrap` (wrap becomes last). Data migration across all lessons; add a guard/test asserting `wrap` is last. | `assets/data/*.json` (~51), test in `src/data/__tests__/` | M |
| 2 | **C1/L3** Quiz selection is blue | Change selected-answer background/border from blue to ink (`TOKENS.primary`) with white text — matches onboarding selected state. | quiz option component (`src/components/lesson/screens/QuestionRunner.tsx` / `QuizOption`) | S |
| 3 | **C1/H2** Profile switches iOS-green | Tint `Switch` `trackColor`/`thumbColor` to ink/grey. | `src/app/(tabs)/profile.tsx` (or shared toggle) | S |
| 4 | **C2/O1** Onboarding illustrations | Add a reusable illustration/graphic slot to onboarding screens and fill the empty voids: lesson art on the narrative screens (`story-concept`, `story-cast`, `splash`), and a large editorial graphic (oversized numeral/icon) on the `fact-*` screens. | `src/components/onboarding/*`, `src/app/(onboarding)/*.tsx`, asset wiring | L |

## Phase 2 — Polish & consistency

| # | Finding | Change | Files | Effort |
| --- | --- | --- | --- | --- |
| 5 | **H1** Zero-heavy first-run | Suppress/soften zeros on first run: hide the milestone progress bar until ≥1 lesson; swap "0 DAYS" block for an encouraging first-run nudge. | `src/components/dashboard/MonographDashboard.tsx` | M |
| 6 | **O3** Multi-select uses radio | Use square/check indicators for the multi-select screen. | `why-certified.tsx` / shared option row | S |
| 7 | **O2** Progress bar inconsistency | Show the funnel progress bar (or a deliberate "intro" treatment) on `splash`/`story-concept`/`story-cast`. | onboarding progress component + first 3 screens | S |
| 8 | **O5** Reminder picker layout | Tighten vertical rhythm: group the "8:00 PM" summary with the wheel; remove the dead gap. | `src/app/(onboarding)/reminder.tsx` | M |
| 9 | **V1** Paywall comma decimals | Verify price string source; format with the correct locale decimal separator (or trust the store-provided localized string). | `src/components/paywall/Paywall.tsx` | S |

## Phase 3 — Nice-to-have

| # | Finding | Change | Files | Effort |
| --- | --- | --- | --- | --- |
| 10 | **O4/L5** Empty bottom voids | Center option groups / balance vertical rhythm on sparse selection + challenge-intro screens. | onboarding + lesson intro screens | M |
| 11 | **L4** Drag-drop accessibility | Add `accessibilityLabel`/`testID` to sort chips and drop zones; expose an a11y-operable reorder path. | drag-drop question component | M |
| 12 | **O6** Funnel length | Consider consolidating some `fact-*` interstitials or making them swipeable. | onboarding routing | M |

## Applied in this pass
See the commit(s) on branch `audit/ux-fixes`. Phase 1 items + selected Phase 2 quick wins were applied and verified on the simulator; the rest are documented here for follow-up.
