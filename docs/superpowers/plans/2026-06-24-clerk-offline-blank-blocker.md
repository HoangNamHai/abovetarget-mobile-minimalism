# Fix: Blank Screen on Offline/Slow Cold Launch (ClerkLoaded gate) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The app renders onboarding/UI immediately on cold launch regardless of connectivity, instead of blocking behind Clerk's network load (which currently shows a blank screen — forever when offline).

**Architecture:** `ClerkGate` (`src/contexts/auth-context.tsx`) wraps the entire app tree and currently uses `<ClerkLoaded>` to defer rendering its children until Clerk finishes a network round-trip. Auth in this app is **optional/anonymous** by design (`src/lib/auth/auth-route.ts` — landing depends only on onboarding, never auth), and every auth consumer already tolerates the "not loaded / signed-out" state via `useAppAuth().isLoading`. So the fix is to drop the `<ClerkLoaded>` gate and let Clerk hydrate in the background.

**Tech Stack:** React Native / Expo Router, `@clerk/clerk-expo`, Jest + `@testing-library/react-native`.

## Global Constraints

- App id: `com.h2ai.pmpexampro`; current version `1.1.0`.
- Test runner: `npm test` → `TZ=UTC jest`. Run one file with `npm test -- <path>`.
- Do not change auth behavior for signed-in users; only change *when* the tree mounts.
- Keep the existing key-less passthrough path (`hasClerkKey() === false`) unchanged.
- Commit after each task.

---

### Task 1: Make `ClerkGate` non-blocking (render children without waiting for Clerk)

**Files:**
- Modify: `src/contexts/auth-context.tsx:2` (import) and `:16-23` (`ClerkGate`)
- Test: `src/contexts/__tests__/auth-context-gate.test.tsx` (create)

**Interfaces:**
- Consumes: `ClerkProvider` from `@clerk/clerk-expo`; `CLERK_PUBLISHABLE_KEY`, `hasClerkKey` from `../config/env`; `tokenCache` from `../services/infra/clerk-token-cache`.
- Produces: `ClerkGate({ children }): JSX.Element` — when a key is configured, mounts `<ClerkProvider>` and renders `children` **immediately** (no `ClerkLoaded`). Signature unchanged.

- [ ] **Step 1: Write the failing test**

Create `src/contexts/__tests__/auth-context-gate.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// Simulate Clerk that has NOT finished loading: ClerkLoaded renders nothing,
// useAuth reports not-loaded. This mirrors an offline / slow cold start.
jest.mock('@clerk/clerk-expo', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  ClerkLoaded: () => null, // gate would hide the app if still used
  useAuth: () => ({ isLoaded: false, isSignedIn: false, signOut: async () => {} }),
  useUser: () => ({ user: null }),
}));

// Force the "Clerk configured" branch of ClerkGate.
jest.mock('../../config/env', () => ({
  __esModule: true,
  hasClerkKey: () => true,
  CLERK_PUBLISHABLE_KEY: 'pk_test_offline',
}));

jest.mock('../../services/infra/clerk-token-cache', () => ({ tokenCache: {} }));

import { ClerkGate } from '../auth-context';

test('ClerkGate renders the app even while Clerk has not loaded (offline cold start)', () => {
  const { getByText } = render(
    <ClerkGate>
      <Text>app-ready</Text>
    </ClerkGate>,
  );
  expect(getByText('app-ready')).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/contexts/__tests__/auth-context-gate.test.tsx`
Expected: FAIL — `Unable to find an element with text: app-ready` (because the current `ClerkGate` wraps children in `<ClerkLoaded>`, which the mock renders as `null`).

- [ ] **Step 3: Write minimal implementation**

In `src/contexts/auth-context.tsx`, change the import on line 2 to drop `ClerkLoaded`:

```tsx
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
```

Replace the `ClerkGate` function (lines 16-23) with:

```tsx
/** Mounts ClerkProvider only when a publishable key is configured; else passthrough.
 *  Renders children immediately — Clerk hydrates in the background so the app (and
 *  onboarding) is never blocked on a network round-trip (offline = no longer blank). */
export function ClerkGate({ children }: { children: ReactNode }) {
  if (!hasClerkKey()) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/contexts/__tests__/auth-context-gate.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run the existing boot/provider tests to confirm no regression**

Run: `npm test -- src/app/__tests__/root-providers.test.tsx src/app/__tests__/infra-boot.test.tsx`
Expected: PASS (these mount the provider stack and assert children render).

- [ ] **Step 6: Commit**

```bash
git add src/contexts/auth-context.tsx src/contexts/__tests__/auth-context-gate.test.tsx
git commit -m "fix(auth): don't block app render on Clerk load (offline blank-screen blocker)"
```

---

### Task 2: Verify on the Android release build (offline cold launch now renders)

This is a manual verification task — it gates acceptance of the fix and needs no code, but must run on a rebuilt artifact because the bug only reproduces in a real build.

**Files:** none (verification only).

- [ ] **Step 1: Rebuild the release APK/AAB with the fix**

Build per `memory/android-release-build` (local AAB), then convert to a universal APK:

```bash
bundletool build-apks --bundle=pmp-<new>.aab --output=/tmp/pmp.apks --mode=universal \
  --ks ~/.android/debug.keystore --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android
bundletool install-apks --apks=/tmp/pmp.apks --device-id emulator-5554
```

- [ ] **Step 2: Reproduce the original failure condition — offline cold launch**

```bash
adb -s emulator-5554 shell cmd connectivity airplane-mode enable
adb -s emulator-5554 shell pm clear com.h2ai.pmpexampro
adb -s emulator-5554 shell am start -n com.h2ai.pmpexampro/.MainActivity
```

Wait ~5s, then screenshot:

```bash
adb -s emulator-5554 exec-out screencap -p > /tmp/offline-after-fix.png
```

Expected: the **onboarding splash ("GET STARTED") is visible** (NOT a blank screen). Before the fix this stayed blank indefinitely.

- [ ] **Step 3: Confirm online launch and sign-in still work**

```bash
adb -s emulator-5554 shell cmd connectivity airplane-mode disable
maestro --device emulator-5554 test .maestro/release/01-onboarding.yaml
maestro --device emulator-5554 test .maestro/release/02-tabs-profile.yaml
```

Expected: both flows PASS. Then, if the build has a sign-in surface, sign in once with a `+clerk_test` email (code `424242`) and confirm the session activates (existing flow `.maestro/05-clerk-signup.yaml` on a dev build, or manual). Watch for any brief signed-out "Save progress" / "Sign in" flash on first paint — if it appears and is judged distracting, follow up by gating those surfaces on `!useAppAuth().isLoading` (out of scope for this blocker).

- [ ] **Step 4: Record the result**

Update `docs/android-release-test-report-2026-06-24.md`: mark Blocker 1 as fixed with the `/tmp/offline-after-fix.png` evidence, and note the offline-launch re-test passed.

---

## Self-Review

- **Spec coverage:** The blocker is the single requirement; Task 1 removes the `ClerkLoaded` gate (the root cause) and Task 2 proves the offline symptom is gone on a real build. Covered.
- **Placeholder scan:** No TBD/TODO; the only code change and the test are shown in full.
- **Type consistency:** `ClerkGate({ children }: { children: ReactNode })` signature is unchanged; imports referenced (`ClerkProvider`, `CLERK_PUBLISHABLE_KEY`, `hasClerkKey`, `tokenCache`) all already exist in the file.
- **Safety check:** Auth consumers (`subscription-context`, `profile`, `SaveProgressCard`, `Paywall`) already branch on `isSignedIn` / `isLoading`; auth screens "check the resources/functions directly (not the isLoaded flag)" (`src/hooks/use-email-auth.ts`), so rendering before Clerk loads will not crash them.
