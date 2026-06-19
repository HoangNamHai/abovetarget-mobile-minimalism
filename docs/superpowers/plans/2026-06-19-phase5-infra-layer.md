# Phase 5 — Infra Layer (Sentry, Network, Notifications, Clerk, RevenueCat) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port PMP's infra integrations into the SDK-56 shell behind interfaces + feature flags so every integration ships **dormant by default** (Sentry off in dev, NetInfo safe-fallback, notifications off in Expo Go, Clerk falls back to the existing stub when no publishable key is present, RevenueCat stays `REVENUECAT_DISABLED=true` → all-premium), the existing 164-test suite stays green, and domain code keeps depending on interfaces — never SDKs directly.

**Architecture:** Each native integration is wrapped behind a small interface in `src/services/infra/**` with a **real impl** (safe-`require` so a missing native module never crashes the JS bundle) and an **in-memory fake** for tests. Auth and Subscription keep their existing React-context value shapes (`AppAuthValue`, `SubscriptionValue`) and gain real SDK-backed provider bodies selected at runtime by a flag/key check, falling back to today's stub. Sentry/NetInfo/notifications are imperative services consumed via thin hooks/providers. All native SDKs are mocked in Jest so unit tests exercise gating logic and fakes, not real native code.

**Tech Stack:** Expo SDK 56, `jest-expo`, `@testing-library/react-native`, `@clerk/clerk-expo`, `react-native-purchases`, `@sentry/react-native`, `expo-notifications`, `@react-native-community/netinfo`, `expo-secure-store` (already installed), `expo-constants` (already installed).

## Global Constraints

- **Expo SDK 56.** Install native deps with `npx expo install <pkg>` (NOT `npm install`) so versions are SDK-56-aligned. Read https://docs.expo.dev/versions/v56.0.0/ for `expo-notifications` and `expo-constants` APIs before relying on them — the scheduling trigger API and `executionEnvironment` enum must match v56.
- **Full suite:** `npm test` (sets `TZ=UTC`); single file: `npx jest <path>`. **The existing 164 tests must stay green after every task.**
- **Test style:** plain `test(...)`, no `describe`. RNTL is async here: `await render(...)` / `await renderHook(...)`; make those tests `async`. Throw-guards use the error-boundary pattern in `src/contexts/__tests__/persistence-context.test.tsx`.
- **Dormant by default — the whole phase ships OFF:**
  - `REVENUECAT_DISABLED = true` (already in `src/config/revenuecat.ts`) → all users premium, RC SDK never configured.
  - Clerk: real provider only when `CLERK_PUBLISHABLE_KEY` is a non-empty string; otherwise the current stub `AuthProvider` body runs unchanged.
  - Sentry: `enabled: !__DEV__` AND a non-empty DSN; in dev or with no DSN it is a no-op.
  - Notifications: no-op when `Constants.executionEnvironment === 'storeClient'` (Expo Go) or the native module is absent.
  - NetInfo: when the native module is absent, assume connected (`isConnected = true`).
- **Safe-require pattern** (every real impl uses this so Expo Go / Jest never crashes):
  ```typescript
  let Mod: typeof import('pkg') | null = null;
  try { Mod = require('pkg'); } catch { /* native module unavailable */ }
  ```
- **Interface-first:** domain/UI consumes `src/services/infra/*` interfaces or the existing context hooks, never a native SDK import directly. Only files under `src/services/infra/**` and the two SDK-backed context bodies (`auth-context.tsx`, `subscription-context.tsx`) and the root `_layout.tsx` may `require`/import a native SDK.
- **Reuse existing config:** `src/config/revenuecat.ts` (RevenueCat constants + flag) and `src/config/feature-flags.ts` (`SHOW_DEV_OPTIONS`) already exist. Add new env access in `src/config/env.ts`.
- **Do NOT** change app identity (`name`/`slug`/`bundleIdentifier`) — that is Phase 6.

---

### Task 1: Install infra deps + Jest mocks + env config

**Files:**
- Modify: `package.json` (via `expo install`)
- Create: `src/config/env.ts`
- Create: `src/config/__tests__/env.test.ts`
- Modify: `jest-setup-mocks.js` (add native-SDK mocks)

**Interfaces:**
- Produces:
  - `src/config/env.ts` exports: `CLERK_PUBLISHABLE_KEY: string` (`process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''`), `SENTRY_DSN: string` (`process.env.EXPO_PUBLIC_SENTRY_DSN ?? ''`), `hasClerkKey(): boolean`, `sentryEnabled(): boolean` (`!__DEV__ && SENTRY_DSN.length > 0`).

- [ ] **Step 1: Install the five native dependencies**

Run:
```bash
npx expo install @clerk/clerk-expo react-native-purchases @sentry/react-native expo-notifications @react-native-community/netinfo
```
Expected: `package.json` gains all five at SDK-56-compatible versions; `package-lock.json` updates. (`expo-secure-store` + `expo-constants` already present.)

- [ ] **Step 2: Write the failing test for env config**

Create `src/config/__tests__/env.test.ts`:
```typescript
import { CLERK_PUBLISHABLE_KEY, SENTRY_DSN, hasClerkKey, sentryEnabled } from '../env';

test('env exposes string defaults (empty when unset)', () => {
  expect(typeof CLERK_PUBLISHABLE_KEY).toBe('string');
  expect(typeof SENTRY_DSN).toBe('string');
});

test('hasClerkKey reflects whether a publishable key is set', () => {
  expect(hasClerkKey()).toBe(CLERK_PUBLISHABLE_KEY.length > 0);
});

test('sentryEnabled is false in dev/test regardless of DSN', () => {
  // __DEV__ is true under jest-expo, so Sentry must be disabled.
  expect(sentryEnabled()).toBe(false);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/config/__tests__/env.test.ts`
Expected: FAIL — `Cannot find module '../env'`.

- [ ] **Step 4: Implement env config**

Create `src/config/env.ts`:
```typescript
// Centralized access to infra-related public env vars.
// EXPO_PUBLIC_* values are statically inlined at build time.

export const CLERK_PUBLISHABLE_KEY: string =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export const SENTRY_DSN: string = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

/** True when a Clerk publishable key is configured (else auth uses the stub). */
export function hasClerkKey(): boolean {
  return CLERK_PUBLISHABLE_KEY.length > 0;
}

/** Sentry only reports outside dev and only when a DSN is configured. */
export function sentryEnabled(): boolean {
  return !__DEV__ && SENTRY_DSN.length > 0;
}
```

- [ ] **Step 5: Add native-SDK Jest mocks so existing tests still load**

In `jest-setup-mocks.js`, append (keep existing content above):
```javascript
// --- Phase 5 infra: mock native SDKs so the JS suite never touches native code ---

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (c) => c,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    logIn: jest.fn(async () => ({})),
    logOut: jest.fn(async () => ({})),
    getCustomerInfo: jest.fn(async () => ({ entitlements: { active: {} } })),
    getOfferings: jest.fn(async () => ({ current: null })),
    purchasePackage: jest.fn(async () => ({ customerInfo: { entitlements: { active: {} } } })),
    restorePurchases: jest.fn(async () => ({ entitlements: { active: {} } })),
    addCustomerInfoUpdateListener: jest.fn(() => jest.fn()),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG' },
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(async () => ({ isConnected: true })),
  },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => {}),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => 'notif-id'),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

jest.mock('@clerk/clerk-expo', () => ({
  ClerkProvider: ({ children }) => children,
  ClerkLoaded: ({ children }) => children,
  useAuth: () => ({ isLoaded: true, isSignedIn: false, signOut: jest.fn(async () => {}) }),
  useUser: () => ({ isLoaded: true, user: null }),
}));
```

- [ ] **Step 6: Run env test + full suite**

Run: `npx jest src/config/__tests__/env.test.ts && npm test`
Expected: env tests PASS; full suite still 164+ tests green (mocks prevent native-import failures). Then `npx tsc --noEmit` → clean.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/config/env.ts src/config/__tests__/env.test.ts jest-setup-mocks.js
git commit -m "feat(infra): install Clerk/RevenueCat/Sentry/notifications/NetInfo + env config + jest mocks"
```

---

### Task 2: Monitoring service (Sentry wrapper)

**Files:**
- Create: `src/services/infra/monitoring.ts`
- Create: `src/services/infra/__tests__/monitoring.test.ts`
- Modify: `src/app/_layout.tsx` (init + `Sentry.wrap`)

**Interfaces:**
- Consumes: `sentryEnabled`, `SENTRY_DSN` from `../../config/env`.
- Produces (`src/services/infra/monitoring.ts`):
  - `initMonitoring(): void` — calls the SDK's `init` only when `sentryEnabled()`.
  - `captureException(error: unknown, extra?: Record<string, unknown>): void` — forwards to SDK only when enabled; otherwise no-op.
  - `wrapRoot<T>(component: T): T` — returns `Sentry.wrap(component)` when the SDK is present, else the component unchanged.
  - `__setMonitoringClientForTests(client: MonitoringClient | null): void` and `type MonitoringClient = { init: Function; captureException: Function; wrap: <T>(c: T) => T }`.

- [ ] **Step 1: Write the failing test**

Create `src/services/infra/__tests__/monitoring.test.ts`:
```typescript
import {
  initMonitoring,
  captureException,
  __setMonitoringClientForTests,
} from '../monitoring';

afterEach(() => __setMonitoringClientForTests(null));

test('initMonitoring does NOT init the client in dev/test', () => {
  const init = jest.fn();
  __setMonitoringClientForTests({ init, captureException: jest.fn(), wrap: (c) => c });
  initMonitoring();
  // sentryEnabled() is false under jest (__DEV__), so init must not be called.
  expect(init).not.toHaveBeenCalled();
});

test('captureException is a no-op when monitoring is disabled', () => {
  const captured = jest.fn();
  __setMonitoringClientForTests({ init: jest.fn(), captureException: captured, wrap: (c) => c });
  expect(() => captureException(new Error('boom'), { a: 1 })).not.toThrow();
  expect(captured).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/infra/__tests__/monitoring.test.ts`
Expected: FAIL — `Cannot find module '../monitoring'`.

- [ ] **Step 3: Implement monitoring**

Create `src/services/infra/monitoring.ts`:
```typescript
import { sentryEnabled, SENTRY_DSN } from '../../config/env';

export type MonitoringClient = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (error: unknown, hint?: { extra?: Record<string, unknown> }) => void;
  wrap: <T>(component: T) => T;
};

let client: MonitoringClient | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  client = require('@sentry/react-native') as MonitoringClient;
} catch {
  client = null;
}

/** Test seam: inject a fake client (or null to reset to the real one). */
export function __setMonitoringClientForTests(c: MonitoringClient | null): void {
  client = c;
}

export function initMonitoring(): void {
  if (!client || !sentryEnabled()) return;
  client.init({
    dsn: SENTRY_DSN,
    enabled: true,
    tracesSampleRate: 1.0,
    enableAutoSessionTracking: true,
    environment: 'production',
  });
}

export function captureException(error: unknown, extra?: Record<string, unknown>): void {
  if (!client || !sentryEnabled()) return;
  client.captureException(error, extra ? { extra } : undefined);
}

export function wrapRoot<T>(component: T): T {
  if (!client) return component;
  return client.wrap(component);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/infra/__tests__/monitoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire into the root layout**

In `src/app/_layout.tsx`: add imports and call `initMonitoring()` once at module scope, and export the wrapped root. Add near the top imports:
```typescript
import { initMonitoring, wrapRoot } from '../services/infra/monitoring';
```
Immediately after the imports (module scope, before `export default function RootLayout`):
```typescript
initMonitoring();
```
Change the component to a named function and export the wrapped version. Replace `export default function RootLayout() {` with `function RootLayout() {` and at the end of the file add:
```typescript
export default wrapRoot(RootLayout);
```

- [ ] **Step 6: Run the root-providers test + tsc**

Run: `npx jest src/app/__tests__/root-providers.test.tsx && npx tsc --noEmit`
Expected: PASS + clean (wrap is identity in tests via the mock).

- [ ] **Step 7: Commit**

```bash
git add src/services/infra/monitoring.ts src/services/infra/__tests__/monitoring.test.ts src/app/_layout.tsx
git commit -m "feat(infra): Sentry monitoring wrapper (dormant in dev), wrap root layout"
```

---

### Task 3: Network service + NetworkProvider

**Files:**
- Create: `src/services/infra/network.ts`
- Create: `src/contexts/network-context.tsx`
- Create: `src/contexts/__tests__/network-context.test.tsx`
- Modify: `src/app/_layout.tsx` (mount `NetworkProvider` as outermost infra provider)

**Interfaces:**
- Produces (`src/services/infra/network.ts`):
  - `interface NetworkService { subscribe(cb: (connected: boolean) => void): () => void; fetchConnected(): Promise<boolean>; }`
  - `createNativeNetworkService(): NetworkService` — safe-require `@react-native-community/netinfo`; if absent, `subscribe` immediately reports `true` and returns a no-op unsubscribe, `fetchConnected` resolves `true`.
  - `createFakeNetworkService(initial?: boolean): NetworkService & { emit(connected: boolean): void }`.
- Produces (`src/contexts/network-context.tsx`):
  - `NetworkProvider({ children, service? }: { children: ReactNode; service?: NetworkService })` — defaults to `createNativeNetworkService()`.
  - `useNetwork(): { isConnected: boolean }` (throws if outside provider).

- [ ] **Step 1: Write the failing test**

Create `src/contexts/__tests__/network-context.test.tsx`:
```typescript
import { render, screen, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { NetworkProvider, useNetwork } from '../network-context';
import { createFakeNetworkService } from '../../services/infra/network';

function Probe() {
  const { isConnected } = useNetwork();
  return <Text>{isConnected ? 'online' : 'offline'}</Text>;
}

test('NetworkProvider reflects fake service connectivity changes', async () => {
  const fake = createFakeNetworkService(true);
  await render(
    <NetworkProvider service={fake}>
      <Probe />
    </NetworkProvider>,
  );
  expect(screen.getByText('online')).toBeTruthy();
  await act(async () => fake.emit(false));
  expect(screen.getByText('offline')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/contexts/__tests__/network-context.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the network service**

Create `src/services/infra/network.ts`:
```typescript
export interface NetworkService {
  /** Returns an unsubscribe fn. Invokes cb with the current value soon after subscribe. */
  subscribe(cb: (connected: boolean) => void): () => void;
  fetchConnected(): Promise<boolean>;
}

type NetInfoModule = {
  addEventListener: (cb: (s: { isConnected: boolean | null }) => void) => () => void;
  fetch: () => Promise<{ isConnected: boolean | null }>;
};

export function createNativeNetworkService(): NetworkService {
  let NetInfo: NetInfoModule | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    NetInfo = require('@react-native-community/netinfo').default as NetInfoModule;
  } catch {
    NetInfo = null;
  }
  return {
    subscribe(cb) {
      if (!NetInfo) {
        cb(true);
        return () => {};
      }
      const unsub = NetInfo.addEventListener((s) => cb(s.isConnected ?? true));
      NetInfo.fetch().then((s) => cb(s.isConnected ?? true));
      return unsub;
    },
    async fetchConnected() {
      if (!NetInfo) return true;
      const s = await NetInfo.fetch();
      return s.isConnected ?? true;
    },
  };
}

export function createFakeNetworkService(initial = true) {
  let connected = initial;
  const listeners = new Set<(c: boolean) => void>();
  return {
    subscribe(cb: (c: boolean) => void) {
      listeners.add(cb);
      cb(connected);
      return () => listeners.delete(cb);
    },
    async fetchConnected() {
      return connected;
    },
    emit(value: boolean) {
      connected = value;
      listeners.forEach((l) => l(value));
    },
  };
}
```

- [ ] **Step 4: Implement the provider**

Create `src/contexts/network-context.tsx`:
```typescript
import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createNativeNetworkService, type NetworkService } from '../services/infra/network';

interface NetworkValue {
  isConnected: boolean;
}

const NetworkContext = createContext<NetworkValue | null>(null);

export function NetworkProvider({
  children,
  service,
}: {
  children: ReactNode;
  service?: NetworkService;
}) {
  const svc = useMemo(() => service ?? createNativeNetworkService(), [service]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => svc.subscribe(setIsConnected), [svc]);

  const value = useMemo<NetworkValue>(() => ({ isConnected }), [isConnected]);
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within a NetworkProvider');
  return ctx;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/contexts/__tests__/network-context.test.tsx`
Expected: PASS.

- [ ] **Step 6: Mount NetworkProvider at root (outermost infra)**

In `src/app/_layout.tsx`, import `NetworkProvider` and wrap it just inside `BottomSheetModalProvider`, outside `BrandProvider`:
```typescript
import { NetworkProvider } from '../contexts/network-context';
```
Nesting becomes `BottomSheetModalProvider → NetworkProvider → BrandProvider → …`.

- [ ] **Step 7: Run root test + commit**

Run: `npx jest src/app/__tests__/root-providers.test.tsx && npx tsc --noEmit`
Expected: PASS + clean.
```bash
git add src/services/infra/network.ts src/contexts/network-context.tsx src/contexts/__tests__/network-context.test.tsx src/app/_layout.tsx
git commit -m "feat(infra): NetInfo-backed NetworkProvider with safe fallback"
```

---

### Task 4: Notification service + reminder hook

**Files:**
- Create: `src/services/infra/notifications.ts`
- Create: `src/hooks/use-local-notifications.ts`
- Create: `src/services/infra/__tests__/notifications.test.ts`
- Create: `src/hooks/__tests__/use-local-notifications.test.tsx`

**Interfaces:**
- Consumes: `KeyValueStore` via `usePersistence()` from `src/contexts/persistence-context.tsx` (existing); `Constants` from `expo-constants`.
- Produces (`src/services/infra/notifications.ts`):
  - `type ReminderTime = 'morning' | 'afternoon' | 'evening' | 'disabled'`
  - `interface NotificationService { isAvailable(): boolean; requestPermission(): Promise<boolean>; scheduleDailyReminder(time: ReminderTime): Promise<boolean>; cancelAll(): Promise<void>; }`
  - `createNativeNotificationService(): NotificationService` — safe-require `expo-notifications`; `isAvailable()` false in Expo Go (`Constants.executionEnvironment === 'storeClient'`) or when module absent; `scheduleDailyReminder` cancels all then schedules a DAILY trigger from `TIME_MAPPING`.
  - `createFakeNotificationService(opts?: { available?: boolean; permission?: boolean }): NotificationService & { scheduled: ReminderTime[] }`.
  - `TIME_MAPPING: Record<Exclude<ReminderTime, 'disabled'>, { hour: number; minute: number }>` = morning 9:00, afternoon 12:00, evening 20:00.
- Produces (`src/hooks/use-local-notifications.ts`):
  - `useLocalNotifications(service?: NotificationService)` returning `{ isAvailable, reminderTime, setReminderTime(t): Promise<boolean> }`. Persists the chosen time under KeyValueStore key `@app/reminder-time`.

- [ ] **Step 1: Write the failing test for the service**

Create `src/services/infra/__tests__/notifications.test.ts`:
```typescript
import { createFakeNotificationService, TIME_MAPPING } from '../notifications';

test('TIME_MAPPING has the three presets', () => {
  expect(TIME_MAPPING.morning).toEqual({ hour: 9, minute: 0 });
  expect(TIME_MAPPING.afternoon).toEqual({ hour: 12, minute: 0 });
  expect(TIME_MAPPING.evening).toEqual({ hour: 20, minute: 0 });
});

test('fake service records scheduled reminders and clears on disabled', async () => {
  const svc = createFakeNotificationService({ available: true, permission: true });
  expect(await svc.scheduleDailyReminder('morning')).toBe(true);
  expect(svc.scheduled).toEqual(['morning']);
  expect(await svc.scheduleDailyReminder('disabled')).toBe(false);
  expect(svc.scheduled).toEqual([]);
});

test('fake service refuses to schedule when unavailable', async () => {
  const svc = createFakeNotificationService({ available: false });
  expect(svc.isAvailable()).toBe(false);
  expect(await svc.scheduleDailyReminder('evening')).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/infra/__tests__/notifications.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the notification service**

Create `src/services/infra/notifications.ts`:
```typescript
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type ReminderTime = 'morning' | 'afternoon' | 'evening' | 'disabled';

export const TIME_MAPPING: Record<Exclude<ReminderTime, 'disabled'>, { hour: number; minute: number }> = {
  morning: { hour: 9, minute: 0 },
  afternoon: { hour: 12, minute: 0 },
  evening: { hour: 20, minute: 0 },
};

export interface NotificationService {
  isAvailable(): boolean;
  requestPermission(): Promise<boolean>;
  scheduleDailyReminder(time: ReminderTime): Promise<boolean>;
  cancelAll(): Promise<void>;
}

type NotificationsModule = typeof import('expo-notifications');

export function createNativeNotificationService(): NotificationService {
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  let N: NotificationsModule | null = null;
  if (!isExpoGo) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      N = require('expo-notifications') as NotificationsModule;
    } catch {
      N = null;
    }
  }

  const available = (): boolean => !isExpoGo && N !== null;

  return {
    isAvailable: available,
    async requestPermission() {
      if (!available() || !N) return false;
      const current = await N.getPermissionsAsync();
      if (current.status === 'granted') return true;
      const req = await N.requestPermissionsAsync();
      return req.status === 'granted';
    },
    async scheduleDailyReminder(time) {
      if (!available() || !N) return false;
      await N.cancelAllScheduledNotificationsAsync();
      if (time === 'disabled') return false;
      const granted = await this.requestPermission();
      if (!granted) return false;
      if (Platform.OS === 'android') {
        await N.setNotificationChannelAsync('daily-reminders', {
          name: 'Daily Reminders',
          importance: N.AndroidImportance.HIGH,
        });
      }
      const cfg = TIME_MAPPING[time];
      await N.scheduleNotificationAsync({
        content: { title: 'Time to study', body: 'Keep your PMP streak alive.', sound: true },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DAILY,
          hour: cfg.hour,
          minute: cfg.minute,
        },
      });
      return true;
    },
    async cancelAll() {
      if (!available() || !N) return;
      await N.cancelAllScheduledNotificationsAsync();
    },
  };
}

export function createFakeNotificationService(opts?: { available?: boolean; permission?: boolean }) {
  const available = opts?.available ?? true;
  const permission = opts?.permission ?? true;
  const scheduled: ReminderTime[] = [];
  return {
    scheduled,
    isAvailable: () => available,
    async requestPermission() {
      return available && permission;
    },
    async scheduleDailyReminder(time: ReminderTime) {
      if (!available) return false;
      scheduled.length = 0;
      if (time === 'disabled') return false;
      if (!permission) return false;
      scheduled.push(time);
      return true;
    },
    async cancelAll() {
      scheduled.length = 0;
    },
  };
}
```

- [ ] **Step 4: Run service test to verify it passes**

Run: `npx jest src/services/infra/__tests__/notifications.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing hook test**

Create `src/hooks/__tests__/use-local-notifications.test.tsx`:
```typescript
import { renderHook, act } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { PersistenceProvider } from '../../contexts/persistence-context';
import { createInMemoryPersistence } from '../../services/persistence';
import { useLocalNotifications } from '../use-local-notifications';
import { createFakeNotificationService } from '../../services/infra/notifications';

function wrapper(persistence: ReturnType<typeof createInMemoryPersistence>) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>{children}</PersistenceProvider>
  );
}

test('setReminderTime persists the choice and schedules via the service', async () => {
  const persistence = createInMemoryPersistence();
  const svc = createFakeNotificationService({ available: true, permission: true });
  const { result } = await renderHook(() => useLocalNotifications(svc), {
    wrapper: wrapper(persistence),
  });

  await act(async () => {
    await result.current.setReminderTime('evening');
  });

  expect(result.current.reminderTime).toBe('evening');
  expect(svc.scheduled).toEqual(['evening']);
  expect(await persistence.keyValue.getJSON('@app/reminder-time')).toBe('evening');
});
```
(Confirm the `Persistence` shape exposes `keyValue` with `getJSON`/`setJSON` — check `src/services/persistence/index.ts`; adjust the accessor name to match if different.)

- [ ] **Step 6: Run hook test to verify it fails**

Run: `npx jest src/hooks/__tests__/use-local-notifications.test.tsx`
Expected: FAIL — `use-local-notifications` not found.

- [ ] **Step 7: Implement the hook**

Create `src/hooks/use-local-notifications.ts`:
```typescript
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePersistence } from '../contexts/persistence-context';
import {
  createNativeNotificationService,
  type NotificationService,
  type ReminderTime,
} from '../services/infra/notifications';

const REMINDER_KEY = '@app/reminder-time';

export function useLocalNotifications(service?: NotificationService) {
  const persistence = usePersistence();
  const svc = useMemo(() => service ?? createNativeNotificationService(), [service]);
  const [reminderTime, setReminderTimeState] = useState<ReminderTime>('disabled');

  useEffect(() => {
    let active = true;
    persistence.keyValue.getJSON<ReminderTime>(REMINDER_KEY).then((stored) => {
      if (active && stored) setReminderTimeState(stored);
    });
    return () => {
      active = false;
    };
  }, [persistence]);

  const setReminderTime = useCallback(
    async (time: ReminderTime): Promise<boolean> => {
      const ok = await svc.scheduleDailyReminder(time);
      setReminderTimeState(time);
      await persistence.keyValue.setJSON(REMINDER_KEY, time);
      return ok;
    },
    [svc, persistence],
  );

  return { isAvailable: svc.isAvailable(), reminderTime, setReminderTime };
}
```
(Match `usePersistence`/`persistence.keyValue` to the real exports from `src/contexts/persistence-context.tsx` + `src/services/persistence/index.ts`. If the key-value accessor is named differently, e.g. `persistence.kv`, use that.)

- [ ] **Step 8: Run hook test + tsc**

Run: `npx jest src/hooks/__tests__/use-local-notifications.test.tsx && npx tsc --noEmit`
Expected: PASS + clean.

- [ ] **Step 9: Commit**

```bash
git add src/services/infra/notifications.ts src/hooks/use-local-notifications.ts src/services/infra/__tests__/notifications.test.ts src/hooks/__tests__/use-local-notifications.test.tsx
git commit -m "feat(infra): notification service (Expo Go-gated) + reminder hook"
```

---

### Task 5: Clerk token cache + SDK-backed AuthProvider (flag-gated)

**Files:**
- Create: `src/services/infra/clerk-token-cache.ts`
- Modify: `src/contexts/auth-context.tsx` (real provider body + stub fallback)
- Modify: `src/app/_layout.tsx` (mount `ClerkProvider` flag-gated, outside `BrandProvider`/`SettingsProvider`, around `AuthProvider`)
- Modify: `src/contexts/__tests__/auth-context.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `hasClerkKey`, `CLERK_PUBLISHABLE_KEY` from `../config/env`; `useAuth`, `useUser` from `@clerk/clerk-expo`.
- Produces:
  - `src/services/infra/clerk-token-cache.ts` exports `tokenCache: { getToken(key): Promise<string|null>; saveToken(key, value): Promise<void> }` backed by `expo-secure-store`.
  - `auth-context.tsx` unchanged public surface: `AuthProvider`, `useAppAuth(): AppAuthValue`. Internally: when `hasClerkKey()` → a Clerk-backed body reading `useAuth()`/`useUser()`; else the existing stub body.
  - `ClerkGate({ children })` exported from `auth-context.tsx` — renders `<ClerkProvider publishableKey tokenCache><ClerkLoaded>{children}</ClerkLoaded></ClerkProvider>` when `hasClerkKey()`, else `{children}` (so the stub path needs no Clerk).

- [ ] **Step 1: Write the failing test (stub fallback path)**

Create/replace `src/contexts/__tests__/auth-context.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAppAuth, ClerkGate } from '../auth-context';

function Probe() {
  const { isSignedIn, isLoading } = useAppAuth();
  return <Text>{`${isSignedIn ? 'in' : 'out'}:${isLoading ? 'loading' : 'ready'}`}</Text>;
}

test('without a Clerk key, ClerkGate is a passthrough and auth is the signed-out stub', async () => {
  await render(
    <ClerkGate>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </ClerkGate>,
  );
  expect(screen.getByText('out:ready')).toBeTruthy();
});
```
(`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is unset under jest → `hasClerkKey()` is false → stub path.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/contexts/__tests__/auth-context.test.tsx`
Expected: FAIL — `ClerkGate` is not exported.

- [ ] **Step 3: Implement the token cache**

Create `src/services/infra/clerk-token-cache.ts`:
```typescript
import * as SecureStore from 'expo-secure-store';

export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // no-op on platforms without SecureStore
    }
  },
};
```

- [ ] **Step 4: Rewrite auth-context with gated real/stub bodies**

Replace `src/contexts/auth-context.tsx` with:
```typescript
import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ClerkProvider, ClerkLoaded, useAuth, useUser } from '@clerk/clerk-expo';
import { CLERK_PUBLISHABLE_KEY, hasClerkKey } from '../config/env';
import { tokenCache } from '../services/infra/clerk-token-cache';

export interface AppAuthValue {
  isSignedIn: boolean;
  isLoading: boolean;
  user: { id: string; email: string | null } | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AppAuthValue | null>(null);

/** Mounts ClerkProvider only when a publishable key is configured; else passthrough. */
export function ClerkGate({ children }: { children: ReactNode }) {
  if (!hasClerkKey()) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>{children}</ClerkLoaded>
    </ClerkProvider>
  );
}

function StubAuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AppAuthValue>(
    () => ({ isSignedIn: false, isLoading: false, user: null, signOut: async () => {} }),
    [],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const value = useMemo<AppAuthValue>(
    () => ({
      isSignedIn: !!isSignedIn,
      isLoading: !isLoaded,
      user: user ? { id: user.id, email: user.primaryEmailAddress?.emailAddress ?? null } : null,
      signOut: async () => {
        await signOut();
      },
    }),
    [isLoaded, isSignedIn, user, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (hasClerkKey()) return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  return <StubAuthProvider>{children}</StubAuthProvider>;
}

export function useAppAuth(): AppAuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAppAuth must be used within an AuthProvider');
  return ctx;
}
```

- [ ] **Step 5: Run auth test to verify it passes**

Run: `npx jest src/contexts/__tests__/auth-context.test.tsx`
Expected: PASS (stub path; the `@clerk/clerk-expo` mock keeps imports safe).

- [ ] **Step 6: Mount ClerkGate at root**

In `src/app/_layout.tsx`, import `ClerkGate` from `../contexts/auth-context` and wrap it around the subtree that contains `AuthProvider`. Per the spec the Clerk provider sits high (around auth): wrap `ClerkGate` just inside `NetworkProvider`, outside `BrandProvider`:
```typescript
import { AuthProvider, ClerkGate } from '../contexts/auth-context';
```
Nesting: `NetworkProvider → ClerkGate → BrandProvider → … → AuthProvider → …` (AuthProvider stays where it is in the existing tree).

- [ ] **Step 7: Run root + full suite + tsc**

Run: `npx jest src/app/__tests__/root-providers.test.tsx && npm test && npx tsc --noEmit`
Expected: all green + clean.

- [ ] **Step 8: Commit**

```bash
git add src/services/infra/clerk-token-cache.ts src/contexts/auth-context.tsx src/contexts/__tests__/auth-context.test.tsx src/app/_layout.tsx
git commit -m "feat(infra): Clerk-backed AuthProvider gated by publishable key (stub fallback)"
```

---

### Task 6: SDK-backed RevenueCat SubscriptionProvider (flag-gated, dormant)

**Files:**
- Modify: `src/contexts/subscription-context.tsx` (real inner provider, gated by `REVENUECAT_DISABLED`)
- Modify/Create: `src/contexts/__tests__/subscription-context.test.tsx`

**Interfaces:**
- Consumes: `REVENUECAT_DISABLED`, `REVENUECAT_API_KEYS`, `ENTITLEMENTS` from `../config/revenuecat`; `Purchases` (+ `LOG_LEVEL`) from `react-native-purchases`; `Platform` from `react-native`.
- Produces: same public surface — `SubscriptionProvider`, `useSubscription(): SubscriptionValue`. When `REVENUECAT_DISABLED` the existing all-premium no-op body runs unchanged. When enabled, an inner provider configures Purchases, reads entitlements, and implements `purchasePackage`/`restorePurchases`.

- [ ] **Step 1: Write the failing test (disabled stays all-premium; both paths mount)**

Create/replace `src/contexts/__tests__/subscription-context.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SubscriptionProvider, useSubscription } from '../subscription-context';
import { REVENUECAT_DISABLED } from '../../config/revenuecat';

function Probe() {
  const { isPremium, isInitialized } = useSubscription();
  return <Text>{`${isPremium ? 'premium' : 'free'}:${isInitialized ? 'init' : 'pending'}`}</Text>;
}

test('while REVENUECAT_DISABLED, everyone is premium and initialized', async () => {
  expect(REVENUECAT_DISABLED).toBe(true);
  await render(
    <SubscriptionProvider>
      <Probe />
    </SubscriptionProvider>,
  );
  expect(screen.getByText('premium:init')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it passes or fails**

Run: `npx jest src/contexts/__tests__/subscription-context.test.tsx`
Expected: PASS already if the current disabled body matches; if `isInitialized` isn't exposed, this FAILs and Step 3 fixes the shape. Either way keep the test.

- [ ] **Step 3: Add the SDK-backed inner provider (only runs when enabled)**

Edit `src/contexts/subscription-context.tsx`. Keep the existing `SubscriptionValue` interface and the disabled no-op body. Add the real inner provider and switch on the flag. Add imports at top:
```typescript
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { REVENUECAT_API_KEYS, ENTITLEMENTS } from '../config/revenuecat';
import { useEffect, useState, useCallback } from 'react';
```
Add the inner provider:
```typescript
function SubscriptionProviderInner({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    const unsub = Purchases.addCustomerInfoUpdateListener((info) => {
      if (active) setIsPremium(!!info.entitlements.active[ENTITLEMENTS.PRO]);
    });
    Purchases.getCustomerInfo()
      .then((info) => {
        if (!active) return;
        setIsPremium(!!info.entitlements.active[ENTITLEMENTS.PRO]);
      })
      .finally(() => {
        if (!active) return;
        setIsInitialized(true);
        setIsLoading(false);
      });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const purchasePackage = useCallback(async () => {
    /* real flow wired when paywall ships; offerings/packages added then */
  }, []);
  const restorePurchases = useCallback(async () => {
    await Purchases.restorePurchases();
  }, []);

  const value = useMemo<SubscriptionValue>(
    () => ({
      isPremium,
      isLoading,
      isInitialized,
      error: null,
      purchasePackage,
      restorePurchases,
      clearError: () => {},
    }),
    [isPremium, isLoading, isInitialized, purchasePackage, restorePurchases],
  );
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}
```
Change the exported `SubscriptionProvider` to branch:
```typescript
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  if (REVENUECAT_DISABLED) {
    // existing all-premium no-op body (unchanged) ...
  }
  return <SubscriptionProviderInner>{children}</SubscriptionProviderInner>;
}
```
(Keep the existing disabled body verbatim inside the `if`.)

- [ ] **Step 4: Run subscription test + full suite + tsc**

Run: `npx jest src/contexts/__tests__/subscription-context.test.tsx && npm test && npx tsc --noEmit`
Expected: PASS (flag is `true`, so the inner provider is never mounted in tests) + suite green + clean.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/subscription-context.tsx src/contexts/__tests__/subscription-context.test.tsx
git commit -m "feat(infra): SDK-backed RevenueCat provider behind REVENUECAT_DISABLED (dormant)"
```

---

### Task 7: app.json infra plugins + boot integration test

**Files:**
- Modify: `app.json` (add `expo-notifications`, `@sentry/react-native/expo`, `expo-build-properties` plugins)
- Create: `src/app/__tests__/infra-boot.test.tsx`

**Interfaces:**
- Consumes: the full provider tree from `src/app/_layout.tsx`; all infra services in their dormant default state.
- Produces: a boot test proving the app renders through every infra provider with all flags off.

- [ ] **Step 1: Add infra plugins to app.json**

In `app.json`, extend the `plugins` array (keep existing entries) with:
```json
"expo-notifications",
[
  "@sentry/react-native/expo",
  { "organization": "manavn", "project": "pmp-exam-pro" }
],
[
  "expo-build-properties",
  {
    "android": {
      "enableProguardInReleaseBuilds": true,
      "enableShrinkResourcesInReleaseBuilds": true
    }
  }
]
```
Run `npx expo install expo-build-properties` if it is not already a dependency.

- [ ] **Step 2: Write the failing boot test**

Create `src/app/__tests__/infra-boot.test.tsx`:
```typescript
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { NetworkProvider } from '../../contexts/network-context';
import { ClerkGate, AuthProvider } from '../../contexts/auth-context';
import { SubscriptionProvider } from '../../contexts/subscription-context';
import { createFakeNetworkService } from '../../services/infra/network';

// Smoke: the infra providers compose and render children with all flags dormant.
test('infra providers compose and render children (all dormant)', async () => {
  const net = createFakeNetworkService(true);
  const tree = await render(
    <NetworkProvider service={net}>
      <ClerkGate>
        <AuthProvider>
          <SubscriptionProvider>
            <Text>booted</Text>
          </SubscriptionProvider>
        </AuthProvider>
      </ClerkGate>
    </NetworkProvider>,
  );
  expect(tree.getByText('booted')).toBeTruthy();
});
```

- [ ] **Step 3: Run boot test**

Run: `npx jest src/app/__tests__/infra-boot.test.tsx`
Expected: PASS.

- [ ] **Step 4: Validate app.json parses + full gate**

Run: `node -e "JSON.parse(require('fs').readFileSync('app.json','utf8')); console.log('app.json OK')" && npm test && npx tsc --noEmit`
Expected: `app.json OK`, full suite green, tsc clean.

- [ ] **Step 5: Commit**

```bash
git add app.json package.json package-lock.json src/app/__tests__/infra-boot.test.tsx
git commit -m "feat(infra): register notifications/Sentry/build-properties plugins + boot integration test"
```

---

## Self-Review

**Spec coverage** (master design §"Infra layer" lines 132–142):
- Sentry `Sentry.wrap` at root, `enabled: !__DEV__` → Task 2. ✔
- Clerk `ClerkProvider` + SecureStore token cache + real `AuthProvider`, needs `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` → Task 5. ✔
- RevenueCat `SubscriptionProvider` honoring `REVENUECAT_DISABLED` (stays all-premium) → Task 6. ✔
- expo-notifications daily reminder via a hook, runtime-gated off in Expo Go → Tasks 3/4. ✔
- NetInfo `NetworkProvider`, graceful fallback → Task 3. ✔
- "Each behind its interface so domain code is untouched when toggled" → `src/services/infra/**` interfaces + fakes in every task. ✔

**Placeholder scan:** purchasePackage in Task 6 is intentionally a stub body (paywall ships dormant per spec "out of scope: flipping REVENUECAT_DISABLED"); documented inline, not a hidden TODO. No other placeholders.

**Type consistency:** `AppAuthValue` (Task 5) and `SubscriptionValue` (Task 6) preserve the existing exported shapes consumed by profile/home; `NotificationService`/`NetworkService` names are stable across producer/consumer; `ReminderTime` shared between service and hook.

**Known verification points for the executor** (confirm against real files, adjust call sites — not plan gaps):
- `src/services/persistence/index.ts` key-value accessor name (`persistence.keyValue` vs `.kv`) and method names (`getJSON`/`setJSON`) used in Task 4.
- `expo-notifications` v56 trigger API (`SchedulableTriggerInputTypes.DAILY`) — verify against the v56 docs before Task 3 Step 3.
- Existing `subscription-context.tsx` disabled body field names (`isInitialized`) — Task 6 Step 2 surfaces any mismatch.

---

## Execution Handoff

Subagent-driven execution (fresh subagent per task, review between tasks). After all 7 tasks: gate = full suite green + `tsc --noEmit` clean + every flag dormant by default. Then proceed to the Phase 6 (release) plan.
