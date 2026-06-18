# Phase 1: Persistence Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local-first persistence layer for the PMP merge — typed storage interfaces (key-value, secure key-value, lesson-attempt repository) with SQLite/AsyncStorage/SecureStore implementations, in-memory fakes for testing, and a one-time migration from PMP's legacy AsyncStorage blob.

**Architecture:** Interfaces live in the data layer (`src/services/persistence/`). Domain code (Phase 3) depends only on these interfaces, never on the native SDKs. Every interface ships a thin native implementation **and** an in-memory fake. All heavy logic (aggregation/derivation, legacy transform) is written as pure functions tested in isolation; native adapters are thin glue. Lesson **attempts** are the SQLite source of truth; aggregates (domain progress, active days) are *derived* from attempts via pure functions, not stored redundantly.

**Tech Stack:** Expo 56, TypeScript, `expo-sqlite`, `@react-native-async-storage/async-storage`, `expo-secure-store`, Jest (`jest-expo` preset), `@testing-library/react-native`.

## Global Constraints

- Expo SDK **56** — install native deps with `npx expo install` (never hand-pick versions).
- Reuse PMP app identity at release time: bundleId/package `com.h2ai.pmpexampro` (not relevant to this phase, but the legacy AsyncStorage keys below come from that same app).
- Test style: plain `test('...', () => {})` with `expect`, matching `src/contexts/__tests__/session-reducer.test.ts`. No `describe` required.
- All dates are **local timezone**, `YYYY-MM-DD` (never `toISOString().split('T')`). Reuse the exact `getLocalDateString` logic ported in Task 6.
- Pure functions take `today?: Date` for determinism — never read `Date.now()` inside testable logic.
- Legacy storage keys from PMP (verbatim): progress `@pmp/user-progress`.
- Canonical types `Domain` and `LessonAttempt` are owned by this layer (`src/types/progress.ts`); Phase 3 imports them.

---

### Task 1: Install persistence dependencies & canonical types

**Files:**
- Modify: `package.json` (via `npx expo install`)
- Create: `src/types/progress.ts`
- Test: `src/types/__tests__/progress.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `type Domain = 'people' | 'process' | 'business'`
  - `interface LessonAttempt { id: string; lessonId: string; lessonTitle: string; questionCount: number; score: number; completedAt: string; domain: Domain }`
  - `const DOMAINS: readonly Domain[]`
  - `function isDomain(value: unknown): value is Domain`

- [ ] **Step 1: Install native deps**

Run:
```bash
npx expo install expo-sqlite @react-native-async-storage/async-storage expo-secure-store
```
Expected: `package.json` gains the three deps at SDK-56-compatible versions; install succeeds.

- [ ] **Step 2: Write the failing test**

Create `src/types/__tests__/progress.test.ts`:
```typescript
import { DOMAINS, isDomain } from '../progress';

test('DOMAINS lists the three PMP domains', () => {
  expect(DOMAINS).toEqual(['people', 'process', 'business']);
});

test('isDomain accepts valid domains and rejects others', () => {
  expect(isDomain('people')).toBe(true);
  expect(isDomain('process')).toBe(true);
  expect(isDomain('business')).toBe(true);
  expect(isDomain('marketing')).toBe(false);
  expect(isDomain(null)).toBe(false);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/types/__tests__/progress.test.ts`
Expected: FAIL — cannot find module `../progress`.

- [ ] **Step 4: Write minimal implementation**

Create `src/types/progress.ts`:
```typescript
export type Domain = 'people' | 'process' | 'business';

export const DOMAINS: readonly Domain[] = ['people', 'process', 'business'] as const;

export function isDomain(value: unknown): value is Domain {
  return value === 'people' || value === 'process' || value === 'business';
}

/** A completed lesson attempt — the SQLite source-of-truth row. */
export interface LessonAttempt {
  id: string;
  lessonId: string;
  lessonTitle: string;
  questionCount: number;
  score: number; // 0-100
  completedAt: string; // ISO datetime
  domain: Domain;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/types/__tests__/progress.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/types/progress.ts src/types/__tests__/progress.test.ts
git commit -m "feat(persistence): add storage deps and canonical progress types"
```

---

### Task 2: KeyValueStore interface + in-memory fake

**Files:**
- Create: `src/services/persistence/key-value-store.ts`
- Create: `src/services/persistence/in-memory-key-value-store.ts`
- Test: `src/services/persistence/__tests__/in-memory-key-value-store.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface KeyValueStore { getString(key): Promise<string | null>; setString(key, value): Promise<void>; getJSON<T>(key): Promise<T | null>; setJSON<T>(key, value): Promise<void>; remove(key): Promise<void>; }`
  - `class InMemoryKeyValueStore implements KeyValueStore` (with a `seed(record: Record<string,string>)` test helper)

- [ ] **Step 1: Write the failing test**

Create `src/services/persistence/__tests__/in-memory-key-value-store.test.ts`:
```typescript
import { InMemoryKeyValueStore } from '../in-memory-key-value-store';

test('setString then getString round-trips', async () => {
  const kv = new InMemoryKeyValueStore();
  await kv.setString('@app/theme', 'dark');
  expect(await kv.getString('@app/theme')).toBe('dark');
});

test('getString returns null for missing key', async () => {
  const kv = new InMemoryKeyValueStore();
  expect(await kv.getString('missing')).toBeNull();
});

test('setJSON then getJSON round-trips objects', async () => {
  const kv = new InMemoryKeyValueStore();
  await kv.setJSON('prefs', { dailyGoal: 2 });
  expect(await kv.getJSON<{ dailyGoal: number }>('prefs')).toEqual({ dailyGoal: 2 });
});

test('getJSON returns null for missing key', async () => {
  const kv = new InMemoryKeyValueStore();
  expect(await kv.getJSON('missing')).toBeNull();
});

test('remove deletes a key', async () => {
  const kv = new InMemoryKeyValueStore();
  await kv.setString('k', 'v');
  await kv.remove('k');
  expect(await kv.getString('k')).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/persistence/__tests__/in-memory-key-value-store.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/persistence/key-value-store.ts`:
```typescript
export interface KeyValueStore {
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
  getJSON<T>(key: string): Promise<T | null>;
  setJSON<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}
```

Create `src/services/persistence/in-memory-key-value-store.ts`:
```typescript
import type { KeyValueStore } from './key-value-store';

export class InMemoryKeyValueStore implements KeyValueStore {
  private store = new Map<string, string>();

  /** Test helper: preload raw string values. */
  seed(record: Record<string, string>): void {
    for (const [k, v] of Object.entries(record)) this.store.set(k, v);
  }

  async getString(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  async setString(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.getString(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  async setJSON<T>(key: string, value: T): Promise<void> {
    await this.setString(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/persistence/__tests__/in-memory-key-value-store.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/persistence/key-value-store.ts src/services/persistence/in-memory-key-value-store.ts src/services/persistence/__tests__/in-memory-key-value-store.test.ts
git commit -m "feat(persistence): KeyValueStore interface and in-memory fake"
```

---

### Task 3: AsyncStorage-backed KeyValueStore implementation

**Files:**
- Create: `src/services/persistence/async-key-value-store.ts`
- Test: `src/services/persistence/__tests__/async-key-value-store.test.ts`
- Modify: `jest.config.js` (add AsyncStorage jest mock)

**Interfaces:**
- Consumes: `KeyValueStore` (Task 2).
- Produces: `class AsyncKeyValueStore implements KeyValueStore`.

- [ ] **Step 1: Register the official AsyncStorage mock**

Modify `jest.config.js` — add to `setupFiles` (create the key if absent; it is separate from the existing `setupFilesAfterEnv`):
```javascript
  setupFiles: ['<rootDir>/jest-setup-mocks.js'],
```

Create `jest-setup-mocks.js`:
```javascript
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
```

- [ ] **Step 2: Write the failing test**

Create `src/services/persistence/__tests__/async-key-value-store.test.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncKeyValueStore } from '../async-key-value-store';

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('setString persists through AsyncStorage', async () => {
  const kv = new AsyncKeyValueStore();
  await kv.setString('@app/theme', 'dark');
  expect(await AsyncStorage.getItem('@app/theme')).toBe('dark');
  expect(await kv.getString('@app/theme')).toBe('dark');
});

test('getJSON parses stored JSON, null when absent', async () => {
  const kv = new AsyncKeyValueStore();
  await kv.setJSON('prefs', { dailyGoal: 3 });
  expect(await kv.getJSON('prefs')).toEqual({ dailyGoal: 3 });
  expect(await kv.getJSON('missing')).toBeNull();
});

test('remove deletes the key', async () => {
  const kv = new AsyncKeyValueStore();
  await kv.setString('k', 'v');
  await kv.remove('k');
  expect(await kv.getString('k')).toBeNull();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/services/persistence/__tests__/async-key-value-store.test.ts`
Expected: FAIL — cannot find module `../async-key-value-store`.

- [ ] **Step 4: Write minimal implementation**

Create `src/services/persistence/async-key-value-store.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStore } from './key-value-store';

export class AsyncKeyValueStore implements KeyValueStore {
  async getString(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  async setString(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.getString(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  async setJSON<T>(key: string, value: T): Promise<void> {
    await this.setString(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/services/persistence/__tests__/async-key-value-store.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add jest.config.js jest-setup-mocks.js src/services/persistence/async-key-value-store.ts src/services/persistence/__tests__/async-key-value-store.test.ts
git commit -m "feat(persistence): AsyncStorage-backed KeyValueStore"
```

---

### Task 4: SecureKeyValueStore interface, in-memory fake, and SecureStore impl

**Files:**
- Create: `src/services/persistence/secure-key-value-store.ts`
- Create: `src/services/persistence/in-memory-secure-store.ts`
- Create: `src/services/persistence/secure-store-impl.ts`
- Test: `src/services/persistence/__tests__/secure-store.test.ts`
- Modify: `jest-setup-mocks.js` (mock `expo-secure-store`)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `interface SecureKeyValueStore { getItem(key): Promise<string | null>; setItem(key, value): Promise<void>; removeItem(key): Promise<void>; }`
  - `class InMemorySecureStore implements SecureKeyValueStore`
  - `class ExpoSecureStore implements SecureKeyValueStore`

- [ ] **Step 1: Add expo-secure-store mock**

Append to `jest-setup-mocks.js`:
```javascript
jest.mock('expo-secure-store', () => {
  const mem = new Map();
  return {
    getItemAsync: jest.fn(async (k) => (mem.has(k) ? mem.get(k) : null)),
    setItemAsync: jest.fn(async (k, v) => { mem.set(k, v); }),
    deleteItemAsync: jest.fn(async (k) => { mem.delete(k); }),
  };
});
```

- [ ] **Step 2: Write the failing test**

Create `src/services/persistence/__tests__/secure-store.test.ts`:
```typescript
import { InMemorySecureStore } from '../in-memory-secure-store';
import { ExpoSecureStore } from '../secure-store-impl';

test('in-memory secure store round-trips and removes', async () => {
  const s = new InMemorySecureStore();
  await s.setItem('subscription_isPremium', 'true');
  expect(await s.getItem('subscription_isPremium')).toBe('true');
  await s.removeItem('subscription_isPremium');
  expect(await s.getItem('subscription_isPremium')).toBeNull();
});

test('expo secure store round-trips via the SDK', async () => {
  const s = new ExpoSecureStore();
  await s.setItem('token', 'abc');
  expect(await s.getItem('token')).toBe('abc');
  await s.removeItem('token');
  expect(await s.getItem('token')).toBeNull();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/services/persistence/__tests__/secure-store.test.ts`
Expected: FAIL — cannot find modules.

- [ ] **Step 4: Write minimal implementation**

Create `src/services/persistence/secure-key-value-store.ts`:
```typescript
export interface SecureKeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
```

Create `src/services/persistence/in-memory-secure-store.ts`:
```typescript
import type { SecureKeyValueStore } from './secure-key-value-store';

export class InMemorySecureStore implements SecureKeyValueStore {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}
```

Create `src/services/persistence/secure-store-impl.ts`:
```typescript
import * as SecureStore from 'expo-secure-store';
import type { SecureKeyValueStore } from './secure-key-value-store';

export class ExpoSecureStore implements SecureKeyValueStore {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/services/persistence/__tests__/secure-store.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/services/persistence/secure-key-value-store.ts src/services/persistence/in-memory-secure-store.ts src/services/persistence/secure-store-impl.ts src/services/persistence/__tests__/secure-store.test.ts jest-setup-mocks.js
git commit -m "feat(persistence): SecureKeyValueStore interface, fake, and SecureStore impl"
```

---

### Task 5: Attempt derivations (pure aggregation functions)

**Files:**
- Create: `src/services/persistence/attempt-derivations.ts`
- Test: `src/services/persistence/__tests__/attempt-derivations.test.ts`

**Interfaces:**
- Consumes: `LessonAttempt`, `Domain`, `DOMAINS` (Task 1).
- Produces:
  - `interface DomainCompletion { completed: number; averageScore: number }`
  - `function deriveActiveDays(attempts: LessonAttempt[]): string[]` — sorted unique `YYYY-MM-DD` (local) from each attempt's `completedAt`.
  - `function deriveDomainCompletion(attempts: LessonAttempt[], domain: Domain): DomainCompletion` — count + rounded-to-1-decimal average score.
  - `function deriveOverall(attempts: LessonAttempt[]): { totalLessonsCompleted: number; averageScore: number }`

These pure functions let Phase 3 derive `UserProgress` from the attempts table. Average uses the same rounding as PMP (`Math.round(x * 10) / 10`).

- [ ] **Step 1: Write the failing test**

Create `src/services/persistence/__tests__/attempt-derivations.test.ts`:
```typescript
import type { LessonAttempt } from '../../../types/progress';
import {
  deriveActiveDays,
  deriveDomainCompletion,
  deriveOverall,
} from '../attempt-derivations';

function attempt(partial: Partial<LessonAttempt>): LessonAttempt {
  return {
    id: 'a',
    lessonId: 'A1L1',
    lessonTitle: 'Intro',
    questionCount: 5,
    score: 80,
    completedAt: '2026-06-19T10:00:00.000Z',
    domain: 'process',
    ...partial,
  };
}

test('deriveActiveDays returns sorted unique local dates', () => {
  const days = deriveActiveDays([
    attempt({ completedAt: '2026-06-19T23:30:00.000-04:00' }),
    attempt({ completedAt: '2026-06-19T01:00:00.000-04:00' }),
    attempt({ completedAt: '2026-06-17T08:00:00.000-04:00' }),
  ]);
  expect(days).toEqual(['2026-06-17', '2026-06-19']);
});

test('deriveDomainCompletion counts and averages one domain', () => {
  const result = deriveDomainCompletion(
    [
      attempt({ domain: 'people', score: 90 }),
      attempt({ domain: 'people', score: 75 }),
      attempt({ domain: 'process', score: 10 }),
    ],
    'people',
  );
  expect(result.completed).toBe(2);
  expect(result.averageScore).toBe(82.5);
});

test('deriveDomainCompletion returns zeros for empty domain', () => {
  expect(deriveDomainCompletion([], 'business')).toEqual({ completed: 0, averageScore: 0 });
});

test('deriveOverall totals all attempts and rounds average', () => {
  const result = deriveOverall([
    attempt({ score: 100 }),
    attempt({ score: 95 }),
    attempt({ score: 90 }),
  ]);
  expect(result.totalLessonsCompleted).toBe(3);
  expect(result.averageScore).toBe(95);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/persistence/__tests__/attempt-derivations.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/persistence/attempt-derivations.ts`:
```typescript
import type { Domain, LessonAttempt } from '../../types/progress';
import { getLocalDateString } from '../../utils/date';

export interface DomainCompletion {
  completed: number;
  averageScore: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function deriveActiveDays(attempts: LessonAttempt[]): string[] {
  const days = new Set<string>();
  for (const a of attempts) {
    days.add(getLocalDateString(new Date(a.completedAt)));
  }
  return Array.from(days).sort();
}

export function deriveDomainCompletion(
  attempts: LessonAttempt[],
  domain: Domain,
): DomainCompletion {
  const inDomain = attempts.filter((a) => a.domain === domain);
  if (inDomain.length === 0) return { completed: 0, averageScore: 0 };
  const sum = inDomain.reduce((acc, a) => acc + a.score, 0);
  return { completed: inDomain.length, averageScore: round1(sum / inDomain.length) };
}

export function deriveOverall(attempts: LessonAttempt[]): {
  totalLessonsCompleted: number;
  averageScore: number;
} {
  if (attempts.length === 0) return { totalLessonsCompleted: 0, averageScore: 0 };
  const sum = attempts.reduce((acc, a) => acc + a.score, 0);
  return {
    totalLessonsCompleted: attempts.length,
    averageScore: round1(sum / attempts.length),
  };
}
```

> NOTE: This task depends on `src/utils/date.ts` (`getLocalDateString`). If it does not yet exist, create it now with the exact body below (it is also referenced by Task 6) and include it in this commit:
> ```typescript
> // src/utils/date.ts
> export function getLocalDateString(date: Date = new Date()): string {
>   const y = date.getFullYear();
>   const m = String(date.getMonth() + 1).padStart(2, '0');
>   const d = String(date.getDate()).padStart(2, '0');
>   return `${y}-${m}-${d}`;
> }
> ```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/persistence/__tests__/attempt-derivations.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/persistence/attempt-derivations.ts src/services/persistence/__tests__/attempt-derivations.test.ts src/utils/date.ts
git commit -m "feat(persistence): pure attempt aggregation derivations"
```

---

### Task 6: AttemptRepository interface + in-memory fake

**Files:**
- Create: `src/services/persistence/attempt-repository.ts`
- Create: `src/services/persistence/in-memory-attempt-repository.ts`
- Test: `src/services/persistence/__tests__/in-memory-attempt-repository.test.ts`

**Interfaces:**
- Consumes: `LessonAttempt` (Task 1).
- Produces:
  - `interface AttemptRepository { record(attempt: LessonAttempt): Promise<void>; listAll(): Promise<LessonAttempt[]>; listRecent(limit: number): Promise<LessonAttempt[]>; count(): Promise<number>; clear(): Promise<void>; }`
  - `class InMemoryAttemptRepository implements AttemptRepository` (with `seed(attempts: LessonAttempt[])`)
  - Ordering contract: `listAll`/`listRecent` return **newest-first** by `completedAt`.

- [ ] **Step 1: Write the failing test**

Create `src/services/persistence/__tests__/in-memory-attempt-repository.test.ts`:
```typescript
import type { LessonAttempt } from '../../../types/progress';
import { InMemoryAttemptRepository } from '../in-memory-attempt-repository';

function attempt(id: string, completedAt: string): LessonAttempt {
  return {
    id,
    lessonId: 'A1L1',
    lessonTitle: 'Intro',
    questionCount: 5,
    score: 80,
    completedAt,
    domain: 'process',
  };
}

test('record then listAll returns newest-first', async () => {
  const repo = new InMemoryAttemptRepository();
  await repo.record(attempt('old', '2026-06-17T10:00:00.000Z'));
  await repo.record(attempt('new', '2026-06-19T10:00:00.000Z'));
  const all = await repo.listAll();
  expect(all.map((a) => a.id)).toEqual(['new', 'old']);
});

test('listRecent caps the result', async () => {
  const repo = new InMemoryAttemptRepository();
  for (let i = 0; i < 5; i++) {
    await repo.record(attempt(`a${i}`, `2026-06-1${i}T10:00:00.000Z`));
  }
  expect(await repo.listRecent(2)).toHaveLength(2);
});

test('count and clear', async () => {
  const repo = new InMemoryAttemptRepository();
  await repo.record(attempt('a', '2026-06-19T10:00:00.000Z'));
  expect(await repo.count()).toBe(1);
  await repo.clear();
  expect(await repo.count()).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/persistence/__tests__/in-memory-attempt-repository.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/persistence/attempt-repository.ts`:
```typescript
import type { LessonAttempt } from '../../types/progress';

export interface AttemptRepository {
  record(attempt: LessonAttempt): Promise<void>;
  listAll(): Promise<LessonAttempt[]>;
  listRecent(limit: number): Promise<LessonAttempt[]>;
  count(): Promise<number>;
  clear(): Promise<void>;
}
```

Create `src/services/persistence/in-memory-attempt-repository.ts`:
```typescript
import type { LessonAttempt } from '../../types/progress';
import type { AttemptRepository } from './attempt-repository';

function newestFirst(a: LessonAttempt, b: LessonAttempt): number {
  return b.completedAt.localeCompare(a.completedAt);
}

export class InMemoryAttemptRepository implements AttemptRepository {
  private attempts: LessonAttempt[] = [];

  seed(attempts: LessonAttempt[]): void {
    this.attempts = [...attempts];
  }

  async record(attempt: LessonAttempt): Promise<void> {
    this.attempts.push(attempt);
  }

  async listAll(): Promise<LessonAttempt[]> {
    return [...this.attempts].sort(newestFirst);
  }

  async listRecent(limit: number): Promise<LessonAttempt[]> {
    return (await this.listAll()).slice(0, limit);
  }

  async count(): Promise<number> {
    return this.attempts.length;
  }

  async clear(): Promise<void> {
    this.attempts = [];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/persistence/__tests__/in-memory-attempt-repository.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/persistence/attempt-repository.ts src/services/persistence/in-memory-attempt-repository.ts src/services/persistence/__tests__/in-memory-attempt-repository.test.ts
git commit -m "feat(persistence): AttemptRepository interface and in-memory fake"
```

---

### Task 7: SQLite database wrapper + migration runner

**Files:**
- Create: `src/services/persistence/database.ts`
- Create: `src/services/persistence/migrations.ts`
- Test: `src/services/persistence/__tests__/migrations.test.ts`
- Modify: `jest-setup-mocks.js` (mock `expo-sqlite` with a minimal in-memory executor)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `interface SqlExecutor { execAsync(sql: string): Promise<void>; runAsync(sql: string, params: unknown[]): Promise<void>; getAllAsync<T>(sql: string, params: unknown[]): Promise<T[]>; getFirstAsync<T>(sql: string, params: unknown[]): Promise<T | null>; }`
  - `const MIGRATIONS: { version: number; sql: string }[]` — version 1 creates the `attempts` table.
  - `async function runMigrations(db: SqlExecutor): Promise<void>` — creates `schema_version`, applies pending migrations idempotently.
  - `async function openDatabase(): Promise<SqlExecutor>` — opens `pmp.db` via `expo-sqlite` and runs migrations.

The `attempts` table columns: `id TEXT PRIMARY KEY, lessonId TEXT, lessonTitle TEXT, questionCount INTEGER, score INTEGER, completedAt TEXT, domain TEXT`.

- [ ] **Step 1: Add expo-sqlite mock**

Append to `jest-setup-mocks.js`:
```javascript
jest.mock('expo-sqlite', () => {
  // Minimal in-memory executor: tracks applied DDL + a single attempts table.
  function makeDb() {
    const tables = new Set();
    const rows = [];
    const meta = new Map();
    return {
      execAsync: jest.fn(async (sql) => {
        if (/create table.*schema_version/i.test(sql)) tables.add('schema_version');
        if (/create table.*attempts/i.test(sql)) tables.add('attempts');
      }),
      runAsync: jest.fn(async (sql, params = []) => {
        if (/insert into schema_version/i.test(sql)) meta.set('version', params[0]);
        else if (/insert or replace into attempts/i.test(sql)) {
          const [id, lessonId, lessonTitle, questionCount, score, completedAt, domain] = params;
          const i = rows.findIndex((r) => r.id === id);
          const row = { id, lessonId, lessonTitle, questionCount, score, completedAt, domain };
          if (i >= 0) rows[i] = row; else rows.push(row);
        } else if (/delete from attempts/i.test(sql)) rows.length = 0;
      }),
      getAllAsync: jest.fn(async (sql) => {
        if (/from attempts/i.test(sql)) {
          const sorted = [...rows].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
          const m = sql.match(/limit\s+(\d+)/i);
          return m ? sorted.slice(0, Number(m[1])) : sorted;
        }
        return [];
      }),
      getFirstAsync: jest.fn(async (sql) => {
        if (/count\(\*\).*attempts/i.test(sql)) return { c: rows.length };
        if (/from schema_version/i.test(sql)) {
          return meta.has('version') ? { version: meta.get('version') } : null;
        }
        return null;
      }),
    };
  }
  return { openDatabaseAsync: jest.fn(async () => makeDb()) };
});
```

- [ ] **Step 2: Write the failing test**

Create `src/services/persistence/__tests__/migrations.test.ts`:
```typescript
import { MIGRATIONS, runMigrations, type SqlExecutor } from '../database';

function fakeExecutor(): SqlExecutor & { ddl: string[] } {
  const ddl: string[] = [];
  let version: number | null = null;
  return {
    ddl,
    async execAsync(sql) { ddl.push(sql); },
    async runAsync(sql, params) {
      if (/insert into schema_version/i.test(sql)) version = params[0] as number;
    },
    async getAllAsync() { return []; },
    async getFirstAsync(sql) {
      if (/from schema_version/i.test(sql)) return version === null ? null : ({ version } as any);
      return null;
    },
  };
}

test('MIGRATIONS v1 creates the attempts table', () => {
  expect(MIGRATIONS[0].version).toBe(1);
  expect(MIGRATIONS[0].sql).toMatch(/create table.*attempts/i);
});

test('runMigrations applies pending migrations from a clean db', async () => {
  const db = fakeExecutor();
  await runMigrations(db);
  expect(db.ddl.some((s) => /attempts/i.test(s))).toBe(true);
});

test('runMigrations is idempotent when already at latest version', async () => {
  const db = fakeExecutor();
  await runMigrations(db);
  const ddlCountAfterFirst = db.ddl.length;
  await runMigrations(db);
  expect(db.ddl.length).toBe(ddlCountAfterFirst);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest src/services/persistence/__tests__/migrations.test.ts`
Expected: FAIL — cannot find module `../database`.

- [ ] **Step 4: Write minimal implementation**

Create `src/services/persistence/migrations.ts`:
```typescript
export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY NOT NULL,
      lessonId TEXT NOT NULL,
      lessonTitle TEXT NOT NULL,
      questionCount INTEGER NOT NULL,
      score INTEGER NOT NULL,
      completedAt TEXT NOT NULL,
      domain TEXT NOT NULL
    );`,
  },
];
```

Create `src/services/persistence/database.ts`:
```typescript
import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './migrations';

export interface SqlExecutor {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<void>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
}

export { MIGRATIONS };

const LATEST = MIGRATIONS[MIGRATIONS.length - 1].version;

export async function runMigrations(db: SqlExecutor): Promise<void> {
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL);',
  );
  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1;',
  );
  const current = row?.version ?? 0;
  if (current >= LATEST) return;
  for (const migration of MIGRATIONS) {
    if (migration.version > current) {
      await db.execAsync(migration.sql);
    }
  }
  await db.runAsync('INSERT INTO schema_version (version) VALUES (?);', [LATEST]);
}

export async function openDatabase(): Promise<SqlExecutor> {
  const db = await SQLite.openDatabaseAsync('pmp.db');
  await runMigrations(db as unknown as SqlExecutor);
  return db as unknown as SqlExecutor;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/services/persistence/__tests__/migrations.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/services/persistence/database.ts src/services/persistence/migrations.ts src/services/persistence/__tests__/migrations.test.ts jest-setup-mocks.js
git commit -m "feat(persistence): SQLite executor wrapper and migration runner"
```

---

### Task 8: SQLite AttemptRepository implementation

**Files:**
- Create: `src/services/persistence/sqlite-attempt-repository.ts`
- Test: `src/services/persistence/__tests__/sqlite-attempt-repository.test.ts`

**Interfaces:**
- Consumes: `AttemptRepository` (Task 6), `SqlExecutor` (Task 7), `LessonAttempt` (Task 1).
- Produces: `class SqliteAttemptRepository implements AttemptRepository` (constructor takes a `SqlExecutor`).

- [ ] **Step 1: Write the failing test**

Create `src/services/persistence/__tests__/sqlite-attempt-repository.test.ts`:
```typescript
import type { LessonAttempt } from '../../../types/progress';
import { openDatabase } from '../database';
import { SqliteAttemptRepository } from '../sqlite-attempt-repository';

function attempt(id: string, completedAt: string): LessonAttempt {
  return {
    id, lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5,
    score: 80, completedAt, domain: 'process',
  };
}

test('record + listAll round-trips through the (mocked) sqlite executor newest-first', async () => {
  const db = await openDatabase();
  const repo = new SqliteAttemptRepository(db);
  await repo.record(attempt('old', '2026-06-17T10:00:00.000Z'));
  await repo.record(attempt('new', '2026-06-19T10:00:00.000Z'));
  expect((await repo.listAll()).map((a) => a.id)).toEqual(['new', 'old']);
});

test('listRecent caps and count/clear work', async () => {
  const db = await openDatabase();
  const repo = new SqliteAttemptRepository(db);
  await repo.record(attempt('a', '2026-06-18T10:00:00.000Z'));
  await repo.record(attempt('b', '2026-06-19T10:00:00.000Z'));
  expect(await repo.listRecent(1)).toHaveLength(1);
  expect(await repo.count()).toBe(2);
  await repo.clear();
  expect(await repo.count()).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/persistence/__tests__/sqlite-attempt-repository.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/persistence/sqlite-attempt-repository.ts`:
```typescript
import type { LessonAttempt } from '../../types/progress';
import type { AttemptRepository } from './attempt-repository';
import type { SqlExecutor } from './database';

const COLUMNS = 'id, lessonId, lessonTitle, questionCount, score, completedAt, domain';

export class SqliteAttemptRepository implements AttemptRepository {
  constructor(private readonly db: SqlExecutor) {}

  async record(a: LessonAttempt): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO attempts (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [a.id, a.lessonId, a.lessonTitle, a.questionCount, a.score, a.completedAt, a.domain],
    );
  }

  async listAll(): Promise<LessonAttempt[]> {
    return this.db.getAllAsync<LessonAttempt>(
      `SELECT ${COLUMNS} FROM attempts ORDER BY completedAt DESC;`,
    );
  }

  async listRecent(limit: number): Promise<LessonAttempt[]> {
    return this.db.getAllAsync<LessonAttempt>(
      `SELECT ${COLUMNS} FROM attempts ORDER BY completedAt DESC LIMIT ?;`,
      [limit],
    );
  }

  async count(): Promise<number> {
    const row = await this.db.getFirstAsync<{ c: number }>(
      'SELECT COUNT(*) as c FROM attempts;',
    );
    return row?.c ?? 0;
  }

  async clear(): Promise<void> {
    await this.db.runAsync('DELETE FROM attempts;', []);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/persistence/__tests__/sqlite-attempt-repository.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/persistence/sqlite-attempt-repository.ts src/services/persistence/__tests__/sqlite-attempt-repository.test.ts
git commit -m "feat(persistence): SQLite AttemptRepository implementation"
```

---

### Task 9: Legacy migration (PMP `@pmp/user-progress` → new stores)

**Files:**
- Create: `src/services/persistence/legacy-migration.ts`
- Test: `src/services/persistence/__tests__/legacy-migration.test.ts`

**Interfaces:**
- Consumes: `LessonAttempt` (Task 1), `KeyValueStore` (Task 2), `AttemptRepository` (Task 6).
- Produces:
  - `interface LegacyProgressBlob { recentAttempts?: LessonAttempt[]; streakFreeze?: unknown; activeDays?: string[]; bestStreak?: number }`
  - `function transformLegacyProgress(blob: LegacyProgressBlob): { attempts: LessonAttempt[]; carryOver: { streakFreeze: unknown; bestStreak: number } }`
  - `async function runLegacyMigration(deps: { kv: KeyValueStore; attempts: AttemptRepository }): Promise<boolean>` — returns `true` if a migration ran, `false` if skipped (no legacy data or already migrated). Keys: reads `@pmp/user-progress`, writes carry-over to `@pmp/v2/carry-over`, sets `@pmp/v2/migrated` = `'true'`.

The legacy blob keeps only the last 200 attempts, so the attempts table is seeded from `recentAttempts`; `bestStreak` and `streakFreeze` are carried over verbatim for Phase 3 to reconcile. Migration is guarded so it never runs twice.

- [ ] **Step 1: Write the failing test**

Create `src/services/persistence/__tests__/legacy-migration.test.ts`:
```typescript
import type { LessonAttempt } from '../../../types/progress';
import { InMemoryKeyValueStore } from '../in-memory-key-value-store';
import { InMemoryAttemptRepository } from '../in-memory-attempt-repository';
import { transformLegacyProgress, runLegacyMigration } from '../legacy-migration';

const attempt: LessonAttempt = {
  id: 'x', lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5,
  score: 80, completedAt: '2026-06-19T10:00:00.000Z', domain: 'process',
};

test('transformLegacyProgress extracts attempts and carry-over', () => {
  const result = transformLegacyProgress({
    recentAttempts: [attempt],
    streakFreeze: { available: 1, weekStart: '2026-06-15', usedDates: [] },
    bestStreak: 7,
  });
  expect(result.attempts).toEqual([attempt]);
  expect(result.carryOver.bestStreak).toBe(7);
  expect(result.carryOver.streakFreeze).toEqual({ available: 1, weekStart: '2026-06-15', usedDates: [] });
});

test('transformLegacyProgress tolerates missing fields', () => {
  const result = transformLegacyProgress({});
  expect(result.attempts).toEqual([]);
  expect(result.carryOver.bestStreak).toBe(0);
});

test('runLegacyMigration seeds attempts and marks done', async () => {
  const kv = new InMemoryKeyValueStore();
  const attempts = new InMemoryAttemptRepository();
  await kv.setJSON('@pmp/user-progress', { recentAttempts: [attempt], bestStreak: 3 });

  const ran = await runLegacyMigration({ kv, attempts });

  expect(ran).toBe(true);
  expect(await attempts.count()).toBe(1);
  expect(await kv.getString('@pmp/v2/migrated')).toBe('true');
});

test('runLegacyMigration skips when no legacy data', async () => {
  const kv = new InMemoryKeyValueStore();
  const attempts = new InMemoryAttemptRepository();
  expect(await runLegacyMigration({ kv, attempts })).toBe(false);
});

test('runLegacyMigration skips when already migrated', async () => {
  const kv = new InMemoryKeyValueStore();
  const attempts = new InMemoryAttemptRepository();
  await kv.setJSON('@pmp/user-progress', { recentAttempts: [attempt] });
  await kv.setString('@pmp/v2/migrated', 'true');
  expect(await runLegacyMigration({ kv, attempts })).toBe(false);
  expect(await attempts.count()).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/persistence/__tests__/legacy-migration.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/persistence/legacy-migration.ts`:
```typescript
import type { LessonAttempt } from '../../types/progress';
import type { KeyValueStore } from './key-value-store';
import type { AttemptRepository } from './attempt-repository';

const LEGACY_PROGRESS_KEY = '@pmp/user-progress';
const CARRY_OVER_KEY = '@pmp/v2/carry-over';
const MIGRATED_KEY = '@pmp/v2/migrated';

export interface LegacyProgressBlob {
  recentAttempts?: LessonAttempt[];
  streakFreeze?: unknown;
  activeDays?: string[];
  bestStreak?: number;
}

export function transformLegacyProgress(blob: LegacyProgressBlob): {
  attempts: LessonAttempt[];
  carryOver: { streakFreeze: unknown; bestStreak: number };
} {
  return {
    attempts: blob.recentAttempts ?? [],
    carryOver: {
      streakFreeze: blob.streakFreeze ?? null,
      bestStreak: blob.bestStreak ?? 0,
    },
  };
}

export async function runLegacyMigration(deps: {
  kv: KeyValueStore;
  attempts: AttemptRepository;
}): Promise<boolean> {
  const { kv, attempts } = deps;
  if ((await kv.getString(MIGRATED_KEY)) === 'true') return false;
  const blob = await kv.getJSON<LegacyProgressBlob>(LEGACY_PROGRESS_KEY);
  if (blob === null) return false;

  const { attempts: legacyAttempts, carryOver } = transformLegacyProgress(blob);
  for (const a of legacyAttempts) {
    await attempts.record(a);
  }
  await kv.setJSON(CARRY_OVER_KEY, carryOver);
  await kv.setString(MIGRATED_KEY, 'true');
  return true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/persistence/__tests__/legacy-migration.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/persistence/legacy-migration.ts src/services/persistence/__tests__/legacy-migration.test.ts
git commit -m "feat(persistence): one-time legacy progress migration"
```

---

### Task 10: Persistence factory (real + test wiring) and barrel export

**Files:**
- Create: `src/services/persistence/index.ts`
- Test: `src/services/persistence/__tests__/index.test.ts`

**Interfaces:**
- Consumes: all prior tasks.
- Produces:
  - `interface Persistence { kv: KeyValueStore; secure: SecureKeyValueStore; attempts: AttemptRepository; }`
  - `async function createPersistence(): Promise<Persistence>` — wires AsyncStorage + SecureStore + SQLite, opens DB, runs migrations, runs legacy migration.
  - `function createInMemoryPersistence(): Persistence` — fakes for tests/Phase 3.
  - Re-exports all interfaces, fakes, and `transformLegacyProgress`/`runLegacyMigration`.

- [ ] **Step 1: Write the failing test**

Create `src/services/persistence/__tests__/index.test.ts`:
```typescript
import {
  createInMemoryPersistence,
  createPersistence,
  InMemoryKeyValueStore,
  InMemoryAttemptRepository,
} from '../index';

test('createInMemoryPersistence wires fakes that satisfy the interfaces', async () => {
  const p = createInMemoryPersistence();
  expect(p.kv).toBeInstanceOf(InMemoryKeyValueStore);
  expect(p.attempts).toBeInstanceOf(InMemoryAttemptRepository);
  await p.kv.setString('k', 'v');
  expect(await p.kv.getString('k')).toBe('v');
});

test('createPersistence boots against mocked native modules', async () => {
  const p = await createPersistence();
  await p.attempts.record({
    id: 'a', lessonId: 'A1L1', lessonTitle: 'Intro', questionCount: 5,
    score: 80, completedAt: '2026-06-19T10:00:00.000Z', domain: 'process',
  });
  expect(await p.attempts.count()).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/services/persistence/__tests__/index.test.ts`
Expected: FAIL — cannot find module `../index`.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/persistence/index.ts`:
```typescript
import type { KeyValueStore } from './key-value-store';
import type { SecureKeyValueStore } from './secure-key-value-store';
import type { AttemptRepository } from './attempt-repository';
import { AsyncKeyValueStore } from './async-key-value-store';
import { InMemoryKeyValueStore } from './in-memory-key-value-store';
import { ExpoSecureStore } from './secure-store-impl';
import { InMemorySecureStore } from './in-memory-secure-store';
import { SqliteAttemptRepository } from './sqlite-attempt-repository';
import { InMemoryAttemptRepository } from './in-memory-attempt-repository';
import { openDatabase } from './database';
import { runLegacyMigration } from './legacy-migration';

export interface Persistence {
  kv: KeyValueStore;
  secure: SecureKeyValueStore;
  attempts: AttemptRepository;
}

export async function createPersistence(): Promise<Persistence> {
  const kv = new AsyncKeyValueStore();
  const secure = new ExpoSecureStore();
  const db = await openDatabase();
  const attempts = new SqliteAttemptRepository(db);
  await runLegacyMigration({ kv, attempts });
  return { kv, secure, attempts };
}

export function createInMemoryPersistence(): Persistence {
  return {
    kv: new InMemoryKeyValueStore(),
    secure: new InMemorySecureStore(),
    attempts: new InMemoryAttemptRepository(),
  };
}

export type { KeyValueStore } from './key-value-store';
export type { SecureKeyValueStore } from './secure-key-value-store';
export type { AttemptRepository } from './attempt-repository';
export { InMemoryKeyValueStore } from './in-memory-key-value-store';
export { InMemorySecureStore } from './in-memory-secure-store';
export { InMemoryAttemptRepository } from './in-memory-attempt-repository';
export { transformLegacyProgress, runLegacyMigration } from './legacy-migration';
export {
  deriveActiveDays,
  deriveDomainCompletion,
  deriveOverall,
} from './attempt-derivations';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/services/persistence/__tests__/index.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite (regression gate)**

Run: `npm test`
Expected: PASS — all new persistence tests plus the pre-existing shell tests are green.

- [ ] **Step 6: Commit**

```bash
git add src/services/persistence/index.ts src/services/persistence/__tests__/index.test.ts
git commit -m "feat(persistence): persistence factory and barrel export"
```

---

## Self-Review

**Spec coverage (Phase 1 scope = "Persistence layer — interfaces + SQLite impl + in-memory fakes + tests" + the spec's persistence-layer section):**
- KeyValueStore (AsyncStorage) → Tasks 2–3 ✓
- SecureKeyValueStore (SecureStore) → Task 4 ✓
- AttemptRepository / ProgressRepository (SQLite) → Tasks 5–8 (aggregation derivations split out as pure functions; "ProgressRepository" is realized as derivations over attempts, per the "attempts are source of truth, aggregates derived" architecture decision) ✓
- SQLite Database wrapper + migration runner → Task 7 ✓
- In-memory fakes for every interface → Tasks 2, 4, 6 ✓
- One-time legacy `@pmp/user-progress` migration → Task 9 ✓
- Factory wiring real impls + test fakes → Task 10 ✓

**Deferred to later phases (intentionally, not gaps):** `streakFreeze`/`bestStreak` reconciliation into `UserProgress` (Phase 3 domain layer — carry-over is preserved here); settings/onboarding KV *keys* (Phase 3 owns those domain keys, using the generic `KeyValueStore` built here).

**Placeholder scan:** none — every code step shows complete code; every run step shows the command + expected result.

**Type consistency:** `LessonAttempt`/`Domain` defined once (Task 1) and imported everywhere. `SqlExecutor` defined in Task 7, consumed in Tasks 8/10. `AttemptRepository` method names (`record`/`listAll`/`listRecent`/`count`/`clear`) identical across fake (Task 6), SQLite impl (Task 8), and factory (Task 10). `KeyValueStore` methods (`getString`/`setString`/`getJSON`/`setJSON`/`remove`) consistent across Tasks 2/3/9. `getLocalDateString` body identical to the version Phase 3 will reuse from `src/utils/date.ts`.

**Note on SQLite testing:** native `expo-sqlite` can't run in `jest-expo`, so Tasks 7–8/10 test the adapter against a faithful in-memory mock of the `expo-sqlite` async surface (`jest-setup-mocks.js`). Real on-device SQLite is exercised when the app boots in Phase 4. This is called out so the reviewer doesn't mistake the mock for full integration coverage.

## Phase 1 outcome & deferred follow-ups

Phase 1 shipped: 10 tasks, full suite 26 suites / 87 tests green. Final whole-branch
review (opus) drove a correctness fix-wave — `completedAt` is now normalized to UTC on
`record()` in both repository impls, the in-memory fake dedups by `id` (matching SQLite's
`INSERT OR REPLACE`), the legacy migration preserves `activeDays` into the carry-over, and
`getJSON` guards `JSON.parse` (a corrupt blob no longer bricks `createPersistence()` at boot).

Carry these into later phases:
- **(Phase 4) SQL semantics smoke test:** the jest mock proves API shape, not SQLite type
  coercion. At app boot, assert a recorded `score: 80` reads back as `=== 80` (number, not
  `"80"`) — the derivations do arithmetic on `score`/`questionCount`.
- **(Phase 3) Storage-key constants:** add `src/services/persistence/keys.ts` when settings/
  onboarding KV keys land, so key names are compile-time visible (avoid collisions/typos).
- **(Phase 3) Factory failure policy:** decide whether a failed `openDatabase()`/legacy
  migration should be allowed to take down `kv`/`secure` too (currently it does — one
  un-isolated `await` chain in `createPersistence()`).
- **(watch) Invalid-timestamp throw:** `new Date(invalid).toISOString()` in `record()` throws
  `RangeError`; no real input path today, revisit only if untrusted timestamps ever flow in.
