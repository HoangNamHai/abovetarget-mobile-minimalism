# PMP Merge — Porting pmp-prod-v3 into the monograph-elite-native shell

**Date:** 2026-06-19
**Status:** Approved design (pending user review of this doc)

## Goal

`monograph-elite-native` (Expo 56, polished minimalist UI) becomes the new shipping
app for **PMP Exam Pro**, replacing `pmp-prod-v3` (Expo 54). We forward-port PMP's
proven data, logic, features, and release infrastructure into the new shell, layer by
layer, test-driven, modernizing dependencies onto SDK 56. We rewrite only the thin glue;
battle-tested logic (streak math, daily-limit edge cases, onboarding persistence) is
ported, not reinvented.

Source app: `/Users/hoangnamhai/Documents/workspace/pmp-prod-v3`

## Approach

**Forward port (Approach A): logic → new shell, layered & test-driven.** The new shell
is the foundation. Port bottom-up so each layer is verifiable in isolation, with native
deps re-validated on SDK 56 and release infra treated as an explicit workstream.

## Decisions (locked)

- **End goal:** new shell replaces `pmp-prod-v3` as the shipping app; all features/data ported.
- **Scope:** everything — content + lessons + quiz, progress + streak + session, onboarding,
  and the auth + subscription + notifications infra layer.
- **Data:** local-first. **SQLite** (new — PMP uses only AsyncStorage today) + AsyncStorage +
  SecureStore. No required backend for the core flow.
- **Tabs:** PMP's 3 — home / lessons / profile. The new shell's `metrics` folds into `home`;
  `study` becomes `lessons`.
- **Theming:** token architecture can express brand × theme. **Reuse the existing
  monograph + elite components as-is.** **No live theme/brand switching feature for now** —
  ship a single default brand; remove the `BrandSwitch` from the tab header.
- **SessionContext:** deleted, absorbed into the ported `Lesson` + `Progress` contexts
  (single source of truth for streak/score/quiz state).

## Architecture — 4 layers, dependencies point downward only

```
UI layer        src/app/** (routes) + src/components/**
                screens wire to domain via hooks; no SDK calls, no storage calls
Domain layer    src/contexts/** + src/contexts/reducers/** + src/hooks/**
                pure state + logic (progress, streak, lesson, onboarding, settings, sound,
                daily-limit). Testable with NO UI and NO real SDKs.
Data layer      src/data/** (content model) + src/services/persistence/**
                bundled content + storage abstraction over SQLite / AsyncStorage / SecureStore
Infra layer     src/services/infra/** (Clerk, RevenueCat, Sentry, notifications, network)
                wrapped behind interfaces + feature flags; domain depends on the interface,
                never the SDK directly
```

**Key boundary rule (the one deliberate improvement over PMP):** domain contexts talk to
`persistence` and `infra` interfaces, not to AsyncStorage/Clerk/RevenueCat inline. Every
context becomes unit-testable with an in-memory fake, and AsyncStorage→SQLite swaps without
touching domain code.

## Persistence layer (`src/services/persistence/`)

Interfaces + real impl + in-memory fake.

| Store | Contents | Rationale |
|---|---|---|
| SQLite (`expo-sqlite`) | Lesson attempts (PMP keeps a 200-item JSON blob), derived domain progress, active-days/streak log, daily-limit consumption | Queryable, append-heavy, grows over time |
| AsyncStorage | Settings (haptics/sounds/notifications), onboarding flags + `userPreferences`, reminder time | Small key-value read at boot |
| SecureStore | Clerk token cache, `isPremium` | Sensitive |

Interfaces: `AttemptRepository`, `ProgressRepository`, `KeyValueStore` (AsyncStorage),
`SecureKeyValueStore` (SecureStore). Each has a native impl + in-memory fake.

**One-time migration:** on first launch, move any existing `@pmp/user-progress` AsyncStorage
blob into SQLite (for real users upgrading in place).

## Domain layer & provider tree

Ported contexts (bottom-up dependency order): `Settings` → `Sound` → `Progress`
(+ `progress-reducer`, `streak.ts`, `date.ts`) → `Onboarding` → `Lesson` (+ `lesson-reducer`)
→ `daily-limit` hook. `SessionContext` is deleted.

`AuthContext` and `SubscriptionContext` ship as **no-op stubs** first (all-premium,
signed-out), wired to real SDKs in Phase 5.

Target provider nesting (infra providers flag-gated, added Phase 5):

```
GestureHandlerRootView → SafeAreaProvider → BottomSheetModalProvider
  → [NetworkProvider]         infra — flag-gated
  → [ClerkProvider]           infra — flag-gated
    → BrandProvider           (default brand, no switcher)
      → SettingsProvider
        → SoundProvider
          → [AuthProvider]    (Clerk-backed; no-op stub until Phase 5)
            → ProgressProvider
              → OnboardingProvider
                → [SubscriptionProvider]  (honors REVENUECAT_DISABLED)
                  → LessonProvider
                    → FontGate → Stack
```

## Content & data layer

Port as-is (bundled, no backend):
- `lessons-data.ts` — ~58 lessons, 8 modules, 4 question types, hook/practice/challenge/
  transfer/wrap screens.
- `lesson-images.ts` — bundled `require()` webp map (auto-generated by
  `scripts/sync-pwa-images.py`); bring the generator + asset files.
- `sound-config.ts` + sound files.
- `src/types/lesson.ts`, `src/types/sound.ts`.

The new shell's existing `questions.ts` / `takeaways.ts` become **brand-styled view models**
rendered from the canonical PMP lesson model — not a competing data source. `Lesson.isPremium`/
`locked` flags retained for the subscription gate.

## UI wiring & routing

```
src/app/index.tsx              → redirect: onboarding (if !completed) else /home
src/app/(onboarding)/          → splash, welcome carousel, goal-selection, question-reminder
src/app/(tabs)/_layout.tsx     → home / lessons / profile  (BrandSwitch removed)
src/app/(tabs)/home.tsx        → dashboard: streak, milestones, domain progress, next lesson, history
src/app/(tabs)/lessons.tsx     → lessons list grouped by module (was "study")
src/app/(tabs)/profile.tsx     → settings, auth state, subscription, dev options (flag-gated)
src/app/lesson/[id].tsx        → LessonPlayer (existing quiz/takeaways components, rewired)
src/app/paywall.tsx            → upgrade screen (gated by daily-limit; no-op while RC disabled)
```

The new shell's polished components (`QuizScreen`, `QuizOption`, `Dashboard`, `Takeaways`,
`Intro`, primitives) are the rendering layer; PMP screen *logic* drives them. Existing
monograph/elite brand variants reused. `metrics.tsx`/`study.tsx` renamed/folded per the
3-tab decision.

## Infra layer (last, flag-gated)

- **Sentry** — `Sentry.wrap` at root, `enabled: !__DEV__`.
- **Clerk** — `ClerkProvider` + SecureStore token cache; real `AuthProvider`. Needs
  `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- **RevenueCat** — `SubscriptionProvider` honoring `REVENUECAT_DISABLED` (stays `true` →
  all-premium) until flipped.
- **expo-notifications** — daily reminder via `useLocalNotifications`, runtime-gated (off in Expo Go).
- **NetInfo** — `NetworkProvider`, graceful fallback.

Each behind its interface so domain code is untouched when toggled.

## Release / native infra workstream

**Reuse PMP's app identity** (ship as an update to the same store listing):

| Field | Value |
|---|---|
| name | `PMP Exam Pro` |
| slug | `pmp-exam-pro` |
| owner | `hoangnamhai` |
| scheme | `pmp-exam-pro` |
| iOS bundleIdentifier | `com.h2ai.pmpexampro` |
| Android package | `com.h2ai.pmpexampro` |
| EAS projectId | `d31b8c5a-d243-401a-af76-35f0b42342bc` |

- Update the new shell's `app.json` to these values (currently `monograph-elite-native`).
- Regenerate `android/` + `ios/` via prebuild on **Expo 56** (do not copy PMP's 54-era native projects).
- Port `eas.json`, remaining `app.json` config (permissions, plugins), `fastlane/`, signing keystores,
  Google Play upload scripts, store metadata.
- Re-validate each native dep builds on SDK 56 — primary version-gap risk.

## Migration sequencing (test-driven slices)

Each phase = its own plan → implementation cycle. Gate per phase: tests green + app boots through that layer.

1. **Persistence layer** — interfaces + SQLite impl + in-memory fakes + tests.
2. **Content layer** — port lesson model/data/images/sounds + types; accessor tests.
3. **Domain layer** — port contexts bottom-up; reducer/logic tests with fakes. Delete `SessionContext`.
4. **UI wiring** — onboarding, lessons list, lesson player, home dashboard, profile; rewire brand components.
5. **Infra layer** — Sentry, Clerk, RevenueCat (disabled), notifications, network — flag-gated.
6. **Release infra** — prebuild on SDK 56, EAS/fastlane/signing/store, dep re-validation.

## Out of scope (for now)

- Live theme/brand switching UI.
- Any backend/sync (app stays local-first).
- Flipping `REVENUECAT_DISABLED` to `false` (paywall ships dormant).

## Open risks

- **SDK version gap (54→56):** native deps (Clerk, RevenueCat, notifications, Sentry) must be
  re-validated on 56. Biggest unknown; surfaces in Phases 5–6.
- **In-place upgrade migration:** existing users' AsyncStorage progress must migrate to SQLite cleanly.
- **uniwind version gap:** new shell uses uniwind ^1.9.0 vs PMP 1.2.2; verify brand/theme token APIs align.
