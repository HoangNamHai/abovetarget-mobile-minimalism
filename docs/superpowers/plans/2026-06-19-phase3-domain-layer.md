# Phase 3: Domain Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port PMP's domain layer — the React contexts, reducers, and hooks (Persistence access, Settings, Onboarding, Progress + streak, Sound state, Lesson engine, daily-limit) — into the new shell, rewired to depend on the Phase 1 persistence **interfaces** instead of calling AsyncStorage inline. Auth and Subscription ship as no-op stubs. The new provider tree is wired into the root layout alongside the existing one.

**Architecture:** Domain contexts never touch a native SDK directly. They obtain `{ kv, secure, attempts }` from a `PersistenceProvider` (backed by `createPersistence()` in the app, `createInMemoryPersistence()` in tests). Pure reducers/utilities are ported verbatim. The Progress provider keeps PMP's proven `progress-reducer` aggregate math, persists the aggregate via `kv`, and **also** writes each attempt into the Phase 1 `AttemptRepository` (the SQLite source-of-truth log) for future querying.

**Tech Stack:** Expo 56, TypeScript, React context+reducer, Jest (`jest-expo`) + `@testing-library/react-native` (`renderHook`, `act`).

**Source app:** `/Users/hoangnamhai/Documents/workspace/pmp-prod-v3` (referred to as `$SRC`).

## Global Constraints

- Expo SDK 56, `jest-expo`. Run the full suite with `npm test` (sets `TZ=UTC`); a single file with `npx jest <path>`.
- Test style: plain `test('...', () => {})` / `test('...', async () => {})`, no `describe` required. Use `renderHook`/`act` from `@testing-library/react-native` for hooks/providers.
- **Domain code depends only on the persistence interfaces** (`KeyValueStore`, `SecureKeyValueStore`, `AttemptRepository`) obtained via `usePersistence()` — never `import AsyncStorage`/`expo-secure-store`/`expo-sqlite` in a context/hook.
- Reuse Phase 1 exports from `src/services/persistence` (`createPersistence`, `createInMemoryPersistence`, `Persistence`, `InMemoryKeyValueStore`, `InMemoryAttemptRepository`, `deriveActiveDays`, `deriveDomainCompletion`, `deriveOverall`) and Phase 1 types from `src/types/progress.ts` (`Domain`, `DOMAINS`, `isDomain`, `LessonAttempt`).
- Reuse Phase 2 content from `src/data/lessons-data.ts` (`getLessonData`), `src/data/sound-config.ts` (`SOUND_CONFIGS`), `src/types/lesson.ts`, `src/types/sound.ts`.
- Persistence keys (verbatim from PMP, except Progress which uses a v2 key to coexist with the Phase 1 legacy migration): Settings `@app/theme` / `@app/notifications` / `@app/haptics` / `@app/sounds`; Onboarding `hasCompletedOnboarding` / `userPreferences`; Progress aggregate `@pmp/v2/user-progress`; carry-over (read-only, written by Phase 1) `@pmp/v2/carry-over`; daily-limit `subscription:lessonLimit`.
- **Scope guardrails:** do NOT delete `src/contexts/session-context.tsx`/`session-reducer.ts` in this phase (its consumers are the quiz/takeaways UI, rewired in Phase 4 — deleting now breaks the build). Do NOT modify `src/data/questions.ts`/`takeaways.ts`, `src/components/**`, or `src/app/(tabs)/**` screen bodies (Phase 4). Do NOT add `@clerk/clerk-expo`, `react-native-purchases`, `expo-notifications`, `expo-av`, or `@sentry/*` (Phase 5).
- **Sound scope:** PMP's sound loader uses `expo-av`, which is removed in SDK 56. This phase ports the Sound **state** provider with a no-op/graceful loader (reports sounds present-but-not-loaded); real audio playback via `expo-audio` is deferred to Phase 5.
- **Auth/Subscription:** no-op stubs only. `REVENUECAT_DISABLED = true` ⇒ subscription stub reports `isPremium: true`.

---

### Task 1: PersistenceProvider (dependency-injection seam)

**Files:**
- Create: `src/contexts/persistence-context.tsx`
- Test: `src/contexts/__tests__/persistence-context.test.tsx`

**Interfaces:**
- Consumes: `Persistence`, `createPersistence`, `createInMemoryPersistence` from `src/services/persistence`.
- Produces:
  - `PersistenceProvider({ children, value? }: { children: ReactNode; value?: Persistence })` — when `value` is supplied (tests) it is used directly; otherwise it calls `createPersistence()` once and renders `children` only after it resolves (renders `null` until ready).
  - `usePersistence(): Persistence` — throws if used outside the provider.

- [ ] **Step 1: Write the failing test**

Create `src/contexts/__tests__/persistence-context.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider, usePersistence } from '../persistence-context';

function Probe() {
  const p = usePersistence();
  return <Text>{p.attempts ? 'ready' : 'no'}</Text>;
}

test('usePersistence exposes the injected persistence', () => {
  render(
    <PersistenceProvider value={createInMemoryPersistence()}>
      <Probe />
    </PersistenceProvider>,
  );
  expect(screen.getByText('ready')).toBeTruthy();
});

test('usePersistence throws outside the provider', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<Probe />)).toThrow(/usePersistence/);
  spy.mockRestore();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/contexts/__tests__/persistence-context.test.tsx`
Expected: FAIL — module `../persistence-context` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/contexts/persistence-context.tsx`:
```tsx
import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createPersistence,
  type Persistence,
} from '../services/persistence';

const PersistenceContext = createContext<Persistence | null>(null);

export function PersistenceProvider({
  children,
  value,
}: {
  children: ReactNode;
  value?: Persistence;
}) {
  const [persistence, setPersistence] = useState<Persistence | null>(value ?? null);

  useEffect(() => {
    if (value) return; // injected (tests) — nothing to create
    let mounted = true;
    createPersistence().then((p) => {
      if (mounted) setPersistence(p);
    });
    return () => {
      mounted = false;
    };
  }, [value]);

  if (!persistence) return null;
  return (
    <PersistenceContext.Provider value={persistence}>{children}</PersistenceContext.Provider>
  );
}

export function usePersistence(): Persistence {
  const ctx = useContext(PersistenceContext);
  if (!ctx) throw new Error('usePersistence must be used within a PersistenceProvider');
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/contexts/__tests__/persistence-context.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/persistence-context.tsx src/contexts/__tests__/persistence-context.test.tsx
git commit -m "feat(domain): PersistenceProvider dependency-injection seam"
```

---

### Task 2: Port streak utilities

**Files:**
- Copy (verbatim): `$SRC/src/utils/streak.ts` → `src/utils/streak.ts`
- Modify: `src/utils/date.ts` — add `getWeekStartMonday` (streak.ts depends on it; Phase 1 only ported `getLocalDateString`)
- Test: `src/utils/__tests__/streak.test.ts`

**Interfaces:**
- Consumes: `getLocalDateString`, `getWeekStartMonday` from `src/utils/date.ts`.
- Produces: `StreakFreeze`, `StreakResult`, `refreshFreezeIfNewWeek(freeze, today?)`, `calculateStreakWithFreeze(lastActiveDate, currentStreak, freeze, today?)`.

- [ ] **Step 1: Add `getWeekStartMonday` to `src/utils/date.ts`**

Append to `src/utils/date.ts`:
```typescript
/**
 * Returns the Monday date string (YYYY-MM-DD) of the current week in local timezone.
 */
export function getWeekStartMonday(date: Date = new Date()): string {
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));
  return getLocalDateString(monday);
}
```

- [ ] **Step 2: Copy streak.ts verbatim**

Run: `cp /Users/hoangnamhai/Documents/workspace/pmp-prod-v3/src/utils/streak.ts src/utils/streak.ts`

- [ ] **Step 3: Write the failing test**

Create `src/utils/__tests__/streak.test.ts`:
```typescript
import { calculateStreakWithFreeze, refreshFreezeIfNewWeek, type StreakFreeze } from '../streak';

const freeze: StreakFreeze = { available: 1, weekStart: '2026-06-15', usedDates: [] };

test('same-day activity leaves the streak unchanged', () => {
  const r = calculateStreakWithFreeze('2026-06-19', 5, freeze, new Date('2026-06-19T12:00:00Z'));
  expect(r.streak).toBe(5);
  expect(r.freezeUsed).toBe(false);
});

test('yesterday activity increments the streak', () => {
  const r = calculateStreakWithFreeze('2026-06-18', 5, freeze, new Date('2026-06-19T12:00:00Z'));
  expect(r.streak).toBe(6);
});

test('a one-day gap consumes a freeze to preserve the streak', () => {
  const r = calculateStreakWithFreeze('2026-06-17', 5, freeze, new Date('2026-06-19T12:00:00Z'));
  expect(r.streak).toBe(6);
  expect(r.freezeUsed).toBe(true);
  expect(r.freeze.available).toBe(0);
});

test('a multi-day gap resets the streak to 1', () => {
  const r = calculateStreakWithFreeze('2026-06-10', 5, freeze, new Date('2026-06-19T12:00:00Z'));
  expect(r.streak).toBe(1);
});

test('freeze refreshes at the start of a new week', () => {
  const used: StreakFreeze = { available: 0, weekStart: '2026-06-08', usedDates: ['2026-06-09'] };
  const refreshed = refreshFreezeIfNewWeek(used, new Date('2026-06-19T12:00:00Z'));
  expect(refreshed.available).toBe(1);
});
```

- [ ] **Step 4: Run test to verify it fails, then passes**

Run: `npx jest src/utils/__tests__/streak.test.ts`
Expected: first FAIL (module missing), then PASS (5 tests) once the copy + date helper are in place.

- [ ] **Step 5: Commit**

```bash
git add src/utils/streak.ts src/utils/date.ts src/utils/__tests__/streak.test.ts
git commit -m "feat(domain): port streak utilities and getWeekStartMonday"
```

---

### Task 3: SettingsProvider (kv-backed)

**Files:**
- Create: `src/contexts/settings-context.tsx`
- Test: `src/contexts/__tests__/settings-context.test.tsx`

**Interfaces:**
- Consumes: `usePersistence` (Task 1).
- Produces: `SettingsProvider`, `useSettings(): SettingsContextValue` with `settings: AppSettings` (`theme: 'light'|'dark'|'system'`, `notifications`, `haptics`, `sounds`), `isLoading`, `setTheme`, `setNotifications`, `setHaptics`, `setSounds`, `updateSettings`, `resetSettings`.

This is PMP's `settings-context.tsx` adapted: replace the four `AsyncStorage` calls with the `kv` interface. `theme` is a string (`kv.getString`/`setString`); the three booleans use `kv.getJSON`/`setJSON`.

- [ ] **Step 1: Write the failing test**

Create `src/contexts/__tests__/settings-context.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider } from '../persistence-context';
import { SettingsProvider, useSettings } from '../settings-context';

function wrapper(persistence = createInMemoryPersistence()) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>
      <SettingsProvider>{children}</SettingsProvider>
    </PersistenceProvider>
  );
}

test('defaults to system theme with everything enabled', async () => {
  const { result } = renderHook(() => useSettings(), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.settings).toEqual({
    theme: 'system',
    notifications: true,
    haptics: true,
    sounds: true,
  });
});

test('setHaptics persists and updates state', async () => {
  const persistence = createInMemoryPersistence();
  const { result } = renderHook(() => useSettings(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => {
    await result.current.setHaptics(false);
  });
  expect(result.current.settings.haptics).toBe(false);
  expect(await persistence.kv.getJSON('@app/haptics')).toBe(false);
});

test('loads persisted theme on mount', async () => {
  const persistence = createInMemoryPersistence();
  await persistence.kv.setString('@app/theme', 'dark');
  const { result } = renderHook(() => useSettings(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.settings.theme).toBe('dark');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/contexts/__tests__/settings-context.test.tsx`
Expected: FAIL — module `../settings-context` not found.

- [ ] **Step 3: Write the implementation**

Create `src/contexts/settings-context.tsx` (PMP's provider, AsyncStorage → `kv`):
```tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePersistence } from './persistence-context';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemePreference;
  notifications: boolean;
  haptics: boolean;
  sounds: boolean;
}

interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setNotifications: (enabled: boolean) => Promise<void>;
  setHaptics: (enabled: boolean) => Promise<void>;
  setSounds: (enabled: boolean) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const KEYS = {
  THEME: '@app/theme',
  NOTIFICATIONS: '@app/notifications',
  HAPTICS: '@app/haptics',
  SOUNDS: '@app/sounds',
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  notifications: true,
  haptics: true,
  sounds: true,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { kv } = usePersistence();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [theme, notifications, haptics, sounds] = await Promise.all([
          kv.getString(KEYS.THEME),
          kv.getJSON<boolean>(KEYS.NOTIFICATIONS),
          kv.getJSON<boolean>(KEYS.HAPTICS),
          kv.getJSON<boolean>(KEYS.SOUNDS),
        ]);
        if (!mounted) return;
        setSettings({
          theme: (theme as ThemePreference) || DEFAULT_SETTINGS.theme,
          notifications: notifications ?? DEFAULT_SETTINGS.notifications,
          haptics: haptics ?? DEFAULT_SETTINGS.haptics,
          sounds: sounds ?? DEFAULT_SETTINGS.sounds,
        });
      } catch (error) {
        console.warn('[SettingsProvider] Failed to load settings:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [kv]);

  const setTheme = useCallback(
    async (theme: ThemePreference) => {
      await kv.setString(KEYS.THEME, theme);
      setSettings((prev) => ({ ...prev, theme }));
    },
    [kv],
  );
  const setNotifications = useCallback(
    async (enabled: boolean) => {
      await kv.setJSON(KEYS.NOTIFICATIONS, enabled);
      setSettings((prev) => ({ ...prev, notifications: enabled }));
    },
    [kv],
  );
  const setHaptics = useCallback(
    async (enabled: boolean) => {
      await kv.setJSON(KEYS.HAPTICS, enabled);
      setSettings((prev) => ({ ...prev, haptics: enabled }));
    },
    [kv],
  );
  const setSounds = useCallback(
    async (enabled: boolean) => {
      await kv.setJSON(KEYS.SOUNDS, enabled);
      setSettings((prev) => ({ ...prev, sounds: enabled }));
    },
    [kv],
  );

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const ops: Promise<void>[] = [];
      if (updates.theme !== undefined) ops.push(kv.setString(KEYS.THEME, updates.theme));
      if (updates.notifications !== undefined)
        ops.push(kv.setJSON(KEYS.NOTIFICATIONS, updates.notifications));
      if (updates.haptics !== undefined) ops.push(kv.setJSON(KEYS.HAPTICS, updates.haptics));
      if (updates.sounds !== undefined) ops.push(kv.setJSON(KEYS.SOUNDS, updates.sounds));
      await Promise.all(ops);
      setSettings((prev) => ({ ...prev, ...updates }));
    },
    [kv],
  );

  const resetSettings = useCallback(async () => {
    await Promise.all([
      kv.remove(KEYS.THEME),
      kv.remove(KEYS.NOTIFICATIONS),
      kv.remove(KEYS.HAPTICS),
      kv.remove(KEYS.SOUNDS),
    ]);
    setSettings(DEFAULT_SETTINGS);
  }, [kv]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isLoading,
      setTheme,
      setNotifications,
      setHaptics,
      setSounds,
      updateSettings,
      resetSettings,
    }),
    [settings, isLoading, setTheme, setNotifications, setHaptics, setSounds, updateSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/contexts/__tests__/settings-context.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/settings-context.tsx src/contexts/__tests__/settings-context.test.tsx
git commit -m "feat(domain): SettingsProvider backed by persistence kv"
```

---

### Task 4: OnboardingProvider (kv-backed)

**Files:**
- Create: `src/contexts/onboarding-context.tsx`
- Test: `src/contexts/__tests__/onboarding-context.test.tsx`
- Verify dep present: `expo-linking` (already a dependency of the shell).

**Interfaces:**
- Consumes: `usePersistence` (Task 1), `expo-linking`.
- Produces: `OnboardingProvider`, `useOnboarding()` with `isLoading`, `hasCompletedOnboarding`, `selectedGoals`, `dailyGoal`, `focusDomain`, `toggleGoal`, `setDailyGoal`, `setFocusDomain`, `completeOnboarding`, `resetOnboarding`, and the `UserPreferences` type.

PMP's `onboarding-context.tsx` adapted: replace `AsyncStorage` with `kv` (`hasCompletedOnboarding` via `getString`/`setString`/`remove`; `userPreferences` via `getJSON`/`setJSON`). Keep the `expo-linking` `?skipOnboarding=true` deep-link handling verbatim.

- [ ] **Step 1: Write the failing test**

Create `src/contexts/__tests__/onboarding-context.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider } from '../persistence-context';
import { OnboardingProvider, useOnboarding } from '../onboarding-context';

jest.mock('expo-linking', () => ({
  parse: () => ({ queryParams: {} }),
  getInitialURL: async () => null,
  addEventListener: () => ({ remove: () => {} }),
}));

function wrapper(persistence = createInMemoryPersistence()) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>
      <OnboardingProvider>{children}</OnboardingProvider>
    </PersistenceProvider>
  );
}

test('starts not-onboarded after load', async () => {
  const { result } = renderHook(() => useOnboarding(), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.hasCompletedOnboarding).toBe(false);
});

test('completeOnboarding persists flag and preferences', async () => {
  const persistence = createInMemoryPersistence();
  const { result } = renderHook(() => useOnboarding(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  act(() => result.current.setDailyGoal(3));
  await act(async () => {
    await result.current.completeOnboarding();
  });
  expect(result.current.hasCompletedOnboarding).toBe(true);
  expect(await persistence.kv.getString('hasCompletedOnboarding')).toBe('true');
  const prefs = await persistence.kv.getJSON<{ dailyGoal: number }>('userPreferences');
  expect(prefs?.dailyGoal).toBe(3);
});

test('loads completed state from persistence', async () => {
  const persistence = createInMemoryPersistence();
  await persistence.kv.setString('hasCompletedOnboarding', 'true');
  await persistence.kv.setJSON('userPreferences', {
    goals: ['pass-pmp'], dailyGoal: 2, onboardingCompletedAt: 1,
  });
  const { result } = renderHook(() => useOnboarding(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.hasCompletedOnboarding).toBe(true);
  expect(result.current.dailyGoal).toBe(2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/contexts/__tests__/onboarding-context.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/contexts/onboarding-context.tsx` — start from `$SRC/src/contexts/onboarding-context.tsx` and make exactly these substitutions:
- Remove `import AsyncStorage from '@react-native-async-storage/async-storage';`.
- Add `import { usePersistence } from './persistence-context';` and, at the top of the provider body, `const { kv } = usePersistence();`.
- Replace every `AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING)` with `kv.getString('hasCompletedOnboarding')`; `AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, 'true')` with `kv.setString('hasCompletedOnboarding', 'true')`; `AsyncStorage.removeItem(...)` with `kv.remove('hasCompletedOnboarding')`.
- Replace `AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)` with `kv.getJSON<UserPreferences>('userPreferences')` (it now returns the parsed object — drop the `JSON.parse`); `AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(x))` with `kv.setJSON('userPreferences', x)`; `removeItem` with `kv.remove('userPreferences')`.
- Add `kv` to the dependency arrays of the affected `useCallback`/`useEffect` hooks.
- Keep all `expo-linking` logic, `toggleGoal`/`setDailyGoal`/`setFocusDomain`, and the `useMemo` value unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/contexts/__tests__/onboarding-context.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/onboarding-context.tsx src/contexts/__tests__/onboarding-context.test.tsx
git commit -m "feat(domain): OnboardingProvider backed by persistence kv"
```

---

### Task 5: Config constants + Auth & Subscription stubs

**Files:**
- Create: `src/config/revenuecat.ts` (verbatim copy of `$SRC/src/config/revenuecat.ts`)
- Create: `src/config/feature-flags.ts` (verbatim copy of `$SRC/src/config/feature-flags.ts`)
- Create: `src/contexts/auth-context.tsx` (stub)
- Create: `src/contexts/subscription-context.tsx` (stub)
- Test: `src/contexts/__tests__/auth-subscription-stubs.test.tsx`

**Interfaces:**
- Produces:
  - `REVENUECAT_DISABLED`, `FREE_DAILY_LESSON_LIMIT`, `SUBSCRIPTION_STORAGE_KEYS`, `ENTITLEMENTS`, `PRODUCTS` (from `revenuecat.ts`); `SHOW_DEV_OPTIONS` (from `feature-flags.ts`).
  - `AuthProvider`, `useAppAuth(): { isSignedIn: boolean; isLoading: boolean; user: null; signOut: () => Promise<void> }`.
  - `SubscriptionProvider`, `useSubscription(): { isPremium: boolean; isLoading: boolean; isInitialized: boolean; error: null; purchasePackage: () => Promise<void>; restorePurchases: () => Promise<void>; clearError: () => void }`.

- [ ] **Step 1: Copy the config constants**

Run:
```bash
SRC=/Users/hoangnamhai/Documents/workspace/pmp-prod-v3
mkdir -p src/config
cp "$SRC"/src/config/revenuecat.ts src/config/revenuecat.ts
cp "$SRC"/src/config/feature-flags.ts src/config/feature-flags.ts
```

- [ ] **Step 2: Write the failing test**

Create `src/contexts/__tests__/auth-subscription-stubs.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react-native';
import { AuthProvider, useAppAuth } from '../auth-context';
import { SubscriptionProvider, useSubscription } from '../subscription-context';

test('auth stub reports signed-out and not loading', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
  const { result } = renderHook(() => useAppAuth(), { wrapper });
  expect(result.current.isSignedIn).toBe(false);
  expect(result.current.isLoading).toBe(false);
  expect(result.current.user).toBeNull();
});

test('subscription stub reports premium (RevenueCat disabled)', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SubscriptionProvider>{children}</SubscriptionProvider>
  );
  const { result } = renderHook(() => useSubscription(), { wrapper });
  expect(result.current.isPremium).toBe(true);
  expect(result.current.isInitialized).toBe(true);
});
```

- [ ] **Step 3: Write the stub implementations**

Create `src/contexts/auth-context.tsx`:
```tsx
import React, { createContext, useContext, useMemo, type ReactNode } from 'react';

export interface AppAuthValue {
  isSignedIn: boolean;
  isLoading: boolean;
  user: null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AppAuthValue | null>(null);

// Phase 3 stub: real Clerk wiring lands in Phase 5.
export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AppAuthValue>(
    () => ({ isSignedIn: false, isLoading: false, user: null, signOut: async () => {} }),
    [],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAppAuth(): AppAuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAppAuth must be used within an AuthProvider');
  return ctx;
}
```

Create `src/contexts/subscription-context.tsx`:
```tsx
import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { REVENUECAT_DISABLED } from '../config/revenuecat';

export interface SubscriptionValue {
  isPremium: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: null;
  purchasePackage: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  clearError: () => void;
}

const SubscriptionContext = createContext<SubscriptionValue | null>(null);

// Phase 3 stub: real RevenueCat wiring lands in Phase 5.
// While REVENUECAT_DISABLED is true, all users are treated as premium.
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const value = useMemo<SubscriptionValue>(
    () => ({
      isPremium: REVENUECAT_DISABLED ? true : false,
      isLoading: false,
      isInitialized: true,
      error: null,
      purchasePackage: async () => {},
      restorePurchases: async () => {},
      clearError: () => {},
    }),
    [],
  );
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it fails then passes**

Run: `npx jest src/contexts/__tests__/auth-subscription-stubs.test.tsx`
Expected: FAIL (modules missing) → PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/config src/contexts/auth-context.tsx src/contexts/subscription-context.tsx src/contexts/__tests__/auth-subscription-stubs.test.tsx
git commit -m "feat(domain): config constants + Auth/Subscription stubs"
```

---

### Task 6: Progress — reducer port + kv/attempts-backed provider

**Files:**
- Create: `src/contexts/reducers/progress-reducer.ts` (port of `$SRC/src/contexts/reducers/progress-reducer.ts`, adapted imports)
- Create: `src/contexts/progress-context.tsx` (kv + attempts-backed)
- Test: `src/contexts/reducers/__tests__/progress-reducer.test.ts`
- Test: `src/contexts/__tests__/progress-context.test.tsx`

**Interfaces:**
- Consumes: `usePersistence` (Task 1), `calculateStreakWithFreeze`/`refreshFreezeIfNewWeek`/`StreakFreeze` (Task 2), `getLocalDateString` (date), `Domain`/`LessonAttempt` (`src/types/progress.ts`), `deriveActiveDays`/`deriveDomainCompletion`/`deriveOverall` (persistence).
- Produces:
  - From reducer: `progressReducer`, `initialProgressState`, `DEFAULT_PROGRESS`, `getCurrentMilestone`, `generateAttemptId`, `MILESTONES`, types `DomainProgress`, `UserProgress`, `ProgressState`, `ProgressAction`.
  - From provider: `ProgressProvider`, `useProgress()` with `progress`, `isLoading`, `error`, `recordLessonAttempt`, `resetProgress`, `refreshProgress`, `getCurrentMilestone`, `getCurrentStreak`, `getStreakMessage`.

- [ ] **Step 1: Port the reducer (adapted imports)**

Copy `$SRC/src/contexts/reducers/progress-reducer.ts` to `src/contexts/reducers/progress-reducer.ts`, then make exactly these edits:
- Replace the local `export type Domain = ...` and `export interface LessonAttempt { ... }` declarations with `import type { Domain, LessonAttempt } from '../../types/progress';` and re-export them: `export type { Domain, LessonAttempt };`. (Keep `DomainProgress`, `UserProgress`, `ProgressState`, `ProgressAction`, `DEFAULT_PROGRESS`, `MILESTONES`, the reducer, `getCurrentMilestone`, `generateAttemptId` exactly as in the source.)
- Keep the existing imports of `getLocalDateString` (from `../../utils/date`) and `calculateStreakWithFreeze`/`StreakFreeze` (from `../../utils/streak`).

- [ ] **Step 2: Reducer test (failing → passing)**

Create `src/contexts/reducers/__tests__/progress-reducer.test.ts`:
```typescript
import { progressReducer, DEFAULT_PROGRESS, type ProgressState, type UserProgress } from '../progress-reducer';
import type { LessonAttempt } from '../../../types/progress';

function loaded(progress: UserProgress = DEFAULT_PROGRESS): ProgressState {
  return { progress, isLoading: false, error: null };
}
const attempt: LessonAttempt = {
  id: 'a1', lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5,
  score: 80, completedAt: '2026-06-19T10:00:00.000Z', domain: 'process',
};

test('RECORD_ATTEMPT increments totals and domain progress', () => {
  const s = progressReducer(loaded(), { type: 'RECORD_ATTEMPT', payload: attempt });
  expect(s.progress.totalLessonsCompleted).toBe(1);
  expect(s.progress.domainProgress.process.completed).toBe(1);
  expect(s.progress.averageScore).toBe(80);
  expect(s.progress.recentAttempts[0].id).toBe('a1');
});

test('RECORD_ATTEMPT starts the streak at 1 from a clean slate', () => {
  const s = progressReducer(loaded(), { type: 'RECORD_ATTEMPT', payload: attempt });
  expect(s.progress.dailyStreak).toBeGreaterThanOrEqual(1);
  expect(s.progress.bestStreak).toBeGreaterThanOrEqual(1);
});

test('RESET_PROGRESS returns to defaults', () => {
  const dirty = progressReducer(loaded(), { type: 'RECORD_ATTEMPT', payload: attempt });
  const s = progressReducer(dirty, { type: 'RESET_PROGRESS' });
  expect(s.progress).toEqual(DEFAULT_PROGRESS);
});
```
Run: `npx jest src/contexts/reducers/__tests__/progress-reducer.test.ts` → PASS (3 tests).

- [ ] **Step 3: Write the provider**

Create `src/contexts/progress-context.tsx`:
```tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { usePersistence } from './persistence-context';
import { getLocalDateString } from '../utils/date';
import { refreshFreezeIfNewWeek } from '../utils/streak';
import {
  progressReducer,
  initialProgressState,
  DEFAULT_PROGRESS,
  getCurrentMilestone,
  generateAttemptId,
  type UserProgress,
  type ProgressState,
} from './reducers/progress-reducer';
import type { LessonAttempt } from '../types/progress';

export type { Domain, DomainProgress, UserProgress } from './reducers/progress-reducer';
export type { LessonAttempt } from '../types/progress';

const PROGRESS_KEY = '@pmp/v2/user-progress';

interface ProgressContextValue extends ProgressState {
  recordLessonAttempt: (attempt: Omit<LessonAttempt, 'id' | 'completedAt'>) => Promise<void>;
  resetProgress: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  getCurrentMilestone: () => { name: string; threshold: number; progress: number };
  getCurrentStreak: () => number;
  getStreakMessage: () => string;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { kv } = usePersistence();
  const [state, dispatch] = useReducer(progressReducer, initialProgressState);

  useEffect(() => {
    let mounted = true;
    (async () => {
      dispatch({ type: 'LOAD_START' });
      try {
        const stored = await kv.getJSON<UserProgress>(PROGRESS_KEY);
        if (!mounted) return;
        if (stored) {
          const refreshedFreeze = refreshFreezeIfNewWeek(
            stored.streakFreeze ?? DEFAULT_PROGRESS.streakFreeze,
          );
          dispatch({
            type: 'LOAD_SUCCESS',
            payload: { ...stored, streakFreeze: refreshedFreeze },
          });
        } else {
          dispatch({ type: 'LOAD_SUCCESS', payload: DEFAULT_PROGRESS });
        }
      } catch {
        if (mounted) dispatch({ type: 'LOAD_ERROR', payload: 'Failed to load progress' });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [kv]);

  useEffect(() => {
    if (!state.isLoading) {
      kv.setJSON(PROGRESS_KEY, state.progress).catch(() => {});
    }
  }, [kv, state.progress, state.isLoading]);

  const { attempts } = usePersistence();
  const recordLessonAttempt = useCallback(
    async (data: Omit<LessonAttempt, 'id' | 'completedAt'>) => {
      const attempt: LessonAttempt = {
        ...data,
        score: Math.min(100, Math.max(0, data.score)),
        id: generateAttemptId(),
        completedAt: new Date().toISOString(),
      };
      dispatch({ type: 'RECORD_ATTEMPT', payload: attempt });
      await attempts.record(attempt); // SQLite source-of-truth log
    },
    [attempts],
  );

  const resetProgress = useCallback(async () => {
    dispatch({ type: 'RESET_PROGRESS' });
    await kv.remove(PROGRESS_KEY);
    await attempts.clear();
  }, [kv, attempts]);

  const refreshProgress = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    const stored = await kv.getJSON<UserProgress>(PROGRESS_KEY);
    dispatch({ type: 'LOAD_SUCCESS', payload: stored ?? DEFAULT_PROGRESS });
  }, [kv]);

  const getMilestone = useCallback(
    () => getCurrentMilestone(state.progress.averageScore),
    [state.progress.averageScore],
  );

  const getCurrentStreak = useCallback(() => {
    const { lastActiveDate, dailyStreak, streakFreeze } = state.progress;
    const today = getLocalDateString();
    if (lastActiveDate === today) return dailyStreak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastActiveDate === getLocalDateString(yesterday)) return dailyStreak;
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const isOneDayGap = lastActiveDate === getLocalDateString(twoDaysAgo);
    const refreshed = refreshFreezeIfNewWeek(streakFreeze ?? DEFAULT_PROGRESS.streakFreeze);
    if (isOneDayGap && refreshed.available > 0 && dailyStreak > 0) return dailyStreak;
    return 0;
  }, [state.progress]);

  const getStreakMessage = useCallback(() => {
    const streak = getCurrentStreak();
    const freezesAvailable = state.progress.streakFreeze?.available ?? 0;
    if (streak === 0) return 'Start your streak today!';
    const freezeInfo = freezesAvailable > 0 ? ' • 1 freeze ready' : '';
    if (streak < 7) return `${7 - streak} more days for 'WEEKLY WARRIOR'${freezeInfo}`;
    if (streak < 14) return `${14 - streak} more days for 'HOT STREAK'${freezeInfo}`;
    if (streak < 30) return `${30 - streak} more days for 'MONTHLY MASTER'${freezeInfo}`;
    return `You're on fire! Keep it going!${freezeInfo}`;
  }, [getCurrentStreak, state.progress.streakFreeze]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      ...state,
      recordLessonAttempt,
      resetProgress,
      refreshProgress,
      getCurrentMilestone: getMilestone,
      getCurrentStreak,
      getStreakMessage,
    }),
    [state, recordLessonAttempt, resetProgress, refreshProgress, getMilestone, getCurrentStreak, getStreakMessage],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
```

- [ ] **Step 4: Provider test**

Create `src/contexts/__tests__/progress-context.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider } from '../persistence-context';
import { ProgressProvider, useProgress } from '../progress-context';

function wrapper(persistence = createInMemoryPersistence()) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>
      <ProgressProvider>{children}</ProgressProvider>
    </PersistenceProvider>
  );
}

test('records an attempt to both the aggregate and the attempts log', async () => {
  const persistence = createInMemoryPersistence();
  const { result } = renderHook(() => useProgress(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => {
    await result.current.recordLessonAttempt({
      lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5, score: 90, domain: 'process',
    });
  });
  expect(result.current.progress.totalLessonsCompleted).toBe(1);
  expect(await persistence.attempts.count()).toBe(1);
  const saved = await persistence.kv.getJSON<{ totalLessonsCompleted: number }>('@pmp/v2/user-progress');
  expect(saved?.totalLessonsCompleted).toBe(1);
});

test('resetProgress clears aggregate and attempts log', async () => {
  const persistence = createInMemoryPersistence();
  const { result } = renderHook(() => useProgress(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => {
    await result.current.recordLessonAttempt({
      lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5, score: 90, domain: 'process',
    });
  });
  await act(async () => {
    await result.current.resetProgress();
  });
  expect(result.current.progress.totalLessonsCompleted).toBe(0);
  expect(await persistence.attempts.count()).toBe(0);
});
```
Run: `npx jest src/contexts/__tests__/progress-context.test.tsx` → PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/reducers/progress-reducer.ts src/contexts/progress-context.tsx src/contexts/reducers/__tests__/progress-reducer.test.ts src/contexts/__tests__/progress-context.test.tsx
git commit -m "feat(domain): Progress reducer + kv/attempts-backed provider"
```

---

### Task 7: daily-limit hook (kv-backed)

**Files:**
- Create: `src/hooks/use-lesson-limit.ts`
- Test: `src/hooks/__tests__/use-lesson-limit.test.tsx`

**Interfaces:**
- Consumes: `usePersistence` (kv), `useSubscription` (Task 5 stub), `FREE_DAILY_LESSON_LIMIT`/`SUBSCRIPTION_STORAGE_KEYS` (`src/config/revenuecat`).
- Produces: `useLessonLimit(): { lessonsCompletedToday, remainingLessons, canAccessLesson, limitReached, consumeLesson, resetDailyLimit, simulateLimitReached, isLoading, timeUntilReset }`.

PMP's `use-lesson-limit.ts` adapted: replace `AsyncStorage` (in `loadLimitData`/`saveLimitData`) with the `kv` interface. Because the helpers were module-level, fold them into the hook (or pass `kv`): make `loadLimitData(kv)` / `saveLimitData(kv, data)` take `kv` as a parameter; obtain `kv` via `usePersistence()` inside the hook. Keep `getTodayDateString`, `getTimeUntilMidnight`, the timer effect, and the computed values unchanged. `consumeLesson`'s fire-and-forget save becomes `saveLimitData(kv, newData)`.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/use-lesson-limit.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider } from '../../contexts/persistence-context';
import { useLessonLimit } from '../use-lesson-limit';

// Force a non-premium subscription so the limit logic is exercised.
jest.mock('../../contexts/subscription-context', () => ({
  useSubscription: () => ({ isPremium: false }),
}));

function wrapper(persistence = createInMemoryPersistence()) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>{children}</PersistenceProvider>
  );
}

test('starts with the full free quota for a non-premium user', async () => {
  const { result } = renderHook(() => useLessonLimit(), { wrapper: wrapper() });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.lessonsCompletedToday).toBe(0);
  expect(result.current.remainingLessons).toBe(3);
  expect(result.current.limitReached).toBe(false);
});

test('consumeLesson increments and persists; limit reached at 3', async () => {
  const persistence = createInMemoryPersistence();
  const { result } = renderHook(() => useLessonLimit(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  await act(async () => { await result.current.consumeLesson(); });
  await act(async () => { await result.current.consumeLesson(); });
  await act(async () => { await result.current.consumeLesson(); });
  expect(result.current.lessonsCompletedToday).toBe(3);
  expect(result.current.limitReached).toBe(true);
  expect(result.current.canAccessLesson).toBe(false);
  expect(await persistence.kv.getJSON('subscription:lessonLimit')).toMatchObject({ count: 3 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/hooks/__tests__/use-lesson-limit.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/hooks/use-lesson-limit.ts` by adapting `$SRC/src/hooks/use-lesson-limit.ts`:
- Remove `import AsyncStorage ...`; add `import { usePersistence } from '../contexts/persistence-context';` and keep `import { useSubscription } from '../contexts/subscription-context';` and the `revenuecat` imports.
- Change `loadLimitData` / `saveLimitData` to accept `kv: KeyValueStore` as their first parameter and use `kv.getJSON<LimitData>(SUBSCRIPTION_STORAGE_KEYS.LESSON_LIMIT)` / `kv.setJSON(SUBSCRIPTION_STORAGE_KEYS.LESSON_LIMIT, data)` (drop the manual `JSON.parse`/`JSON.stringify`). Import the type: `import type { KeyValueStore } from '../services/persistence';`.
- Inside `useLessonLimit`, add `const { kv } = usePersistence();` and pass `kv` to the load/save calls (the mount effect, `consumeLesson`, `resetDailyLimit`, `simulateLimitReached`). Add `kv` to those `useCallback`/`useEffect` dependency arrays.
- Keep everything else (`getTodayDateString`, `getTimeUntilMidnight`, the per-minute timer effect, computed values, return shape) unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/hooks/__tests__/use-lesson-limit.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-lesson-limit.ts src/hooks/__tests__/use-lesson-limit.test.tsx
git commit -m "feat(domain): daily-limit hook backed by persistence kv"
```

---

### Task 8: SoundProvider (state only; SDK-56-safe loader)

**Files:**
- Create: `src/utils/sound-loader.ts` (SDK-56-safe; no `expo-av`)
- Create: `src/contexts/sound-context.tsx`
- Test: `src/contexts/__tests__/sound-context.test.tsx`

**Interfaces:**
- Consumes: `SOUND_CONFIGS` (`src/data/sound-config.ts`), `SoundEffectsState`/`SoundName` (`src/types/sound.ts`).
- Produces:
  - `initializeSoundConfig(): Promise<SoundEffectsState>`, `getSound(state, name)`, `isSoundAvailable(state, name)` (from `sound-loader.ts`).
  - `SoundProvider`, `useSoundContext(): { soundState, isLoading, error, isSoundAvailable }`.

The loader does NOT load audio (no `expo-av`). It builds `SoundEffectsState` from `SOUND_CONFIGS`: every configured sound is listed as a `LoadedSound` with `isAvailable: false` (playback deferred to Phase 5), `availableSounds: []`, `isEnabled: false`. This keeps the provider/consumer API intact and honestly reports that audio is not yet wired.

- [ ] **Step 1: Write the failing test**

Create `src/contexts/__tests__/sound-context.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { SoundProvider, useSoundContext } from '../sound-context';

const wrapper = ({ children }: { children: ReactNode }) => <SoundProvider>{children}</SoundProvider>;

test('initializes a sound state and reports availability', async () => {
  const { result } = renderHook(() => useSoundContext(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.soundState).not.toBeNull();
  // Audio playback deferred to Phase 5 — nothing is "available" yet.
  expect(result.current.isSoundAvailable('ui-tap')).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/contexts/__tests__/sound-context.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementations**

Create `src/utils/sound-loader.ts`:
```typescript
import { SOUND_CONFIGS } from '../data/sound-config';
import type { SoundEffectsState, SoundName, LoadedSound } from '../types/sound';

/**
 * Phase 3: build sound *state* from config without loading audio.
 * Real playback (expo-audio) is deferred to Phase 5, so every sound is
 * reported as not-yet-available and the engine is disabled.
 */
export async function initializeSoundConfig(): Promise<SoundEffectsState> {
  const sounds = {} as Record<SoundName, LoadedSound>;
  for (const config of SOUND_CONFIGS) {
    sounds[config.name] = { config, isAvailable: false };
  }
  return { isEnabled: false, sounds, availableSounds: [] };
}

export function getSound(state: SoundEffectsState, name: SoundName): LoadedSound | undefined {
  return state.sounds[name];
}

export function isSoundAvailable(state: SoundEffectsState, name: SoundName): boolean {
  return state.sounds[name]?.isAvailable ?? false;
}
```

Create `src/contexts/sound-context.tsx` — start from `$SRC/src/contexts/sound-context.tsx` and keep it as-is EXCEPT the import line becomes `import { initializeSoundConfig, isSoundAvailable } from '../utils/sound-loader';` (the new loader has the same signatures). No other change is needed; the provider already degrades gracefully.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/contexts/__tests__/sound-context.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/utils/sound-loader.ts src/contexts/sound-context.tsx src/contexts/__tests__/sound-context.test.tsx
git commit -m "feat(domain): SoundProvider state layer (SDK-56-safe, playback deferred)"
```

---

### Task 9: Lesson engine — reducer + provider (verbatim port)

**Files:**
- Create: `src/contexts/reducers/lesson-reducer.ts` (verbatim port; adapt import paths only)
- Create: `src/contexts/lesson-context.tsx` (verbatim port; adapt import paths only)
- Test: `src/contexts/reducers/__tests__/lesson-reducer.test.ts`

**Interfaces:**
- Consumes: `LessonData`/`ModalType`/`ModalData`/`DragChip`/`ScreenType` (`src/types/lesson.ts`), `getLessonData` (`src/data/lessons-data.ts`).
- Produces: `lessonReducer`, `initialLessonState`, `MAX_ATTEMPTS`, `POINT_MULTIPLIERS`, types `LessonState`/`LessonAction`; `LessonProvider`, `useLessonContext()`.

The lesson reducer/context are **pure ephemeral per-lesson state** — no persistence. Port verbatim from PMP; the only edits are import paths (which already resolve, since `src/types/lesson.ts` and `src/data/lessons-data.ts` exist from Phase 2). Confirm `src/types/lesson.ts` exports `ModalType` and `ScreenType` (it does, per Phase 2). Whatever the PMP `lesson-context.tsx` initial-state export is named, re-export it as `initialLessonState` if the source uses a different identifier; otherwise keep the source name and update the test import to match.

- [ ] **Step 1: Copy the files**

Run:
```bash
SRC=/Users/hoangnamhai/Documents/workspace/pmp-prod-v3
cp "$SRC"/src/contexts/reducers/lesson-reducer.ts src/contexts/reducers/lesson-reducer.ts
cp "$SRC"/src/contexts/lesson-context.tsx src/contexts/lesson-context.tsx
```
Then open both files and verify the relative imports resolve in this repo (`../../types/lesson`, `../types/lesson`, `../data/lessons-data`). They mirror PMP's layout, so they should already be correct; fix only if a path differs.

- [ ] **Step 2: Write the failing test**

Create `src/contexts/reducers/__tests__/lesson-reducer.test.ts`:
```typescript
import { lessonReducer } from '../lesson-reducer';
import { getLessonData } from '../../../data/lessons-data';

// Build the initial state via the reducer's own LOAD flow against real content.
function freshLoaded() {
  const data = getLessonData('A1L1');
  // LOAD_LESSON_SUCCESS hydrates lessonData and resets navigation.
  return lessonReducer(
    lessonReducer(undefined as never, { type: 'LOAD_LESSON_START' }),
    { type: 'LOAD_LESSON_SUCCESS', payload: data! },
  );
}

test('LOAD_LESSON_SUCCESS hydrates lesson data and clears loading', () => {
  const s = freshLoaded();
  expect(s.lessonData?.lessonId).toBe('A1L1');
  expect(s.loading).toBe(false);
});

test('SELECT_ANSWER records the chosen option for a question', () => {
  const s = lessonReducer(freshLoaded(), {
    type: 'SELECT_ANSWER',
    payload: { questionId: 'q1', optionId: 'opt-a' },
  });
  expect(s.answers.q1).toBe('opt-a');
});

test('NEXT_SCREEN advances the screen index', () => {
  const s0 = freshLoaded();
  const s1 = lessonReducer(s0, { type: 'NEXT_SCREEN' });
  expect(s1.screenIndex).toBe(s0.screenIndex + 1);
});

test('RECORD_QUESTION_SCORE accumulates earned points', () => {
  const s = lessonReducer(freshLoaded(), {
    type: 'RECORD_QUESTION_SCORE',
    payload: { questionId: 'q1', points: 100 },
  });
  expect(s.questionScores.q1).toBe(100);
});
```

> NOTE: the test above calls the reducer with no initial state for the very first `LOAD_LESSON_START`. If the ported reducer instead exports an `initialLessonState`, import it and use `lessonReducer(initialLessonState, ...)` in `freshLoaded()` rather than `undefined as never`. Pick whichever the source provides and make the test consistent — do not weaken the assertions.

- [ ] **Step 3: Run, adapt, pass**

Run: `npx jest src/contexts/reducers/__tests__/lesson-reducer.test.ts`
Expected: PASS (4 tests). If an action name or the initial-state export differs from the assumptions above, align the test to the actual ported API (these are real names from the source, not inventions) — do not change the reducer logic.

- [ ] **Step 4: Commit**

```bash
git add src/contexts/reducers/lesson-reducer.ts src/contexts/lesson-context.tsx src/contexts/reducers/__tests__/lesson-reducer.test.ts
git commit -m "feat(domain): port Lesson engine reducer and provider"
```

---

### Task 10: Wire the domain provider tree into the root layout

**Files:**
- Modify: `src/app/_layout.tsx`
- Test: `src/app/__tests__/root-providers.test.tsx`

**Interfaces:**
- Consumes: all providers from Tasks 1–9.
- Produces: an updated root tree. SessionProvider stays (removed in Phase 4).

Nest the new providers inside the existing tree, below `BrandProvider` and above `FontGate`, in the dependency order from the design. Keep `GestureHandlerRootView`, `SafeAreaProvider`, `BottomSheetModalProvider`, `BrandProvider`, `SessionProvider`, `FontGate`, and the `Stack`.

- [ ] **Step 1: Write the failing test**

Create `src/app/__tests__/root-providers.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider } from '../../contexts/persistence-context';
import { SettingsProvider } from '../../contexts/settings-context';
import { SoundProvider } from '../../contexts/sound-context';
import { AuthProvider } from '../../contexts/auth-context';
import { ProgressProvider } from '../../contexts/progress-context';
import { OnboardingProvider } from '../../contexts/onboarding-context';
import { SubscriptionProvider } from '../../contexts/subscription-context';
import { LessonProvider } from '../../contexts/lesson-context';

jest.mock('expo-linking', () => ({
  parse: () => ({ queryParams: {} }),
  getInitialURL: async () => null,
  addEventListener: () => ({ remove: () => {} }),
}));

test('the full domain provider stack mounts children', () => {
  const { getByText } = render(
    <PersistenceProvider value={createInMemoryPersistence()}>
      <SettingsProvider>
        <SoundProvider>
          <AuthProvider>
            <ProgressProvider>
              <OnboardingProvider>
                <SubscriptionProvider>
                  <LessonProvider>
                    <Text>app</Text>
                  </LessonProvider>
                </SubscriptionProvider>
              </OnboardingProvider>
            </ProgressProvider>
          </AuthProvider>
        </SoundProvider>
      </SettingsProvider>
    </PersistenceProvider>,
  );
  expect(getByText('app')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails (or passes if providers compose cleanly)**

Run: `npx jest src/app/__tests__/root-providers.test.tsx`
Expected: PASS once all Task 1–9 providers exist and compose. If `LessonProvider`'s export name differs, align the import.

- [ ] **Step 3: Wire `src/app/_layout.tsx`**

Edit `src/app/_layout.tsx` to add the imports and nest the providers. The resulting tree:
```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <SafeAreaProvider>
    <BottomSheetModalProvider>
      <BrandProvider>
        <PersistenceProvider>
          <SettingsProvider>
            <SoundProvider>
              <AuthProvider>
                <ProgressProvider>
                  <OnboardingProvider>
                    <SubscriptionProvider>
                      <LessonProvider>
                        <SessionProvider>
                          <FontGate>
                            <Stack screenOptions={{ headerShown: false }} />
                          </FontGate>
                        </SessionProvider>
                      </LessonProvider>
                    </SubscriptionProvider>
                  </OnboardingProvider>
                </ProgressProvider>
              </AuthProvider>
            </SoundProvider>
          </SettingsProvider>
        </PersistenceProvider>
      </BrandProvider>
    </BottomSheetModalProvider>
  </SafeAreaProvider>
</GestureHandlerRootView>
```
Add the corresponding imports at the top (from `../contexts/persistence-context`, `../contexts/settings-context`, `../contexts/sound-context`, `../contexts/auth-context`, `../contexts/progress-context`, `../contexts/onboarding-context`, `../contexts/subscription-context`, `../contexts/lesson-context`). Keep the existing `BrandProvider`, `SessionProvider`, `FontGate` imports.

- [ ] **Step 4: Run the full suite (regression gate)**

Run: `npm test`
Expected: PASS — Phase 1 + Phase 2 + Phase 3 tests all green, and the existing shell/tab/integration tests still pass (the new providers wrap but don't alter existing screens). If a pre-existing integration test renders `_layout` and now requires the in-memory persistence, update that test's wrapper to inject `createInMemoryPersistence()` — do not weaken assertions.

- [ ] **Step 5: Commit**

```bash
git add src/app/_layout.tsx src/app/__tests__/root-providers.test.tsx
git commit -m "feat(domain): wire domain provider tree into root layout"
```

---

## Self-Review

**Spec coverage (Phase 3 = the design's domain-layer section):**
- Persistence DI seam → Task 1 ✓
- Settings → Task 3 ✓ ; Onboarding → Task 4 ✓ ; Progress + streak → Tasks 2, 6 ✓ ; Sound state → Task 8 ✓ ; Lesson engine → Task 9 ✓ ; daily-limit → Task 7 ✓
- Auth/Subscription no-op stubs → Task 5 ✓
- Provider tree wired → Task 10 ✓

**Intentional deviations from the design (documented, correct):**
- `SessionContext` is NOT deleted here — its consumers are Phase 4 UI; deletion moves to Phase 4 to keep the build green. (Design said "delete in Phase 3"; this sequencing fix avoids a broken intermediate state.)
- Sound **playback** is deferred to Phase 5 (PMP's `expo-av` loader is incompatible with SDK 56); only the sound **state** provider is ported now.
- Progress uses a **dual-write** (aggregate blob in `kv` + attempt log in `AttemptRepository`) under a v2 key, coexisting with the Phase 1 legacy migration. The attempts repo is the source-of-truth log; the blob is the derived aggregate cache (PMP's proven reducer math).

**Placeholder scan:** none — every code step has complete code or an exact copy-then-adapt edit list with named identifiers.

**Type consistency:** `usePersistence()` returns `{ kv, secure, attempts }` (Phase 1) and is the only persistence access in every context. `Domain`/`LessonAttempt` come from `src/types/progress.ts` (Phase 1) and are re-exported by the ported progress-reducer, not redefined. Subscription stub's `isPremium` is read by the daily-limit hook. Provider nesting order in Task 10 matches the design's tree (minus the flag-gated infra providers, which are Phase 5).

**Risk notes:** Tasks 4, 6, 7, 9 are copy-then-adapt ports — the executor must read the PMP source file named in each task and apply the listed edits, not retype from memory. Task 9 (lesson engine, ~700 lines) is the largest; its public API names in the test (`SELECT_ANSWER`, `NEXT_SCREEN`, `RECORD_QUESTION_SCORE`, `LOAD_LESSON_SUCCESS`) are taken from the actual source action union and must be reconciled with the ported file if any differ.
