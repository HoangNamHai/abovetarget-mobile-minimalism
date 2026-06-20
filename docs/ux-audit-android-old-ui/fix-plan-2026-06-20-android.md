# Fix Plan — Android UX Audit (2026-06-20)

Findings from `audit-report-2026-06-20-android.md`, regrouped into impact-ordered phases. Effort: **S** ≈ <1h, **M** ≈ half-day, **L** ≈ 1–2 days.

## Phase 1 — Conversion & reachability (do first)

| ID | Change | File(s) | Effort |
|----|--------|---------|--------|
| L1 | Pin **Check Answer** to a sticky safe-area footer so it's reachable without scrolling on 4-option and drag-drop questions (currently below the fold). Apply once at the question-screen layout level rather than per question type. | `src/components/lesson/screens/QuestionRunner.tsx`, `src/components/lesson/screens/useQuestionScreen.ts`; verify `SingleSelect.tsx` / `MultiSelect.tsx` / `DragDrop.tsx` defer the CTA to the shared footer | M |
| O1 | Ensure the reminder list scrolls / has bottom inset so the 4th option ("No reminders") is never hidden behind the floating "Start Learning" CTA. | `src/app/(onboarding)/question-reminder.tsx` | S |
| H2 | Confirm/clarify when streak & XP update. After lesson activity, Home still read "0 DAYS / START YOUR STREAK TODAY!" despite 500 XP. Either reflect partial progress or make the "completes on full lesson" rule explicit in copy. | `src/components/dashboard/EliteDashboard.tsx`, lesson completion/XP store | M |

## Phase 2 — Voice & consistency

| ID | Change | File(s) | Effort |
|----|--------|---------|--------|
| V1 | Resolve the onboarding↔home tonal clash. Recommend softening Home toward the onboarding voice (drop "CONQUER ALL SECTORS / ELITE" militancy) or intentionally bridging the two. | `src/components/dashboard/EliteDashboard.tsx` (+ onboarding copy for reference in `src/app/(onboarding)/`) | M |
| V2 | Make the post-onboarding landing tab and the cold-launch landing tab consistent (both Home, or both Lessons — decide intent). | `src/app/index.tsx`, `src/app/(tabs)/_layout.tsx` | S |
| H1 | Define or rename "sectors"/"arenas" so their relationship to lesson "paths" is clear (microcopy or a one-line legend). | `src/components/dashboard/EliteDashboard.tsx` | S |

## Phase 3 — Polish

| ID | Change | File(s) | Effort |
|----|--------|---------|--------|
| O2 | Improve onboarding status-bar contrast over bright illustration tops — force light-content status bar with a subtle scrim, or darken the top gradient on slides 1 & 3. | `src/app/(onboarding)/index.tsx` / `welcome.tsx` | S |
| L2 | Remove the brief overlapping-text artifact during lesson section transitions (old section content overlaps the new header mid-fade) — gate content swap on the transition completing. | `src/app/lesson/[id].tsx`, `src/components/lesson/screens/*` | S |

## Phase 4 — Follow-up coverage (not bugs; gaps to review next pass)
Review on-device, then file findings as needed:
- Lesson **Wrap/completion** screen (`src/components/lesson/screens/WrapScreen.tsx`) and the **Practice** section.
- Transfer-challenge completion path.
- **Google sign-in** flow (Clerk) from Profile.
- **Error / offline / empty** states across home, lessons, and lesson player.
