# Phase 4 — UI Wiring Design

**Date:** 2026-06-19
**Status:** Approved design (pending user review of this doc)
**Depends on:** Phase 1 (persistence), Phase 2 (content), Phase 3 (domain layer) — all merged to `main`.

## Goal

Turn the current "design showcase" shell into a real app driven by the domain layer: render PMP's lessons in the **monograph** visual language, wire the tab screens and onboarding to the Phase 3 contexts, and make a real lesson playable end-to-end with progress recorded. Built as three vertical slices; this phase plans and ships **Slice 1** first.

## Locked decisions

- **Active brand: monograph.** Single shipping aesthetic. The elite component set stays in the repo but is inactive (no live switcher — per the Phase-3 theming decision).
- **Build strategy: vertical slice → expand** (Approach A). Get one lesson playable end-to-end before broadening question-type coverage.
- **Question types:** `single_select` (Slice 1), `multi_select` (Slice 2), `drag_drop` (Slice 3). **`text_input` is out of scope** — it appears in 0 lessons (verified).
- **Screen types:** all 6 (`hook`, `challenge`, `reason`, `practice`, `transfer`, `wrap`) are present in all 51 lessons and are built in Slice 1.

## Content facts (verified against `assets/data/`)

- 51 lessons, uniform structure: every lesson has all 6 screen types.
- Question-type usage: `single_select` 450 (every lesson), `drag_drop` 64 (38 lessons), `multi_select` 36 (21 lessons), `text_input` 0.
- ~13 lessons are `single_select`-only — the target for the Slice 1 end-to-end test.

## Routing & navigation

```
src/app/index.tsx            → redirect: onboarding if !hasCompletedOnboarding, else /(tabs)/home
src/app/(onboarding)/_layout.tsx, index(splash), welcome, goal-selection, question-reminder
src/app/(tabs)/_layout.tsx   → home / lessons / profile  (rename study→lessons; drop metrics tab + BrandSwitch header)
src/app/(tabs)/home.tsx      → DashboardScreen wired to useProgress
src/app/(tabs)/lessons.tsx   → lessons list grouped by module
src/app/(tabs)/profile.tsx   → settings + subscription + dev options
src/app/lesson/[id].tsx      → LessonPlayer
```

The 4-step onboarding is driven by `useOnboarding` (`toggleGoal`/`setDailyGoal`, `completeOnboarding`). `index.tsx` reads `hasCompletedOnboarding` to redirect.

## Lesson player architecture (core)

`LessonPlayer` (rendered by `src/app/lesson/[id].tsx`):
1. On mount, `getLessonData(id)` → `dispatch({ type: 'LOAD_LESSON_SUCCESS', payload })` into the global `LessonProvider`/`lesson-reducer` (from Phase 3). On unmount/exit, `dispatch({ type: 'EXIT_LESSON' })` (or RESET).
2. Renders `state.lessonData.screens[state.screenIndex]` via a **screen-renderer registry** (`screen_type → component`): `HookScreen`, `ChallengeScreen`, `ReasonScreen`, `PracticeScreen`, `TransferScreen`, `WrapScreen`. An unknown `screen_type` renders a safe fallback.
3. `challenge`/`practice`/`transfer` screens iterate their `questions[]` through a **question-renderer registry** (`type → component`): `SingleSelect` (Slice 1), `MultiSelect` (Slice 2), `DragDrop` (Slice 3). An unimplemented type renders a graceful "this question type isn't supported yet" placeholder so the lesson still opens and navigation still works.
4. The reducer already owns navigation and answer/score/modal state; the UI only dispatches existing actions (`NEXT_SCREEN`, `SELECT_ANSWER`, `RECORD_QUESTION_SCORE`, `MARK_QUESTION_COMPLETED`, `SHOW_MODAL`/`CLOSE_MODAL`, `COMPLETE_LESSON`, …). Feedback modals use `SHOW_MODAL`.
5. **Completion:** on the `wrap` screen, finishing calls `useProgress().recordLessonAttempt({ lessonId, lessonTitle, questionCount, score, domain })` and `useLessonLimit().consumeLesson()`, then `router.back()` / navigates to the list. `score`/`domain` are derived from the reducer's accumulated `questionScores`/`totalScore` and the lesson's `domain`.

The registries keep each renderer a small, independently-testable unit with one responsibility; adding a question type in Slices 2–3 means adding one entry, not touching the player.

## Visual & component strategy (monograph)

- **Extract, don't duplicate:** the monograph quiz visuals currently embedded in the showcase `QuizScreen` (scenario card, display heading + accent bar, hairline rhythm, and the polished `QuizOption`) move into the new `SingleSelect` question renderer, now driven by `lesson-context` (not `SessionContext`).
- New monograph screen components (`HookScreen`/`ReasonScreen`/`TransferScreen`/`WrapScreen`) reuse existing primitives: `Txt`, `Button`, `Icon`, `Hairline`, `PressableFeedback`. Lesson art via `getLessonImage`/`getLessonThumbnail` (expo-image). Character quotes use `char_*` images.
- The existing `takeaways` monograph component is reused for the wrap screen's `key_takeaways`.
- The elite components remain in the repo, inactive.

## Other screens

- **Home:** `DashboardScreen` receives props derived from `useProgress` — `getCurrentStreak()`, `getCurrentMilestone()`, `domainProgress`, `recentAttempts`, and a next-lesson CTA (first incomplete lesson). Replaces the hardcoded `onStartStudy`/`onJoinArena` sample callbacks with real navigation.
- **Lessons list:** `lessonsIndex` grouped by module; each card shows title, domain, duration, thumbnail (`getLessonThumbnail`), and a completed/locked/`isPremium` badge (completion derived from `useProgress().progress.recentAttempts`). Tap → `router.push('/lesson/' + id)`.
- **Profile:** `useSettings` toggles (haptics/sounds/notifications/theme), `useSubscription` status (premium while RC disabled), dev options gated by `SHOW_DEV_OPTIONS` (reset onboarding/progress/limit via the contexts' reset methods).

## SessionContext removal

- Delete `src/contexts/session-context.tsx`, `src/contexts/session-reducer.ts`, and their tests; remove `SessionProvider` from `src/app/_layout.tsx`.
- Replace the showcase flow (`src/app/(tabs)/study.tsx`, the multi-variant `QuizScreen`) with the lessons-list + lesson-player. The monograph visuals are preserved by the extraction above; the elite-variant QuizScreen layouts are retired with the showcase (their styling lives in the elite component set if needed later).
- Update/replace any tests that imported `useSession`.

## Slice breakdown

- **Slice 1 (this phase's first plan):** routing + onboarding flow + lessons list + LessonPlayer (6 screen renderers + `SingleSelect`) + wrap→progress recording + home dashboard wiring + profile + SessionContext removal. **Done = a `single_select`-only lesson is playable start→finish and records a progress attempt; the app boots through onboarding→home→lessons→player.**
- **Slice 2:** `MultiSelect` question renderer (+ its reducer interactions already exist: `TOGGLE_MULTI_SELECT`).
- **Slice 3:** `DragDrop` question renderer (`SET_DROP_ZONE_ANSWER`/`CLEAR_DROP_ZONE_ANSWERS`) — unlocks all 51 lessons.

## Testing

- Async-RNTL pattern (await `render`/`renderHook`; error-boundary for throw-guards) established in Phase 3.
- Lesson-player flows tested by rendering within `PersistenceProvider value={createInMemoryPersistence()}` + the domain providers, dispatching through the lesson reducer, and asserting screen transitions and that completion records an attempt (`persistence.attempts.count()` / `useProgress().progress`).
- Lessons list and dashboard tested against real bundled content + in-memory progress.
- Keep the existing passing shell tests green; update only those coupled to removed `SessionContext`/showcase.

## Out of scope (later phases)

- `text_input` question type (0 usage).
- Real audio playback (Phase 5 — `expo-audio`), notifications, Clerk auth UI, RevenueCat paywall purchase flow (Phase 5; paywall screen may be stubbed/dormant).
- Live brand/theme switching.

## Risks

- **Lesson-reducer fidelity:** the UI must drive the existing reducer's exact action contract; mis-wiring advance-gating or scoring would let users skip questions or mis-record scores. Mitigated by integration tests that assert the reducer-driven flow.
- **Per-lesson state in a global provider:** `LessonProvider` is global (Phase 3 / PMP pattern); the player must `LOAD` on entry and `EXIT/RESET` on leave to avoid stale state across lessons.
- **Graceful placeholders:** until Slices 2–3, lessons containing multi/drag questions render placeholders for those questions — acceptable and non-crashing, but those lessons aren't fully completable yet.
