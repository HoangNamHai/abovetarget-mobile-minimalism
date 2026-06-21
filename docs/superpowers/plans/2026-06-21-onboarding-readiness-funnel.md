# Onboarding Readiness Funnel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4-screen onboarding with a 16-step "readiness funnel" — value screens, questions interleaved with PMI facts, a domain picker showing real lesson cards, and a personalized plan reveal that routes into the paywall.

**Architecture:** Pure logic (fact library, `buildPlan`, step ordering) lives in plain TS modules with full unit tests. Screens are thin file-based Expo Router routes under `src/app/(onboarding)/` built from a small set of reusable components (`ValueScreen`, `FactScreen`, `ChoiceScreen`, `ConfidenceRating`, `DomainPicker`, `RevealScreen`). All collected answers persist through the existing `OnboardingProvider` + `kv` store. The reveal's CTA opens the existing paywall when `REVENUECAT_ENABLED`, else completes onboarding and lands the user in the app.

**Tech Stack:** Expo Router (file-based routing), React Native, TypeScript, Jest + @testing-library/react-native, NativeWind/`TOKENS` theming.

## Global Constraints

- Read the versioned Expo docs (https://docs.expo.dev/versions/v56.0.0/) before writing native/router code — Expo SDK 56.
- **No new dependencies.** No datepicker/slider libs — exam date uses preset chips, confidence uses a 1–5 tap scale.
- Reuse existing primitives: `Button`, `Txt`, `Hairline`, `PressableFeedback` from `src/components/primitives/`, and `TOKENS`/`RADIUS` from `src/theme/tokens.ts`, `ACCENTS` from `src/theme/accents.ts`.
- Screen padding rhythm matches existing onboarding: `paddingHorizontal: 24, paddingVertical: 48` inside a `SafeAreaView` from `react-native-safe-area-context`.
- Tests run with `npm test` (`TZ=UTC jest`). Test harness wraps components in `PersistenceProvider value={createInMemoryPersistence()}` + `OnboardingProvider`, and mocks `expo-linking` and `expo-router` (see existing `src/app/(onboarding)/__tests__/onboarding-flow.test.tsx`).
- Domain keys are lowercase `'people' | 'process' | 'business'` (`src/types/progress.ts`). Lesson JSON uses Title-case domains; map via `DOMAIN_OF` / `DOMAIN_TITLE` from `src/data/domains.ts`.
- Brand wordmark text is **"PMP Exam Pro"** (already set in `splash.tsx`).
- Exam-detail facts (minutes, PMBOK edition) live ONLY in `onboarding-facts.ts` — single source of truth (PMI updates the exam 2026-07-09).
- Commit after every task. Conventional commits (`feat(onboarding): …`).

---

## File Structure

**New — logic/data:**
- `src/data/onboarding-facts.ts` — `Fact` type + `FACTS` library + `getFact(id)`.
- `src/lib/onboarding/onboarding-plan.ts` — `PlanInputs`, `Plan`, pure `buildPlan()`.
- `src/lib/onboarding/onboarding-steps.ts` — `ONBOARDING_ORDER`, `progressFor(slug)`.

**New — components (`src/components/onboarding/`):**
- `OnboardingProgress.tsx` — thin progress bar.
- `ValueScreen.tsx` — eyebrow/title/body/optional image + CTA.
- `FactScreen.tsx` — renders a `Fact` + CTA.
- `ChoiceScreen.tsx` — header + single/multi-select option list + CTA.
- `ConfidenceRating.tsx` — three domain rows, 1–5 tap scale.
- `OnboardingLessonCard.tsx` — compact lesson card (title, thumbnail, duration).
- `DomainPicker.tsx` — three domains, each previewing 3 lesson cards, selectable.
- `RevealScreen.tsx` — "preparing" transition + personalized plan + CTA.

**New — routes (`src/app/(onboarding)/`):**
- `story-concept.tsx`, `story-cast.tsx`, `exam-date.tsx`, `fact-exam.tsx`, `why-certified.tsx`, `fact-social.tsx`, `experience.tsx`, `fact-content.tsx`, `confidence.tsx`, `fact-study.tsx`, `belief.tsx`, `reminder.tsx`, `commit.tsx`, `domain.tsx`, `reveal.tsx`.

**Modified:**
- `src/contexts/onboarding-context.tsx` — extend `UserPreferences` + setters.
- `src/app/(onboarding)/splash.tsx` — combine "Learn by doing"; route to `story-concept`.

**Removed (replaced):**
- `src/app/(onboarding)/welcome.tsx`, `goal-selection.tsx`, `question-reminder.tsx` (and their refs in the flow test).

---

## Task 1: Extend the onboarding data model

**Files:**
- Modify: `src/contexts/onboarding-context.tsx`
- Test: `src/contexts/__tests__/onboarding-context.test.tsx`

**Interfaces:**
- Produces:
  - `UserPreferences` extended with: `examDate?: number | null`, `reasons: string[]`, `experience: 'new' | 'informal' | 'experienced'`, `confidence: { people: number; process: number; business: number }`, `reminder: 'morning' | 'lunch' | 'evening' | 'none'`.
  - Context setters: `setExamDate(ts: number | null): void`, `toggleReason(id: string): void`, `setExperience(v: 'new'|'informal'|'experienced'): void`, `setConfidence(domain: 'people'|'process'|'business', value: number): void`, `setReminder(v: 'morning'|'lunch'|'evening'|'none'): void`. Existing `setDailyGoal`, `setFocusDomain`, `toggleGoal`, `completeOnboarding`, `resetOnboarding` remain.
  - Context state fields mirror the setters: `examDate`, `reasons`, `experience`, `confidence`, `reminder` (plus existing).

- [ ] **Step 1: Write the failing test** — append to `src/contexts/__tests__/onboarding-context.test.tsx`:

```tsx
test('persists the full readiness-funnel answer set', async () => {
  const persistence = createInMemoryPersistence();
  const { result } = await renderHook(() => useOnboarding(), { wrapper: wrapper(persistence) });
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  await act(async () => {
    result.current.setExamDate(123456);
    result.current.toggleReason('promotion');
    result.current.setExperience('informal');
    result.current.setConfidence('process', 2);
    result.current.setReminder('lunch');
    result.current.setFocusDomain('process');
    result.current.setDailyGoal(2);
  });
  await act(async () => {
    await result.current.completeOnboarding();
  });

  const prefs = await persistence.kv.getJSON<any>('userPreferences');
  expect(prefs.examDate).toBe(123456);
  expect(prefs.reasons).toEqual(['promotion']);
  expect(prefs.experience).toBe('informal');
  expect(prefs.confidence.process).toBe(2);
  expect(prefs.reminder).toBe('lunch');
  expect(prefs.focusDomain).toBe('process');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- onboarding-context`
Expected: FAIL (`setExamDate is not a function`).

- [ ] **Step 3: Implement the model changes** in `src/contexts/onboarding-context.tsx`.

Extend the interface and defaults:

```tsx
export interface UserPreferences {
  goals: string[];
  dailyGoal: number;
  focusDomain?: string;
  examDate?: number | null;
  reasons: string[];
  experience: 'new' | 'informal' | 'experienced';
  confidence: { people: number; process: number; business: number };
  reminder: 'morning' | 'lunch' | 'evening' | 'none';
  onboardingCompletedAt: number;
}

export type Experience = 'new' | 'informal' | 'experienced';
export type ConfidenceDomain = 'people' | 'process' | 'business';
export type Reminder = 'morning' | 'lunch' | 'evening' | 'none';

const DEFAULT_CONFIDENCE = { people: 3, process: 3, business: 3 };
```

Add to `OnboardingContextType` the new state fields and setter signatures listed in **Interfaces**. Add `useState` hooks:

```tsx
const [examDate, setExamDateState] = useState<number | null>(null);
const [reasons, setReasons] = useState<string[]>([]);
const [experience, setExperienceState] = useState<Experience>('new');
const [confidence, setConfidenceState] = useState({ ...DEFAULT_CONFIDENCE });
const [reminder, setReminderState] = useState<Reminder>('morning');
```

Add callbacks:

```tsx
const setExamDate = useCallback((ts: number | null) => setExamDateState(ts), []);
const toggleReason = useCallback((id: string) => {
  setReasons((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
}, []);
const setExperience = useCallback((v: Experience) => setExperienceState(v), []);
const setConfidence = useCallback((domain: ConfidenceDomain, value: number) => {
  setConfidenceState((prev) => ({ ...prev, [domain]: value }));
}, []);
const setReminder = useCallback((v: Reminder) => setReminderState(v), []);
```

In `completeOnboarding`, extend the persisted `preferences` object:

```tsx
const preferences: UserPreferences = {
  goals: selectedGoals.length > 0 ? selectedGoals : ['pass-pmp'],
  dailyGoal,
  focusDomain: focusDomain || undefined,
  examDate,
  reasons,
  experience,
  confidence,
  reminder,
  onboardingCompletedAt: Date.now(),
};
```

In the load effect's `if (preferences)` block, hydrate the new fields (guarding for older shapes):

```tsx
setExamDateState(preferences.examDate ?? null);
setReasons(preferences.reasons || []);
setExperienceState(preferences.experience || 'new');
setConfidenceState(preferences.confidence || { ...DEFAULT_CONFIDENCE });
setReminderState(preferences.reminder || 'morning');
```

In `resetOnboarding`, reset the new state to defaults (`null`, `[]`, `'new'`, `{...DEFAULT_CONFIDENCE}`, `'morning'`). Add all new state + setters to the `value` `useMemo` object and its dependency array.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- onboarding-context`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/onboarding-context.tsx src/contexts/__tests__/onboarding-context.test.tsx
git commit -m "feat(onboarding): extend preferences with funnel answer set"
```

---

## Task 2: Fact library

**Files:**
- Create: `src/data/onboarding-facts.ts`
- Test: `src/data/__tests__/onboarding-facts.test.ts`

**Interfaces:**
- Produces:
  - `export interface Fact { id: string; text: string; source?: string }`
  - `export const FACTS: Record<'exam'|'social'|'content'|'study', Fact>`
  - `export function getFact(id: keyof typeof FACTS): Fact`

- [ ] **Step 1: Write the failing test** — `src/data/__tests__/onboarding-facts.test.ts`:

```ts
import { FACTS, getFact } from '../onboarding-facts';

test('every fact has non-empty text', () => {
  for (const key of Object.keys(FACTS) as (keyof typeof FACTS)[]) {
    expect(getFact(key).text.length).toBeGreaterThan(0);
  }
});

test('exam fact mentions question count', () => {
  expect(FACTS.exam.text).toMatch(/180/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- onboarding-facts`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement** `src/data/onboarding-facts.ts`:

```ts
export interface Fact {
  id: string;
  text: string;
  source?: string;
}

// Single source of truth for exam-detail copy. PMI updates the exam 2026-07-09
// (time rises toward ~240 min, PMBOK 8th ed.) — revisit `exam` and `content`.
export const FACTS = {
  exam: {
    id: 'exam',
    text: 'The PMP exam is 180 questions. You’ll have 230 minutes — and two optional breaks.',
  },
  social: {
    id: 'social',
    text: 'Over 1 million professionals hold the PMP. They report ~24% higher median salary.',
  },
  content: {
    id: 'content',
    text: 'Roughly half the exam is predictive — the other half agile or hybrid.',
  },
  study: {
    id: 'study',
    text: 'Most candidates study 60–200 hours. A daily habit beats weekend cramming.',
  },
} satisfies Record<string, Fact>;

export function getFact(id: keyof typeof FACTS): Fact {
  return FACTS[id];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- onboarding-facts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/onboarding-facts.ts src/data/__tests__/onboarding-facts.test.ts
git commit -m "feat(onboarding): add PMI fact library"
```

---

## Task 3: `buildPlan` pure function

**Files:**
- Create: `src/lib/onboarding/onboarding-plan.ts`
- Test: `src/lib/onboarding/__tests__/onboarding-plan.test.ts`

**Interfaces:**
- Consumes: `Domain` from `src/types/progress.ts`.
- Produces:

```ts
export interface PlanInputs {
  examDate: number | null;          // epoch ms, or null if not booked
  experience: 'new' | 'informal' | 'experienced';
  confidence: { people: number; process: number; business: number };
  chosenDomain: Domain;             // user's explicit pick (step 15)
  totalLessons: number;             // getAllLessons().length at call site
  now: number;                      // Date.now() injected for testability
}
export interface Plan {
  recommendedDomain: Domain;        // argmin(confidence)
  focusDomain: Domain;              // = chosenDomain
  intensity: 'foundational' | 'steady' | 'accelerated';
  dailyGoal: number;                // 1..5
  readyByDate: number | null;       // epoch ms, capped at examDate
  rationale: string;
}
export function buildPlan(inputs: PlanInputs): Plan;
```

- [ ] **Step 1: Write the failing test** — `src/lib/onboarding/__tests__/onboarding-plan.test.ts`:

```ts
import { buildPlan } from '../onboarding-plan';

const DAY = 24 * 60 * 60 * 1000;
const base = {
  experience: 'new' as const,
  confidence: { people: 4, process: 2, business: 5 },
  chosenDomain: 'people' as const,
  totalLessons: 50,
  now: 0,
};

test('recommendedDomain is the lowest-confidence domain', () => {
  expect(buildPlan({ ...base, examDate: null }).recommendedDomain).toBe('process');
});

test('focusDomain follows the explicit choice, not the recommendation', () => {
  expect(buildPlan({ ...base, examDate: null }).focusDomain).toBe('people');
});

test('no exam date defaults to a steady 2/day plan', () => {
  const plan = buildPlan({ ...base, examDate: null });
  expect(plan.dailyGoal).toBe(2);
  expect(plan.readyByDate).toBe(25 * DAY); // 50 lessons / 2 per day
});

test('a near exam date forces an accelerated pace, capped at the exam date', () => {
  const plan = buildPlan({ ...base, examDate: 20 * DAY }); // 50 lessons in 20 days -> 3/day
  expect(plan.dailyGoal).toBeGreaterThanOrEqual(3);
  expect(plan.intensity).toBe('accelerated');
  expect(plan.readyByDate).toBeLessThanOrEqual(20 * DAY);
});

test('pace is clamped to a 1..5 range', () => {
  const tight = buildPlan({ ...base, examDate: 2 * DAY }); // would need 25/day
  expect(tight.dailyGoal).toBe(5);
  const loose = buildPlan({ ...base, examDate: 500 * DAY });
  expect(loose.dailyGoal).toBeGreaterThanOrEqual(1);
});

test('rationale notes low confidence when the choice matches the recommendation', () => {
  const plan = buildPlan({ ...base, chosenDomain: 'process', examDate: null });
  expect(plan.rationale).toMatch(/confiden/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- onboarding-plan`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement** `src/lib/onboarding/onboarding-plan.ts`:

```ts
import type { Domain } from '../../types/progress';

export interface PlanInputs {
  examDate: number | null;
  experience: 'new' | 'informal' | 'experienced';
  confidence: { people: number; process: number; business: number };
  chosenDomain: Domain;
  totalLessons: number;
  now: number;
}

export interface Plan {
  recommendedDomain: Domain;
  focusDomain: Domain;
  intensity: 'foundational' | 'steady' | 'accelerated';
  dailyGoal: number;
  readyByDate: number | null;
  rationale: string;
}

const DAY = 24 * 60 * 60 * 1000;
const DOMAIN_LABEL: Record<Domain, string> = {
  people: 'People',
  process: 'Process',
  business: 'Business Environment',
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// Lowest confidence wins; tie-break in fixed people<process<business order.
function lowestConfidence(c: PlanInputs['confidence']): Domain {
  const order: Domain[] = ['people', 'process', 'business'];
  return order.reduce((best, d) => (c[d] < c[best] ? d : best), 'people' as Domain);
}

export function buildPlan(inputs: PlanInputs): Plan {
  const { examDate, experience, confidence, chosenDomain, totalLessons, now } = inputs;
  const recommendedDomain = lowestConfidence(confidence);

  let dailyGoal = 2;
  if (examDate != null && examDate > now) {
    const daysUntil = Math.max(1, Math.floor((examDate - now) / DAY));
    dailyGoal = clamp(Math.ceil(totalLessons / daysUntil), 1, 5);
  }

  const daysToFinish = Math.ceil(totalLessons / dailyGoal);
  let readyByDate: number | null = now + daysToFinish * DAY;
  if (examDate != null && readyByDate > examDate) readyByDate = examDate;

  let intensity: Plan['intensity'];
  if (dailyGoal >= 4) intensity = 'accelerated';
  else if (dailyGoal <= 1 && experience === 'new') intensity = 'foundational';
  else intensity = 'steady';

  const focusLabel = DOMAIN_LABEL[chosenDomain];
  const matchesRecommendation = chosenDomain === recommendedDomain;
  const timing =
    examDate != null
      ? `Your exam is coming up, so we’re building a ${dailyGoal}-a-day plan`
      : `We’re building a steady ${dailyGoal}-a-day plan`;
  const why = matchesRecommendation
    ? `starting in ${focusLabel} — the area you felt least confident in.`
    : `starting where you chose: ${focusLabel}.`;
  const rationale = `${timing}, ${why}`;

  return { recommendedDomain, focusDomain: chosenDomain, intensity, dailyGoal, readyByDate, rationale };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- onboarding-plan`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/onboarding/onboarding-plan.ts src/lib/onboarding/__tests__/onboarding-plan.test.ts
git commit -m "feat(onboarding): add buildPlan study-plan logic"
```

---

## Task 4: Step order + progress helper

**Files:**
- Create: `src/lib/onboarding/onboarding-steps.ts`
- Test: `src/lib/onboarding/__tests__/onboarding-steps.test.ts`

**Interfaces:**
- Produces:
  - `export const ONBOARDING_ORDER: string[]` — slugs in funnel order.
  - `export function progressFor(slug: string): number | null` — `null` for pure value/loader screens (no bar); otherwise a 0..1 fraction pre-filled to ~0.15 at the first question.

- [ ] **Step 1: Write the failing test** — `src/lib/onboarding/__tests__/onboarding-steps.test.ts`:

```ts
import { ONBOARDING_ORDER, progressFor } from '../onboarding-steps';

test('order starts at splash and ends at reveal', () => {
  expect(ONBOARDING_ORDER[0]).toBe('splash');
  expect(ONBOARDING_ORDER[ONBOARDING_ORDER.length - 1]).toBe('reveal');
});

test('value screens have no progress bar', () => {
  expect(progressFor('splash')).toBeNull();
  expect(progressFor('story-concept')).toBeNull();
  expect(progressFor('reveal')).toBeNull();
});

test('first question is pre-filled (~15%) and progress increases monotonically', () => {
  const examDate = progressFor('exam-date')!;
  const commit = progressFor('commit')!;
  expect(examDate).toBeGreaterThanOrEqual(0.1);
  expect(examDate).toBeLessThan(0.25);
  expect(commit).toBeGreaterThan(examDate);
  expect(commit).toBeLessThanOrEqual(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- onboarding-steps`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement** `src/lib/onboarding/onboarding-steps.ts`:

```ts
export const ONBOARDING_ORDER: string[] = [
  'splash', 'story-concept', 'story-cast',
  'exam-date', 'fact-exam', 'why-certified', 'fact-social',
  'experience', 'fact-content', 'confidence', 'fact-study',
  'belief', 'reminder', 'commit', 'domain', 'reveal',
];

// Screens that show no progress bar: the opening value screens and the reveal.
const NO_BAR = new Set(['splash', 'story-concept', 'story-cast', 'reveal']);

// The progress bar spans from the first question (`exam-date`) to `domain`,
// pre-filled to BASE so step one already feels underway (endowed progress).
const BASE = 0.15;
const FIRST = 'exam-date';
const LAST = 'domain';

export function progressFor(slug: string): number | null {
  if (NO_BAR.has(slug)) return null;
  const start = ONBOARDING_ORDER.indexOf(FIRST);
  const end = ONBOARDING_ORDER.indexOf(LAST);
  const i = ONBOARDING_ORDER.indexOf(slug);
  if (i < 0) return null;
  const t = (i - start) / (end - start); // 0..1 across the question span
  return BASE + (1 - BASE) * Math.max(0, Math.min(1, t));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- onboarding-steps`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/onboarding/onboarding-steps.ts src/lib/onboarding/__tests__/onboarding-steps.test.ts
git commit -m "feat(onboarding): add step order and progress helper"
```

---

## Task 5: Shared screen components

**Files:**
- Create: `src/components/onboarding/OnboardingProgress.tsx`
- Create: `src/components/onboarding/ValueScreen.tsx`
- Create: `src/components/onboarding/FactScreen.tsx`
- Create: `src/components/onboarding/ChoiceScreen.tsx`
- Test: `src/components/onboarding/__tests__/shared-screens.test.tsx`

**Interfaces:**
- Consumes: `Fact` (Task 2), `Button`/`Txt`/`Hairline`/`PressableFeedback`, `TOKENS`.
- Produces:
  - `OnboardingProgress({ progress }: { progress: number })`
  - `ValueScreen({ eyebrow?, title, body?, ctaLabel?, onContinue, progress? }: { eyebrow?: string; title: string; body?: string; ctaLabel?: string; onContinue: () => void; progress?: number | null })`
  - `FactScreen({ fact, onContinue, progress, ctaLabel? }: { fact: Fact; onContinue: () => void; progress?: number | null; ctaLabel?: string })`
  - `ChoiceOption = { value: string; label: string; description?: string }`
  - `ChoiceScreen({ eyebrow, title, subtitle?, options, mode, value, onChange, onContinue, ctaLabel?, progress?, requireSelection? }: { eyebrow?: string; title: string; subtitle?: string; options: ChoiceOption[]; mode: 'single' | 'multi'; value: string[]; onChange: (next: string[]) => void; onContinue: () => void; ctaLabel?: string; progress?: number | null; requireSelection?: boolean })`

- [ ] **Step 1: Write the failing test** — `src/components/onboarding/__tests__/shared-screens.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ValueScreen } from '../ValueScreen';
import { FactScreen } from '../FactScreen';
import { ChoiceScreen } from '../ChoiceScreen';

test('ValueScreen renders title and fires onContinue', () => {
  const onContinue = jest.fn();
  const { getByText } = render(
    <ValueScreen title="Learn by doing" ctaLabel="Get Started" onContinue={onContinue} />,
  );
  fireEvent.press(getByText('Get Started'));
  expect(onContinue).toHaveBeenCalled();
});

test('FactScreen renders the fact text', () => {
  const { getByText } = render(
    <FactScreen fact={{ id: 'x', text: '180 questions' }} onContinue={() => {}} progress={0.2} />,
  );
  expect(getByText(/180 questions/)).toBeTruthy();
});

test('ChoiceScreen single-select toggles selection and continues', () => {
  const onChange = jest.fn();
  const onContinue = jest.fn();
  const { getByText } = render(
    <ChoiceScreen
      title="Why certified?"
      mode="single"
      options={[{ value: 'a', label: 'Promotion' }, { value: 'b', label: 'Raise' }]}
      value={['a']}
      onChange={onChange}
      onContinue={onContinue}
      ctaLabel="Continue"
    />,
  );
  fireEvent.press(getByText('Raise'));
  expect(onChange).toHaveBeenCalledWith(['b']);
  fireEvent.press(getByText('Continue'));
  expect(onContinue).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- shared-screens`
Expected: FAIL (cannot find modules).

- [ ] **Step 3: Implement `OnboardingProgress.tsx`:**

```tsx
import React from 'react';
import { View } from 'react-native';
import { TOKENS } from '../../theme/tokens';

export function OnboardingProgress({ progress }: { progress: number }) {
  return (
    <View style={{ height: 3, backgroundColor: TOKENS['surface-container-high'], borderRadius: 2 }}>
      <View
        style={{
          width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`,
          height: 3,
          backgroundColor: TOKENS.primary,
          borderRadius: 2,
        }}
      />
    </View>
  );
}
```

- [ ] **Step 4: Implement `ValueScreen.tsx`:**

```tsx
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../primitives/Button';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { OnboardingProgress } from './OnboardingProgress';

type Props = {
  eyebrow?: string;
  title: string;
  body?: string;
  ctaLabel?: string;
  onContinue: () => void;
  progress?: number | null;
};

export function ValueScreen({ eyebrow, title, body, ctaLabel = 'Continue', onContinue, progress }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 24 }}>
        {progress != null && <OnboardingProgress progress={progress} />}
        <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          {eyebrow ? (
            <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
              {eyebrow}
            </Txt>
          ) : null}
          <Txt variant="display" style={{ fontSize: 40, lineHeight: 44, letterSpacing: -1, color: TOKENS.primary }}>
            {title}
          </Txt>
          {body ? (
            <Txt variant="body" style={{ fontSize: 16, lineHeight: 24, color: TOKENS.outline }}>
              {body}
            </Txt>
          ) : null}
        </View>
        <Button label={ctaLabel} onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 5: Implement `FactScreen.tsx`:**

```tsx
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../primitives/Button';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { OnboardingProgress } from './OnboardingProgress';
import type { Fact } from '../../data/onboarding-facts';

type Props = { fact: Fact; onContinue: () => void; progress?: number | null; ctaLabel?: string };

export function FactScreen({ fact, onContinue, progress, ctaLabel = 'Continue' }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS['surface-container-lowest'] }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 24 }}>
        {progress != null && <OnboardingProgress progress={progress} />}
        <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
            Did you know
          </Txt>
          <Txt variant="display" style={{ fontSize: 30, lineHeight: 38, letterSpacing: -0.5, color: TOKENS.primary }}>
            {fact.text}
          </Txt>
        </View>
        <Button label={ctaLabel} onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 6: Implement `ChoiceScreen.tsx`** (selection visuals follow the existing `goal-selection.tsx` pattern):

```tsx
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { OnboardingProgress } from './OnboardingProgress';

export type ChoiceOption = { value: string; label: string; description?: string };

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  options: ChoiceOption[];
  mode: 'single' | 'multi';
  value: string[];
  onChange: (next: string[]) => void;
  onContinue: () => void;
  ctaLabel?: string;
  progress?: number | null;
  requireSelection?: boolean;
};

export function ChoiceScreen({
  eyebrow, title, subtitle, options, mode, value, onChange, onContinue,
  ctaLabel = 'Continue', progress, requireSelection = false,
}: Props) {
  function toggle(v: string) {
    if (mode === 'single') { onChange([v]); return; }
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }
  const disabled = requireSelection && value.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 32 }}>
        {progress != null && <OnboardingProgress progress={progress} />}
        <View style={{ gap: 8 }}>
          {eyebrow ? (
            <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
              {eyebrow}
            </Txt>
          ) : null}
          <Txt variant="display" style={{ fontSize: 32, lineHeight: 36, letterSpacing: -0.5, color: TOKENS.primary }}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt variant="body" style={{ fontSize: 14, lineHeight: 20, color: TOKENS.outline }}>{subtitle}</Txt>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          {options.map((opt, i) => {
            const selected = value.includes(opt.value);
            return (
              <View key={opt.value}>
                <PressableFeedback onPress={() => toggle(opt.value)}>
                  <View style={{
                    paddingVertical: 20, paddingHorizontal: 16,
                    backgroundColor: selected ? TOKENS.primary : 'transparent',
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Txt variant="body" style={{ fontSize: 17, fontWeight: '700', color: selected ? TOKENS['on-primary'] : TOKENS.primary }}>
                        {opt.label}
                      </Txt>
                      {opt.description ? (
                        <Txt variant="body" style={{ fontSize: 13, color: selected ? 'rgba(255,255,255,0.7)' : TOKENS.outline }}>
                          {opt.description}
                        </Txt>
                      ) : null}
                    </View>
                    {selected && (
                      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: TOKENS['on-primary'], marginLeft: 12 }} />
                    )}
                  </View>
                </PressableFeedback>
                {i < options.length - 1 && <Hairline />}
              </View>
            );
          })}
        </View>
        <Button label={ctaLabel} onPress={onContinue} disabled={disabled} />
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test -- shared-screens`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add src/components/onboarding/OnboardingProgress.tsx src/components/onboarding/ValueScreen.tsx src/components/onboarding/FactScreen.tsx src/components/onboarding/ChoiceScreen.tsx src/components/onboarding/__tests__/shared-screens.test.tsx
git commit -m "feat(onboarding): shared value/fact/choice screen components"
```

---

## Task 6: Confidence rating, lesson card, domain picker

**Files:**
- Create: `src/components/onboarding/ConfidenceRating.tsx`
- Create: `src/components/onboarding/OnboardingLessonCard.tsx`
- Create: `src/components/onboarding/DomainPicker.tsx`
- Test: `src/components/onboarding/__tests__/domain-picker.test.tsx`

**Interfaces:**
- Consumes: `Domain` (`src/types/progress.ts`); `lessonsIndex` from `src/data/lessons-data.ts`; `DOMAIN_OF`, `DOMAIN_TITLE` from `src/data/domains.ts`; `getLessonThumbnail` from `src/data/lesson-images.ts`; `Lesson` from `src/types/lesson.ts`.
- Produces:
  - `ConfidenceRating({ value, onChange }: { value: { people: number; process: number; business: number }; onChange: (domain: Domain, v: number) => void })` — three rows, 1–5 taps.
  - `OnboardingLessonCard({ lesson }: { lesson: Lesson })`
  - `lessonsForDomain(domain: Domain, limit?: number): Lesson[]` (exported from `DomainPicker.tsx`)
  - `DomainPicker({ recommended, selected, onSelect }: { recommended: Domain; selected: Domain | null; onSelect: (d: Domain) => void })`

- [ ] **Step 1: Write the failing test** — `src/components/onboarding/__tests__/domain-picker.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConfidenceRating } from '../ConfidenceRating';
import { DomainPicker, lessonsForDomain } from '../DomainPicker';

test('lessonsForDomain returns up to 3 lessons for a domain', () => {
  const lessons = lessonsForDomain('process', 3);
  expect(lessons.length).toBeGreaterThan(0);
  expect(lessons.length).toBeLessThanOrEqual(3);
});

test('DomainPicker shows the recommended badge and fires onSelect', () => {
  const onSelect = jest.fn();
  const { getByText, getAllByText } = render(
    <DomainPicker recommended="process" selected={null} onSelect={onSelect} />,
  );
  expect(getAllByText(/Recommended for you/i).length).toBeGreaterThan(0);
  fireEvent.press(getByText('People'));
  expect(onSelect).toHaveBeenCalledWith('people');
});

test('ConfidenceRating fires onChange with the tapped value', () => {
  const onChange = jest.fn();
  const { getByTestId } = render(
    <ConfidenceRating value={{ people: 3, process: 3, business: 3 }} onChange={onChange} />,
  );
  fireEvent.press(getByTestId('confidence-process-5'));
  expect(onChange).toHaveBeenCalledWith('process', 5);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- domain-picker`
Expected: FAIL (cannot find modules).

- [ ] **Step 3: Implement `OnboardingLessonCard.tsx`:**

```tsx
import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Txt } from '../primitives/Txt';
import { TOKENS, RADIUS } from '../../theme/tokens';
import { getLessonThumbnail } from '../../data/lesson-images';
import type { Lesson } from '../../types/lesson';

export function OnboardingLessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <View style={{
      width: 160, borderRadius: RADIUS.media, overflow: 'hidden',
      borderWidth: 1, borderColor: TOKENS['outline-variant'],
      backgroundColor: TOKENS['surface-container-lowest'],
    }}>
      <Image
        source={getLessonThumbnail(lesson.thumbnail)}
        style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: TOKENS['surface-container'] }}
        contentFit="cover"
        transition={150}
      />
      <View style={{ padding: 10, gap: 4 }}>
        <Txt variant="label" style={{ fontSize: 13, fontWeight: '700', color: TOKENS['on-background'] }} numberOfLines={2}>
          {lesson.title}
        </Txt>
        <Txt variant="label" style={{ fontSize: 11, color: TOKENS.outline }}>{lesson.duration} min</Txt>
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Implement `ConfidenceRating.tsx`:**

```tsx
import React from 'react';
import { View } from 'react-native';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { DOMAIN_TITLE } from '../../data/domains';
import type { Domain } from '../../types/progress';

type Conf = { people: number; process: number; business: number };
const ROWS: Domain[] = ['people', 'process', 'business'];

export function ConfidenceRating({ value, onChange }: { value: Conf; onChange: (d: Domain, v: number) => void }) {
  return (
    <View style={{ gap: 24 }}>
      {ROWS.map((domain) => (
        <View key={domain} style={{ gap: 8 }}>
          <Txt variant="body" style={{ fontSize: 15, fontWeight: '700', color: TOKENS.primary }}>
            {DOMAIN_TITLE[domain]}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = value[domain] >= n;
              return (
                <PressableFeedback key={n} onPress={() => onChange(domain, n)}>
                  <View
                    testID={`confidence-${domain}-${n}`}
                    style={{
                      width: 44, height: 44, borderRadius: 22,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: active ? TOKENS.primary : 'transparent',
                      borderWidth: 1, borderColor: active ? TOKENS.primary : TOKENS['outline-variant'],
                    }}
                  >
                    <Txt variant="label" style={{ fontSize: 14, color: active ? TOKENS['on-primary'] : TOKENS.outline }}>
                      {n}
                    </Txt>
                  </View>
                </PressableFeedback>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 5: Implement `DomainPicker.tsx`:**

```tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { TOKENS, RADIUS } from '../../theme/tokens';
import { OnboardingLessonCard } from './OnboardingLessonCard';
import { lessonsIndex } from '../../data/lessons-data';
import { DOMAIN_OF, DOMAIN_TITLE } from '../../data/domains';
import type { Domain } from '../../types/progress';
import type { Lesson } from '../../types/lesson';

const DOMAINS: Domain[] = ['people', 'process', 'business'];

export function lessonsForDomain(domain: Domain, limit = 3): Lesson[] {
  const out: Lesson[] = [];
  for (const module of lessonsIndex) {
    for (const lesson of module.lessons) {
      if (DOMAIN_OF[lesson.domain] === domain) out.push(lesson);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function DomainPicker({
  recommended, selected, onSelect,
}: { recommended: Domain; selected: Domain | null; onSelect: (d: Domain) => void }) {
  return (
    <View style={{ gap: 16 }}>
      {DOMAINS.map((domain) => {
        const isSelected = selected === domain;
        const isRecommended = recommended === domain;
        return (
          <PressableFeedback key={domain} onPress={() => onSelect(domain)}>
            <View style={{
              borderRadius: RADIUS.media, padding: 12, gap: 10,
              borderWidth: 2, borderColor: isSelected ? TOKENS.primary : TOKENS['outline-variant'],
              backgroundColor: TOKENS['surface-container-lowest'],
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Txt variant="body" style={{ fontSize: 17, fontWeight: '700', color: TOKENS.primary }}>
                  {DOMAIN_TITLE[domain]}
                </Txt>
                {isRecommended && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: TOKENS.primary }}>
                    <Txt variant="label" style={{ fontSize: 10, fontWeight: '700', color: TOKENS['on-primary'], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Recommended for you
                    </Txt>
                  </View>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {lessonsForDomain(domain, 3).map((lesson) => (
                  <OnboardingLessonCard key={lesson.id} lesson={lesson} />
                ))}
              </ScrollView>
            </View>
          </PressableFeedback>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- domain-picker`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/components/onboarding/ConfidenceRating.tsx src/components/onboarding/OnboardingLessonCard.tsx src/components/onboarding/DomainPicker.tsx src/components/onboarding/__tests__/domain-picker.test.tsx
git commit -m "feat(onboarding): confidence rating and domain picker"
```

---

## Task 7: Value screens (splash, story-concept, story-cast)

**Files:**
- Modify: `src/app/(onboarding)/splash.tsx`
- Create: `src/app/(onboarding)/story-concept.tsx`
- Create: `src/app/(onboarding)/story-cast.tsx`
- Test: `src/app/(onboarding)/__tests__/value-screens.test.tsx`

**Interfaces:**
- Consumes: `ValueScreen` (Task 5), `expo-router` `router`.

- [ ] **Step 1: Write the failing test** — `src/app/(onboarding)/__tests__/value-screens.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

import Splash from '../splash';
import StoryConcept from '../story-concept';
import StoryCast from '../story-cast';

test('splash shows the learn-by-doing headline', () => {
  const { getByText } = render(<Splash />);
  expect(getByText(/Learn by doing/i)).toBeTruthy();
});
test('story-concept renders', () => {
  expect(render(<StoryConcept />).getByText(/one story/i)).toBeTruthy();
});
test('story-cast renders the cast intro', () => {
  expect(render(<StoryCast />).getByText(/Savory/i)).toBeTruthy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- value-screens`
Expected: FAIL (cannot find story modules).

- [ ] **Step 3: Replace `splash.tsx`** with a `ValueScreen` that carries the learn-by-doing message and routes onward:

```tsx
import { router } from 'expo-router';
import React from 'react';
import { ValueScreen } from '../../components/onboarding/ValueScreen';

export default function OnboardingSplash() {
  return (
    <ValueScreen
      eyebrow="PMP Exam Pro"
      title="Learn by doing — not memorizing."
      body="Master the PMP through real project decisions, one lesson at a time."
      ctaLabel="Get Started"
      onContinue={() => router.push('/(onboarding)/story-concept')}
    />
  );
}
```

- [ ] **Step 4: Create `story-concept.tsx`:**

```tsx
import { router } from 'expo-router';
import React from 'react';
import { ValueScreen } from '../../components/onboarding/ValueScreen';

export default function StoryConcept() {
  return (
    <ValueScreen
      eyebrow="How it works"
      title="One story, start to finish."
      body="Instead of disconnected facts, you learn through a single unfolding project — so concepts build on each other and actually stick."
      onContinue={() => router.push('/(onboarding)/story-cast')}
    />
  );
}
```

- [ ] **Step 5: Create `story-cast.tsx`:**

```tsx
import { router } from 'expo-router';
import React from 'react';
import { ValueScreen } from '../../components/onboarding/ValueScreen';

export default function StoryCast() {
  return (
    <ValueScreen
      eyebrow="Your case study"
      title="Welcome to Savory & Co."
      body="You’ll steer real projects for a restaurant group — its sponsors, its team, its crises. Every PMP concept shows up as a decision someone has to make."
      onContinue={() => router.push('/(onboarding)/exam-date')}
    />
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- value-screens`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add "src/app/(onboarding)/splash.tsx" "src/app/(onboarding)/story-concept.tsx" "src/app/(onboarding)/story-cast.tsx" "src/app/(onboarding)/__tests__/value-screens.test.tsx"
git commit -m "feat(onboarding): combined splash + story value screens"
```

---

## Task 8: Question screens — exam date, why-certified, experience (+ facts)

**Files:**
- Create: `src/app/(onboarding)/exam-date.tsx`
- Create: `src/app/(onboarding)/fact-exam.tsx`
- Create: `src/app/(onboarding)/why-certified.tsx`
- Create: `src/app/(onboarding)/fact-social.tsx`
- Create: `src/app/(onboarding)/experience.tsx`
- Create: `src/app/(onboarding)/fact-content.tsx`
- Test: `src/app/(onboarding)/__tests__/questions-a.test.tsx`

**Interfaces:**
- Consumes: `ChoiceScreen`/`FactScreen` (Task 5), `useOnboarding` (Task 1), `getFact` (Task 2), `progressFor` (Task 4), `router`.
- Exam-date uses preset chips mapped to an approximate `examDate` (now + N days) or `null` for "Not booked yet".

- [ ] **Step 1: Write the failing test** — `src/app/(onboarding)/__tests__/questions-a.test.tsx`:

```tsx
import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

import ExamDate from '../exam-date';
import WhyCertified from '../why-certified';
import Experience from '../experience';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

test('exam-date offers a not-booked option', async () => {
  const { getByText } = await render(<ExamDate />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/Not booked yet/i)).toBeTruthy());
});
test('why-certified renders reasons', async () => {
  const { getByText } = await render(<WhyCertified />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/promotion/i)).toBeTruthy());
});
test('experience renders PM experience options', async () => {
  const { getByText } = await render(<Experience />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/New to project management/i)).toBeTruthy());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- questions-a`
Expected: FAIL (cannot find modules).

- [ ] **Step 3: Create `exam-date.tsx`** (preset chips → approximate `examDate`):

```tsx
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { useOnboarding } from '../../contexts/onboarding-context';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

const DAY = 24 * 60 * 60 * 1000;
const OPTIONS: ChoiceOption[] = [
  { value: '30', label: 'Within a month', description: 'The clock is ticking.' },
  { value: '90', label: '1–3 months', description: 'A focused run-up.' },
  { value: '180', label: '3–6 months', description: 'Plenty of runway.' },
  { value: 'none', label: 'Not booked yet', description: 'I’m still planning.' },
];

export default function ExamDate() {
  const { setExamDate } = useOnboarding();
  const [value, setValue] = useState<string[]>([]);
  function onContinue() {
    const pick = value[0];
    setExamDate(pick && pick !== 'none' ? Date.now() + Number(pick) * DAY : null);
    router.push('/(onboarding)/fact-exam');
  }
  return (
    <ChoiceScreen
      eyebrow="Your timeline"
      title="When’s your exam?"
      options={OPTIONS}
      mode="single"
      value={value}
      onChange={setValue}
      onContinue={onContinue}
      progress={progressFor('exam-date')}
      requireSelection
    />
  );
}
```

- [ ] **Step 4: Create `fact-exam.tsx`:**

```tsx
import { router } from 'expo-router';
import React from 'react';
import { FactScreen } from '../../components/onboarding/FactScreen';
import { getFact } from '../../data/onboarding-facts';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function FactExam() {
  return (
    <FactScreen
      fact={getFact('exam')}
      progress={progressFor('fact-exam')}
      onContinue={() => router.push('/(onboarding)/why-certified')}
    />
  );
}
```

- [ ] **Step 5: Create `why-certified.tsx`** (multi-select, persists via `toggleReason`):

```tsx
import { router } from 'expo-router';
import React from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { useOnboarding } from '../../contexts/onboarding-context';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

const OPTIONS: ChoiceOption[] = [
  { value: 'promotion', label: 'Get a promotion' },
  { value: 'raise', label: 'Earn a raise' },
  { value: 'required', label: 'It’s required for my role' },
  { value: 'switch', label: 'Switch into project management' },
  { value: 'personal', label: 'Personal goal' },
];

export default function WhyCertified() {
  const { reasons, toggleReason } = useOnboarding();
  function onChange(next: string[]) {
    const added = next.find((v) => !reasons.includes(v));
    const removed = reasons.find((v) => !next.includes(v));
    if (added) toggleReason(added);
    if (removed) toggleReason(removed);
  }
  return (
    <ChoiceScreen
      eyebrow="Your motivation"
      title="Why are you getting certified?"
      subtitle="Pick all that apply."
      options={OPTIONS}
      mode="multi"
      value={reasons}
      onChange={onChange}
      onContinue={() => router.push('/(onboarding)/fact-social')}
      progress={progressFor('why-certified')}
      requireSelection
    />
  );
}
```

- [ ] **Step 6: Create `fact-social.tsx`** (same shape as `fact-exam`, fact `social`, route → `experience`):

```tsx
import { router } from 'expo-router';
import React from 'react';
import { FactScreen } from '../../components/onboarding/FactScreen';
import { getFact } from '../../data/onboarding-facts';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function FactSocial() {
  return (
    <FactScreen
      fact={getFact('social')}
      progress={progressFor('fact-social')}
      onContinue={() => router.push('/(onboarding)/experience')}
    />
  );
}
```

- [ ] **Step 7: Create `experience.tsx`:**

```tsx
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { useOnboarding, type Experience as Exp } from '../../contexts/onboarding-context';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

const OPTIONS: ChoiceOption[] = [
  { value: 'new', label: 'New to project management' },
  { value: 'informal', label: 'I run projects, but no formal training' },
  { value: 'experienced', label: 'Experienced PM — here for the cert' },
];

export default function Experience() {
  const { experience, setExperience } = useOnboarding();
  const [value, setValue] = useState<string[]>([experience]);
  function onContinue() {
    setExperience((value[0] ?? 'new') as Exp);
    router.push('/(onboarding)/fact-content');
  }
  return (
    <ChoiceScreen
      eyebrow="About you"
      title="How much project management experience do you have?"
      options={OPTIONS}
      mode="single"
      value={value}
      onChange={setValue}
      onContinue={onContinue}
      progress={progressFor('experience')}
      requireSelection
    />
  );
}
```

- [ ] **Step 8: Create `fact-content.tsx`** (fact `content`, route → `confidence`):

```tsx
import { router } from 'expo-router';
import React from 'react';
import { FactScreen } from '../../components/onboarding/FactScreen';
import { getFact } from '../../data/onboarding-facts';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function FactContent() {
  return (
    <FactScreen
      fact={getFact('content')}
      progress={progressFor('fact-content')}
      onContinue={() => router.push('/(onboarding)/confidence')}
    />
  );
}
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npm test -- questions-a`
Expected: PASS (3 tests).

- [ ] **Step 10: Commit**

```bash
git add "src/app/(onboarding)/exam-date.tsx" "src/app/(onboarding)/fact-exam.tsx" "src/app/(onboarding)/why-certified.tsx" "src/app/(onboarding)/fact-social.tsx" "src/app/(onboarding)/experience.tsx" "src/app/(onboarding)/fact-content.tsx" "src/app/(onboarding)/__tests__/questions-a.test.tsx"
git commit -m "feat(onboarding): exam-date, why-certified, experience screens"
```

---

## Task 9: Question screens — confidence, belief, reminder, commit (+ fact)

**Files:**
- Create: `src/app/(onboarding)/confidence.tsx`
- Create: `src/app/(onboarding)/fact-study.tsx`
- Create: `src/app/(onboarding)/belief.tsx`
- Create: `src/app/(onboarding)/reminder.tsx`
- Create: `src/app/(onboarding)/commit.tsx`
- Test: `src/app/(onboarding)/__tests__/questions-b.test.tsx`

**Interfaces:**
- Consumes: `ConfidenceRating` (Task 6), `ChoiceScreen`/`FactScreen` (Task 5), `ValueScreen` (Task 5, for commit), `useOnboarding`, `progressFor`, `getFact`, `router`.

- [ ] **Step 1: Write the failing test** — `src/app/(onboarding)/__tests__/questions-b.test.tsx`:

```tsx
import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

import Confidence from '../confidence';
import Reminder from '../reminder';
import Commit from '../commit';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

test('confidence renders the three domains', async () => {
  const { getByText } = await render(<Confidence />, { wrapper: wrap });
  await waitFor(() => expect(getByText('Process')).toBeTruthy());
});
test('reminder renders reminder options', async () => {
  const { getByText } = await render(<Reminder />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/Morning/i)).toBeTruthy());
});
test('commit renders the pledge CTA', async () => {
  const { getByText } = await render(<Commit />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/Commit/i)).toBeTruthy());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- questions-b`
Expected: FAIL (cannot find modules).

- [ ] **Step 3: Create `confidence.tsx`** (uses `ConfidenceRating` inside a scaffold with header + CTA):

```tsx
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/primitives/Button';
import { Txt } from '../../components/primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { ConfidenceRating } from '../../components/onboarding/ConfidenceRating';
import { useOnboarding } from '../../contexts/onboarding-context';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function Confidence() {
  const { confidence, setConfidence } = useOnboarding();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 32 }}>
        <OnboardingProgress progress={progressFor('confidence')!} />
        <View style={{ gap: 8 }}>
          <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
            Your starting point
          </Txt>
          <Txt variant="display" style={{ fontSize: 30, lineHeight: 34, letterSpacing: -0.5, color: TOKENS.primary }}>
            How confident are you in each area?
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <ConfidenceRating value={confidence} onChange={setConfidence} />
        </View>
        <Button label="Continue" onPress={() => router.push('/(onboarding)/fact-study')} />
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Create `fact-study.tsx`** (fact `study`, route → `belief`):

```tsx
import { router } from 'expo-router';
import React from 'react';
import { FactScreen } from '../../components/onboarding/FactScreen';
import { getFact } from '../../data/onboarding-facts';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function FactStudy() {
  return (
    <FactScreen
      fact={getFact('study')}
      progress={progressFor('fact-study')}
      onContinue={() => router.push('/(onboarding)/belief')}
    />
  );
}
```

- [ ] **Step 5: Create `belief.tsx`** (tap-to-agree → a single-option `ChoiceScreen`):

```tsx
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

const OPTIONS: ChoiceOption[] = [
  { value: 'agree', label: 'Yes — it feels like a lot', description: 'You’re not alone. We’ll break it into daily wins.' },
  { value: 'no', label: 'Not really', description: 'Great — we’ll keep your momentum.' },
];

export default function Belief() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <ChoiceScreen
      eyebrow="Be honest"
      title="Does studying for the PMP feel overwhelming?"
      options={OPTIONS}
      mode="single"
      value={value}
      onChange={setValue}
      onContinue={() => router.push('/(onboarding)/reminder')}
      progress={progressFor('belief')}
      requireSelection
    />
  );
}
```

- [ ] **Step 6: Create `reminder.tsx`** (persists via `setReminder`):

```tsx
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ChoiceScreen, type ChoiceOption } from '../../components/onboarding/ChoiceScreen';
import { useOnboarding, type Reminder as Rem } from '../../contexts/onboarding-context';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

const OPTIONS: ChoiceOption[] = [
  { value: 'morning', label: 'Morning', description: 'Start the day sharp — 8:00 AM.' },
  { value: 'lunch', label: 'Lunch break', description: 'A productive midday habit — 12:30 PM.' },
  { value: 'evening', label: 'Evening', description: 'Wind down with learning — 7:00 PM.' },
  { value: 'none', label: 'No reminder', description: 'I’ll open the app on my own.' },
];

export default function Reminder() {
  const { reminder, setReminder } = useOnboarding();
  const [value, setValue] = useState<string[]>([reminder]);
  function onContinue() {
    setReminder((value[0] ?? 'morning') as Rem);
    router.push('/(onboarding)/commit');
  }
  return (
    <ChoiceScreen
      eyebrow="Daily reminder"
      title="When should we remind you?"
      subtitle="Consistency beats intensity. A nudge goes a long way."
      options={OPTIONS}
      mode="single"
      value={value}
      onChange={setValue}
      onContinue={onContinue}
      progress={progressFor('reminder')}
      requireSelection
    />
  );
}
```

- [ ] **Step 7: Create `commit.tsx`** (a `ValueScreen` as the pledge):

```tsx
import { router } from 'expo-router';
import React from 'react';
import { ValueScreen } from '../../components/onboarding/ValueScreen';
import { progressFor } from '../../lib/onboarding/onboarding-steps';

export default function Commit() {
  return (
    <ValueScreen
      eyebrow="Your pledge"
      title="Commit to passing."
      body="You’ve set your goal. The next step is showing up — a little, every day."
      ctaLabel="I’m committed"
      progress={progressFor('commit')}
      onContinue={() => router.push('/(onboarding)/domain')}
    />
  );
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test -- questions-b`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add "src/app/(onboarding)/confidence.tsx" "src/app/(onboarding)/fact-study.tsx" "src/app/(onboarding)/belief.tsx" "src/app/(onboarding)/reminder.tsx" "src/app/(onboarding)/commit.tsx" "src/app/(onboarding)/__tests__/questions-b.test.tsx"
git commit -m "feat(onboarding): confidence, belief, reminder, commit screens"
```

---

## Task 10: Domain picker screen + reveal + paywall routing

**Files:**
- Create: `src/app/(onboarding)/domain.tsx`
- Create: `src/components/onboarding/RevealScreen.tsx`
- Create: `src/app/(onboarding)/reveal.tsx`
- Test: `src/app/(onboarding)/__tests__/domain-reveal.test.tsx`

**Interfaces:**
- Consumes: `DomainPicker`/`lessonsForDomain` (Task 6), `buildPlan` (Task 3), `getAllLessons` (`src/data/lessons-data.ts`), `useOnboarding`, `REVENUECAT_ENABLED` (`src/config/env.ts`), `router`.
- Domain screen recommends via `buildPlan(...).recommendedDomain`; selection calls `setFocusDomain(domain)`.
- Reveal computes `buildPlan`, persists `dailyGoal` + `focusDomain`, runs a ~2s "preparing" state, then shows the plan; CTA → `/paywall` if `REVENUECAT_ENABLED` else `completeOnboarding()` + `router.replace('/')`.

- [ ] **Step 1: Write the failing test** — `src/app/(onboarding)/__tests__/domain-reveal.test.tsx`:

```tsx
import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
const replace = jest.fn();
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: (...a: any[]) => replace(...a) } }));
jest.mock('../../../config/env', () => ({ REVENUECAT_ENABLED: false }));

import DomainScreen from '../domain';
import Reveal from '../reveal';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

test('domain screen renders all three domains', async () => {
  const { getByText } = await render(<DomainScreen />, { wrapper: wrap });
  await waitFor(() => expect(getByText('People')).toBeTruthy());
});

test('reveal completes onboarding and lands in the app when paywall is off', async () => {
  jest.useFakeTimers();
  const { getByText } = await render(<Reveal />, { wrapper: wrap });
  await act(async () => { jest.advanceTimersByTime(2500); });
  await waitFor(() => expect(getByText(/Unlock my plan/i)).toBeTruthy());
  fireEvent.press(getByText(/Unlock my plan/i));
  await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  jest.useRealTimers();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- domain-reveal`
Expected: FAIL (cannot find modules).

- [ ] **Step 3: Create `domain.tsx`:**

```tsx
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/primitives/Button';
import { Txt } from '../../components/primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { DomainPicker } from '../../components/onboarding/DomainPicker';
import { useOnboarding } from '../../contexts/onboarding-context';
import { buildPlan } from '../../lib/onboarding/onboarding-plan';
import { getAllLessons } from '../../data/lessons-data';
import { progressFor } from '../../lib/onboarding/onboarding-steps';
import type { Domain } from '../../types/progress';

export default function DomainScreen() {
  const { confidence, examDate, experience, setFocusDomain } = useOnboarding();
  const recommended = useMemo(
    () => buildPlan({ confidence, examDate, experience, chosenDomain: 'people', totalLessons: getAllLessons().length, now: Date.now() }).recommendedDomain,
    [confidence, examDate, experience],
  );
  const [selected, setSelected] = useState<Domain>(recommended);

  function onContinue() {
    setFocusDomain(selected);
    router.push('/(onboarding)/reveal');
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 24 }}>
        <OnboardingProgress progress={progressFor('domain')!} />
        <View style={{ gap: 8 }}>
          <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
            Your path
          </Txt>
          <Txt variant="display" style={{ fontSize: 32, lineHeight: 36, letterSpacing: -0.5, color: TOKENS.primary }}>
            Where do you want to start?
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <DomainPicker recommended={recommended} selected={selected} onSelect={setSelected} />
        </View>
        <Button label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Implement `RevealScreen.tsx`** (presentational; the route wires data/CTA):

```tsx
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../primitives/Button';
import { Txt } from '../primitives/Txt';
import { TOKENS } from '../../theme/tokens';
import type { Plan } from '../../lib/onboarding/onboarding-plan';
import { DOMAIN_TITLE } from '../../data/domains';

type Props = { preparing: boolean; plan: Plan; readyByLabel: string | null; ctaLabel: string; onContinue: () => void };

export function RevealScreen({ preparing, plan, readyByLabel, ctaLabel, onContinue }: Props) {
  if (preparing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.primary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Txt variant="display" style={{ fontSize: 28, color: TOKENS['on-primary'], textAlign: 'center' }}>
            Preparing your plan…
          </Txt>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TOKENS.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 48, gap: 16 }}>
        <Txt variant="label" style={{ fontSize: 11, letterSpacing: 4, color: TOKENS.outline, textTransform: 'uppercase' }}>
          Your study plan
        </Txt>
        <Txt variant="display" style={{ fontSize: 36, lineHeight: 40, letterSpacing: -0.5, color: TOKENS.primary }}>
          Your plan is ready.
        </Txt>
        <View style={{ flex: 1, gap: 12, marginTop: 8 }}>
          <Txt variant="body" style={{ fontSize: 16, color: TOKENS.primary }}>
            Starting with: <Txt style={{ fontWeight: '700' }}>{DOMAIN_TITLE[plan.focusDomain]}</Txt>
          </Txt>
          <Txt variant="body" style={{ fontSize: 16, color: TOKENS.primary }}>
            Pace: <Txt style={{ fontWeight: '700' }}>{plan.dailyGoal} lessons/day</Txt>
            {readyByLabel ? ` — exam-ready by ${readyByLabel}` : ''}
          </Txt>
          <Txt variant="body" style={{ fontSize: 14, lineHeight: 21, color: TOKENS.outline }}>
            {plan.rationale}
          </Txt>
        </View>
        <Button label={ctaLabel} onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 5: Create `reveal.tsx`:**

```tsx
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { RevealScreen } from '../../components/onboarding/RevealScreen';
import { useOnboarding } from '../../contexts/onboarding-context';
import { buildPlan } from '../../lib/onboarding/onboarding-plan';
import { getAllLessons } from '../../data/lessons-data';
import { REVENUECAT_ENABLED } from '../../config/env';
import type { Domain } from '../../types/progress';

export default function Reveal() {
  const { confidence, examDate, experience, focusDomain, setDailyGoal, completeOnboarding } = useOnboarding();
  const [preparing, setPreparing] = useState(true);

  const plan = useMemo(
    () => buildPlan({
      confidence, examDate, experience,
      chosenDomain: (focusDomain as Domain) || 'process',
      totalLessons: getAllLessons().length, now: Date.now(),
    }),
    [confidence, examDate, experience, focusDomain],
  );

  useEffect(() => {
    setDailyGoal(plan.dailyGoal);
    const t = setTimeout(() => setPreparing(false), 2000);
    return () => clearTimeout(t);
  }, [plan.dailyGoal, setDailyGoal]);

  const readyByLabel = plan.readyByDate
    ? new Date(plan.readyByDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  async function onContinue() {
    if (REVENUECAT_ENABLED) {
      router.push('/paywall');
      return;
    }
    await completeOnboarding();
    router.replace('/');
  }

  return (
    <RevealScreen
      preparing={preparing}
      plan={plan}
      readyByLabel={readyByLabel}
      ctaLabel="Unlock my plan"
      onContinue={onContinue}
    />
  );
}
```

> **Note:** when `REVENUECAT_ENABLED` is true, `completeOnboarding()` must still run so the root gate routes to the app after the paywall closes. Handle this in Task 11 by calling `completeOnboarding()` before `router.push('/paywall')` (the paywall's own close handler already routes to `/`). Update `onContinue` to `await completeOnboarding();` before the `if` branch.

- [ ] **Step 6: Apply the Task-11 note now** — set `onContinue` to complete onboarding first:

```tsx
async function onContinue() {
  await completeOnboarding();
  if (REVENUECAT_ENABLED) router.push('/paywall');
  else router.replace('/');
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test -- domain-reveal`
Expected: PASS (2 tests).

- [ ] **Step 8: Commit**

```bash
git add "src/app/(onboarding)/domain.tsx" "src/components/onboarding/RevealScreen.tsx" "src/app/(onboarding)/reveal.tsx" "src/app/(onboarding)/__tests__/domain-reveal.test.tsx"
git commit -m "feat(onboarding): domain picker screen, reveal, paywall routing"
```

---

## Task 11: Remove old screens + full-flow integration test

**Files:**
- Delete: `src/app/(onboarding)/welcome.tsx`, `src/app/(onboarding)/goal-selection.tsx`, `src/app/(onboarding)/question-reminder.tsx`
- Modify: `src/app/(onboarding)/__tests__/onboarding-flow.test.tsx` (replace the `GoalSelection` reference)
- Test: `src/app/(onboarding)/__tests__/onboarding-flow.test.tsx`

**Interfaces:**
- Consumes: all screens from Tasks 7–10.

- [ ] **Step 1: Replace the stale flow test** so it exercises a current screen. Overwrite `src/app/(onboarding)/__tests__/onboarding-flow.test.tsx`:

```tsx
import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn() } }));

import ExamDate from '../exam-date';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

test('the funnel entry question renders its timeline options', async () => {
  const { getByText } = await render(<ExamDate />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/When’s your exam/i)).toBeTruthy());
});
```

- [ ] **Step 2: Delete the replaced screens**

```bash
git rm "src/app/(onboarding)/welcome.tsx" "src/app/(onboarding)/goal-selection.tsx" "src/app/(onboarding)/question-reminder.tsx"
```

- [ ] **Step 3: Verify nothing still imports the deleted screens**

Run: `grep -rn "welcome\|goal-selection\|question-reminder" src --include=*.tsx --include=*.ts | grep -v "__tests__"`
Expected: no references (the route files are gone; navigation now flows `splash → story-concept → … → reveal`).

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: PASS (all onboarding suites green; no broken imports).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(onboarding): remove legacy screens, refresh flow test"
```

---

## Self-Review (completed during planning)

- **Spec coverage:** 16-step flow (Tasks 7–10) ✓; fact library + time-sensitivity single-source (Task 2) ✓; `buildPlan` with `recommendedDomain`/`focusDomain`, derived `dailyGoal`, capped projection (Task 3) ✓; confidence recommends, domain decides (Tasks 6, 10) ✓; lesson-card reuse via existing thumbnail helper (Task 6) ✓; data-model additions incl. now-persisted `reminder` bugfix (Task 1) ✓; paywall slot behind `REVENUECAT_ENABLED`, no forced account (Task 10) ✓; progress bar pre-filled ~15% (Task 4) ✓; no new dependencies — preset chips + tap scale ✓.
- **Deferred from spec (intentional):** the loader is a 2s in-reveal "preparing" state (Task 10), not a separate screen — matches the revised spec. Character art on screen 3 / loader is copy-only here; wiring specific character images is a follow-up polish, not a blocker (no new assets required to ship).
- **Type consistency:** `Domain` lowercase throughout; `Experience`/`Reminder`/`ConfidenceDomain` exported from `onboarding-context` and reused by screens; `Plan`/`PlanInputs` consistent between Tasks 3, 10; `ChoiceOption` shared from `ChoiceScreen`.
