# Phase 4 Slice 1 — Lesson Player (single_select) + App Wiring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a real `single_select` lesson playable end-to-end in the monograph aesthetic — lessons list → lesson player (6 screen types, single_select questions, feedback modals) → wrap records a progress attempt — plus onboarding, home dashboard wiring, profile, and removal of the showcase `SessionContext`.

**Architecture:** The lesson player drives the already-ported `LessonProvider`/`lesson-reducer` (Phase 3) via the `useLesson()` helper API. A **screen registry** maps `screen_type → component`; a **question registry** maps `type → component` (only `SingleSelect` here; others render a graceful placeholder). The check-answer orchestration (correctness → point-multiplier scoring → success/retry/reveal) is a pure helper + a `useCheckAnswer` hook, kept out of the visual components so it's unit-testable. Domain data comes from Phase 2 content + Phase 3 contexts.

**Tech Stack:** Expo 56, expo-router, React Native, `@gorhom/bottom-sheet` (feedback modal), `@shopify/flash-list`, expo-image, Jest (`jest-expo`) + `@testing-library/react-native`.

**Reference (behavior only, re-skin in monograph):** PMP source at `/Users/hoangnamhai/Documents/workspace/pmp-prod-v3/src/components/lesson/**`.

## Global Constraints

- Expo SDK 56, `jest-expo`. Full suite: `npm test` (sets `TZ=UTC`); single file: `npx jest <path>`.
- **RNTL is async here:** `await render(...)` / `await renderHook(...)`; make those tests `async`. Throw-guards use the error-boundary pattern (see `src/contexts/__tests__/persistence-context.test.tsx`). Test style: plain `test(...)`, no `describe`.
- **Active brand = monograph.** Reuse existing primitives (`Txt`, `Button`, `Icon`, `Hairline`, `PressableFeedback`) and `QuizOption`; reuse `MonographTakeaways` for wrap takeaways. Do not build elite variants. `TOKENS` from `src/theme/tokens.ts` for colors/spacing.
- Domain access: lesson state via `useLesson()` (`src/contexts/lesson-context.tsx`); progress via `useProgress()` (`src/contexts/progress-context.tsx`); daily-limit via `useLessonLimit()` (`src/hooks/use-lesson-limit.ts`); settings via `useSettings()`; onboarding via `useOnboarding()`; content via `getLessonData`/`getAllLessons`/`lessonsIndex`/`findLesson` (`src/data/lessons-data.ts`) and `getLessonImage`/`getLessonThumbnail` (`src/data/lesson-images.ts`).
- `useLesson()` helpers available: `loadLesson(id)`, `exitLesson()`, `nextScreen()`, `goToScreen(i)`, `setCurrentQuestionIndex(i)`, `selectAnswer(qid, optId)`, `incrementAttempt(qid): number`, `addDisabledChoice(qid, optId)`, `recordQuestionScore(qid, pts)`, `markQuestionCompleted(qid)`, `showSuccessModal(data)`, `showRetryModal(data)`, `showRevealModal(data)`, `closeModal()`, `getAttemptCount(qid)`, `isChoiceDisabled(qid, optId)`, `isQuestionCompleted(qid)`, plus `state` and `currentScreen`. Reducer constants `MAX_ATTEMPTS` (=3) and `POINT_MULTIPLIERS` are exported from `src/contexts/reducers/lesson-reducer.ts`.
- **Scope:** only `single_select` interactive (multi/drag → placeholder; `text_input` skipped). Do NOT add `expo-av`/`expo-audio`, Clerk, RevenueCat, notifications, Sentry (Phase 5).
- **Lesson types** (from `src/types/lesson.ts`): `SingleSelectQuestion` fields `q_id`, `question`, `points`, `options: { id, text, correct, whyWrong? }[]`, `explanation?`, `retryHint?`, `correctFeedback?`. Confirm exact field names in that file before relying on them.
- Test wrapper for anything using the domain: wrap in `<PersistenceProvider value={createInMemoryPersistence()}>` + the needed providers.

---

### Task 1: Scoring + correctness helpers (pure)

**Files:**
- Create: `src/components/lesson/scoring.ts`
- Test: `src/components/lesson/__tests__/scoring.test.ts`

**Interfaces:**
- Consumes: `POINT_MULTIPLIERS`, `MAX_ATTEMPTS` from `../../contexts/reducers/lesson-reducer`; `SingleSelectQuestion` from `../../types/lesson`.
- Produces:
  - `isSingleSelectCorrect(question: SingleSelectQuestion, optionId: string | undefined): boolean`
  - `pointsForAttempt(basePoints: number, attempt: number): number` — `round(basePoints * (POINT_MULTIPLIERS[attempt] ?? 0))`
  - `correctOptionOf(question: SingleSelectQuestion): { id: string; text: string } | undefined`

- [ ] **Step 1: Write the failing test**

Create `src/components/lesson/__tests__/scoring.test.ts`:
```typescript
import { isSingleSelectCorrect, pointsForAttempt, correctOptionOf } from '../scoring';
import type { SingleSelectQuestion } from '../../../types/lesson';

const q = {
  type: 'single_select',
  q_id: 'q1',
  question: 'Pick',
  points: 100,
  options: [
    { id: 'a', text: 'A', correct: false },
    { id: 'b', text: 'B', correct: true },
  ],
} as SingleSelectQuestion;

test('isSingleSelectCorrect matches the correct option id', () => {
  expect(isSingleSelectCorrect(q, 'b')).toBe(true);
  expect(isSingleSelectCorrect(q, 'a')).toBe(false);
  expect(isSingleSelectCorrect(q, undefined)).toBe(false);
});

test('pointsForAttempt applies the multiplier ladder', () => {
  expect(pointsForAttempt(100, 1)).toBe(100);
  expect(pointsForAttempt(100, 2)).toBe(70);
  expect(pointsForAttempt(100, 3)).toBe(50);
  expect(pointsForAttempt(100, 4)).toBe(0);
});

test('correctOptionOf returns the correct option', () => {
  expect(correctOptionOf(q)?.id).toBe('b');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest src/components/lesson/__tests__/scoring.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement**

Create `src/components/lesson/scoring.ts`:
```typescript
import { POINT_MULTIPLIERS } from '../../contexts/reducers/lesson-reducer';
import type { SingleSelectQuestion } from '../../types/lesson';

export function correctOptionOf(question: SingleSelectQuestion) {
  return question.options.find((o) => o.correct);
}

export function isSingleSelectCorrect(
  question: SingleSelectQuestion,
  optionId: string | undefined,
): boolean {
  if (!optionId) return false;
  return correctOptionOf(question)?.id === optionId;
}

export function pointsForAttempt(basePoints: number, attempt: number): number {
  return Math.round(basePoints * (POINT_MULTIPLIERS[attempt] ?? 0));
}
```

> Before implementing, open `src/types/lesson.ts` and confirm `SingleSelectQuestion` uses `q_id`, `points`, and `options: { id, text, correct }[]`. If a field name differs, use the real one consistently across all tasks.

- [ ] **Step 4: Run to verify it passes**

Run: `npx jest src/components/lesson/__tests__/scoring.test.ts` → PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/lesson/scoring.ts src/components/lesson/__tests__/scoring.test.ts
git commit -m "feat(lesson): pure scoring + correctness helpers"
```

---

### Task 2: `useCheckAnswer` orchestration hook (single_select)

**Files:**
- Create: `src/components/lesson/use-check-answer.ts`
- Test: `src/components/lesson/__tests__/use-check-answer.test.tsx`

**Interfaces:**
- Consumes: `useLesson()`, scoring helpers (Task 1), `MAX_ATTEMPTS`.
- Produces: `useCheckAnswer(): { checkAnswer: (question, isLastQuestion: boolean) => void }`. For a `single_select` question it reads the selected answer from `state.answers[q_id]`, increments the attempt, and on correct → `recordQuestionScore` + `markQuestionCompleted` + `showSuccessModal`; on wrong & attempt < MAX → `addDisabledChoice` + `showRetryModal`; on wrong & attempt ≥ MAX → `recordQuestionScore(q_id, 0)` + `markQuestionCompleted` + `showRevealModal`. (Non-single_select types are no-ops here — extended in Slices 2–3.)

- [ ] **Step 1: Write the failing test**

Create `src/components/lesson/__tests__/use-check-answer.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { LessonProvider, useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import type { LessonData } from '../../../types/lesson';

const lesson = {
  lessonId: 'T1', lessonTitle: 'T', courseId: 'T1', courseName: 'T', pathId: 'T',
  pathName: 'T', domain: 'Process', estimatedDuration: 1,
  scoring: { totalPoints: 100, challengePoints: 100, transferPoints: 0, practicePoints: 0, masteryThreshold: 0, passingThreshold: 0 },
  learningObjectives: [], characters: [],
  screens: [
    { screen_number: 1, screen_type: 'challenge', interaction: { type: 'x', title: 't', description: 'd',
      questions: [{ type: 'single_select', q_id: 'q1', question: 'Pick', points: 100,
        options: [{ id: 'a', text: 'A', correct: false }, { id: 'b', text: 'B', correct: true }] }] } },
  ],
} as unknown as LessonData;

function harness() {
  return renderHook(
    () => ({ lesson: useLesson(), check: useCheckAnswer() }),
    { wrapper: ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider> },
  );
}

test('correct single_select answer scores full points and shows success', async () => {
  const { result } = await harness();
  await act(async () => { await result.current.lesson.loadLesson('T1-unused'); });
  // loadLesson calls getLessonData; for the test inject directly via reducer dispatch path:
  // simpler: drive through context helpers using the loaded real lesson is out of scope here,
  // so push our test lesson through the public API:
});
```
> NOTE: `loadLesson(id)` fetches via `getLessonData`. To test against the fixture above without a real lesson id, the implementer should expose the lesson through the provider by either (a) using a real `single_select`-only lesson id from the bundled content and asserting against its first question, or (b) adding a tiny test-only seam. PREFER (a): replace the fixture with a real lesson. Find a `single_select`-only lesson id by running:
> `for f in assets/data/*.json; do id=$(basename "$f" .json); if [ "$id" != "lessons-index" ] && ! grep -q '"type": "multi_select"\|"type": "drag_drop"' "$f"; then echo "$id"; fi; done | head`
> Use that id, load it, navigate to its first `challenge` question, `selectAnswer(q_id, correctOptionId)`, then `checkAnswer(question, false)` and assert `state.questionScores[q_id] === question.points` and `state.modalType === 'success'`. Write three tests: correct→success+full points; first wrong→retry+disabled choice; wrong to MAX_ATTEMPTS→reveal+zero score. Use the real question's option ids (read them from `getLessonData(id)`).

- [ ] **Step 2: Run to verify it fails** — `npx jest src/components/lesson/__tests__/use-check-answer.test.tsx` → FAIL (module missing).

- [ ] **Step 3: Implement**

Create `src/components/lesson/use-check-answer.ts`:
```typescript
import { useCallback } from 'react';
import { useLesson } from '../../contexts/lesson-context';
import { MAX_ATTEMPTS } from '../../contexts/reducers/lesson-reducer';
import { isSingleSelectCorrect, pointsForAttempt, correctOptionOf } from './scoring';
import type { Question } from '../../types/lesson';

export function useCheckAnswer() {
  const {
    state, incrementAttempt, addDisabledChoice, recordQuestionScore,
    markQuestionCompleted, showSuccessModal, showRetryModal, showRevealModal,
  } = useLesson();

  const checkAnswer = useCallback(
    (question: Question, isLastQuestion: boolean) => {
      if (question.type !== 'single_select') return; // multi/drag: Slices 2-3
      const qid = question.q_id;
      const selected = state.answers[qid];
      const attempt = incrementAttempt(qid);
      const correct = isSingleSelectCorrect(question, selected);
      if (correct) {
        const pts = pointsForAttempt(question.points, attempt);
        recordQuestionScore(qid, pts);
        markQuestionCompleted(qid);
        showSuccessModal({ points: pts, explanation: question.explanation, isLastQuestion });
      } else if (attempt < MAX_ATTEMPTS) {
        if (selected) addDisabledChoice(qid, selected);
        showRetryModal({ hint: question.retryHint });
      } else {
        recordQuestionScore(qid, 0);
        markQuestionCompleted(qid);
        showRevealModal({
          correctAnswer: correctOptionOf(question)?.text,
          explanation: question.explanation,
          isLastQuestion,
        });
      }
    },
    [state.answers, incrementAttempt, addDisabledChoice, recordQuestionScore, markQuestionCompleted, showSuccessModal, showRetryModal, showRevealModal],
  );

  return { checkAnswer };
}
```
> Confirm `ModalData` accepts `points`/`explanation`/`hint`/`correctAnswer`/`isLastQuestion` (it does, per `src/types/lesson.ts`). Adjust field names if the real type differs.

- [ ] **Step 4: Run to verify it passes** — PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/lesson/use-check-answer.ts src/components/lesson/__tests__/use-check-answer.test.tsx
git commit -m "feat(lesson): single_select check-answer orchestration hook"
```

---

### Task 3: SingleSelect question component + question registry

**Files:**
- Create: `src/components/lesson/questions/SingleSelect.tsx`
- Create: `src/components/lesson/questions/QuestionView.tsx` (the registry/dispatcher)
- Test: `src/components/lesson/questions/__tests__/QuestionView.test.tsx`

**Interfaces:**
- Consumes: `useLesson()` (`selectAnswer`, `isChoiceDisabled`, `isQuestionCompleted`, `state.answers`), `QuizOption` (`../../primitives`… actually `../../quiz/QuizOption`), `useCheckAnswer` (Task 2), `Button`, `Txt`.
- Produces:
  - `SingleSelect({ question, isLastQuestion }: { question: SingleSelectQuestion; isLastQuestion: boolean })` — renders the scenario/prompt + options (via `QuizOption`, `brand="monograph"`); tapping an option calls `selectAnswer`; a "Check Answer" `Button` calls `useCheckAnswer().checkAnswer(question, isLastQuestion)`; disabled options reflect `isChoiceDisabled`.
  - `QuestionView({ question, isLastQuestion })` — switches on `question.type`: `single_select` → `SingleSelect`; otherwise a monograph "This question type isn't supported yet" placeholder card.

- [ ] **Step 1: Write the failing test**

Create `src/components/lesson/questions/__tests__/QuestionView.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LessonProvider } from '../../../../contexts/lesson-context';
import { QuestionView } from '../QuestionView';
import type { SingleSelectQuestion } from '../../../../types/lesson';

const q = {
  type: 'single_select', q_id: 'q1', question: 'Classify this work', points: 100,
  options: [{ id: 'a', text: 'Project', correct: true }, { id: 'b', text: 'Operations', correct: false }],
} as SingleSelectQuestion;

const wrap = ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider>;

test('renders single_select options and a check button', async () => {
  const { getByText } = await render(<QuestionView question={q} isLastQuestion={false} />, { wrapper: wrap });
  expect(getByText('Project')).toBeTruthy();
  expect(getByText('Operations')).toBeTruthy();
  expect(getByText(/check/i)).toBeTruthy();
});

test('renders a placeholder for an unsupported type', async () => {
  const dq = { type: 'drag_drop', q_id: 'd1', question: 'x', points: 10, chips: [], dropZones: [] } as any;
  const { getByText } = await render(<QuestionView question={dq} isLastQuestion={false} />, { wrapper: wrap });
  expect(getByText(/isn't supported yet|not supported/i)).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL (modules missing).

- [ ] **Step 3: Implement**

Create `src/components/lesson/questions/SingleSelect.tsx`:
```tsx
import React from 'react';
import { View } from 'react-native';
import { useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import { QuizOption } from '../../quiz/QuizOption';
import { Button } from '../../primitives/Button';
import { Txt } from '../../primitives/Txt';
import type { SingleSelectQuestion } from '../../../types/lesson';

export function SingleSelect({ question, isLastQuestion }: { question: SingleSelectQuestion; isLastQuestion: boolean }) {
  const { state, selectAnswer, isChoiceDisabled, isQuestionCompleted } = useLesson();
  const { checkAnswer } = useCheckAnswer();
  const selected = state.answers[question.q_id] ?? null;
  const done = isQuestionCompleted(question.q_id);

  return (
    <View style={{ gap: 16 }}>
      <Txt variant="display">{question.question}</Txt>
      <View style={{ gap: 12 }}>
        {question.options.map((opt) => (
          <View key={opt.id} pointerEvents={isChoiceDisabled(question.q_id, opt.id) || done ? 'none' : 'auto'}>
            <QuizOption
              option={{ key: opt.id, label: opt.text }}
              selected={selected === opt.id}
              brand="monograph"
              onPress={() => selectAnswer(question.q_id, opt.id)}
            />
          </View>
        ))}
      </View>
      {!done && (
        <Button label="Check Answer" onPress={() => checkAnswer(question, isLastQuestion)} />
      )}
    </View>
  );
}
```

Create `src/components/lesson/questions/QuestionView.tsx`:
```tsx
import React from 'react';
import { View } from 'react-native';
import { Txt } from '../../primitives/Txt';
import { SingleSelect } from './SingleSelect';
import type { Question } from '../../../types/lesson';

export function QuestionView({ question, isLastQuestion }: { question: Question; isLastQuestion: boolean }) {
  if (question.type === 'single_select') {
    return <SingleSelect question={question} isLastQuestion={isLastQuestion} />;
  }
  return (
    <View style={{ padding: 16 }}>
      <Txt variant="body">This question type isn't supported yet.</Txt>
    </View>
  );
}
```

- [ ] **Step 4: Run to verify it passes** — PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/lesson/questions src/components/lesson/questions/__tests__
git commit -m "feat(lesson): SingleSelect question + question registry"
```

---

### Task 4: FeedbackModal (success / retry / reveal)

**Files:**
- Create: `src/components/lesson/FeedbackModal.tsx`
- Test: `src/components/lesson/__tests__/FeedbackModal.test.tsx`

**Interfaces:**
- Consumes: `useLesson()` (`state.modalVisible`, `state.modalType`, `state.modalData`, `closeModal`), `@gorhom/bottom-sheet` (already used by `FeedbackSheet`), `Txt`, `Button`.
- Produces: `FeedbackModal({ onSuccessNext, onRetry, onReveal }: { onSuccessNext: () => void; onRetry: () => void; onReveal: () => void })` — renders the current modal from lesson state; the action button (label per type) calls the matching callback then `closeModal()`.

- [ ] **Step 1: Write the failing test**

Create `src/components/lesson/__tests__/FeedbackModal.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LessonProvider, useLesson } from '../../../contexts/lesson-context';
import { FeedbackModal } from '../FeedbackModal';

function Rig({ onNext }: { onNext: () => void }) {
  const { showSuccessModal } = useLesson();
  return (
    <>
      <FeedbackModal onSuccessNext={onNext} onRetry={() => {}} onReveal={() => {}} />
      <Txt onPress={() => showSuccessModal({ points: 10, explanation: 'Because' })}>trigger</Txt>
    </>
  );
}
import { Txt } from '../../primitives/Txt';

test('success modal shows explanation and advances on action', async () => {
  const onNext = jest.fn();
  const { getByText } = await render(<Rig onNext={onNext} />, {
    wrapper: ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider>,
  });
  fireEvent.press(getByText('trigger'));
  await waitFor(() => expect(getByText('Because')).toBeTruthy());
  fireEvent.press(getByText(/continue|next/i));
  expect(onNext).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement** — render a bottom sheet (follow the existing `src/components/feedback/FeedbackSheet.tsx` pattern for `@gorhom/bottom-sheet` usage). When `state.modalVisible`, present `state.modalData`: success shows `points` + `explanation` with a "Continue" button → `onSuccessNext()`; retry shows `hint` with a "Try Again" button → `onRetry()`; reveal shows `correctAnswer` + `explanation` with a "Continue" button → `onReveal()`. Each handler calls the callback then `closeModal()`. Read `src/components/feedback/FeedbackSheet.tsx` first to match the sheet API used in this repo.

- [ ] **Step 4: Run to verify it passes** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/lesson/FeedbackModal.tsx src/components/lesson/__tests__/FeedbackModal.test.tsx
git commit -m "feat(lesson): feedback modal (success/retry/reveal)"
```

---

### Task 5: Content screens — Hook, Reason, Wrap

**Files:**
- Create: `src/components/lesson/screens/HookScreen.tsx`, `ReasonScreen.tsx`, `WrapScreen.tsx`
- Test: `src/components/lesson/screens/__tests__/content-screens.test.tsx`

**Interfaces:**
- Consumes: `useLesson()` (`state.lessonData`, `nextScreen`), `useProgress()` (`recordLessonAttempt`), `useLessonLimit()` (`consumeLesson`), `MonographTakeaways`, primitives, `getLessonImage`.
- Produces: each screen takes `{ screen }: { screen: LessonScreen }`.
  - `HookScreen` — renders `content.headline`/`content.intro`/`content.learning_hook`; a `Button` "Continue" → `nextScreen()`.
  - `ReasonScreen` — renders `microTeach.title` + the first tab's content (tabs optional in Slice 1); "Continue" → `nextScreen()`.
  - `WrapScreen` — renders `content.title`/`content.summary` + `content.key_takeaways` via `MonographTakeaways`; on mount (once, via a ref) computes score from `state.questionScores`/`state.lessonData.scoring.totalPoints`, maps `lessonData.domain` → progress `Domain`, calls `recordLessonAttempt(...)` + `consumeLesson()`. A "Finish" `Button` calls the `onFinish` prop (player navigates back).

- [ ] **Step 1: Write the failing test**

Create `src/components/lesson/screens/__tests__/content-screens.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../../services/persistence';
import { PersistenceProvider } from '../../../../contexts/persistence-context';
import { ProgressProvider } from '../../../../contexts/progress-context';
import { SubscriptionProvider } from '../../../../contexts/subscription-context';
import { LessonProvider, useLesson } from '../../../../contexts/lesson-context';
import { WrapScreen } from '../WrapScreen';
import { getLessonData } from '../../../../data/lessons-data';

function providers(persistence = createInMemoryPersistence()) {
  return ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}>
      <SubscriptionProvider>
        <ProgressProvider>
          <LessonProvider>{children}</LessonProvider>
        </ProgressProvider>
      </SubscriptionProvider>
    </PersistenceProvider>
  );
}

// Loads a real lesson, jumps to wrap, asserts the attempt is recorded.
function WrapHarness({ onReady }: { onReady: (count: () => Promise<number>) => void }) {
  const { loadLesson, state } = useLesson();
  React.useEffect(() => { loadLesson('A1L1'); }, [loadLesson]);
  if (!state.lessonData) return null;
  const wrap = state.lessonData.screens.find((s) => s.screen_type === 'wrap')!;
  return <WrapScreen screen={wrap} onFinish={() => {}} />;
}

test('wrap screen records a progress attempt on mount', async () => {
  const persistence = createInMemoryPersistence();
  await render(<WrapHarness onReady={() => {}} />, { wrapper: providers(persistence) });
  await waitFor(async () => expect(await persistence.attempts.count()).toBe(1));
});
```
> If `A1L1`'s wrap screen needs `questionScores` populated to compute a score, that's fine — score 0 is acceptable; the test asserts an attempt is recorded, not its value. The `onFinish` prop is a no-op here.

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement** the three screens. For `WrapScreen`, guard the record with a `useRef(false)` so it runs once; derive `score = Math.min(100, Math.round((sum(questionScores) / (lessonData.scoring.totalPoints || 1)) * 100))`, `questionCount = Object.keys(state.questionScores).length`, and map domain: `{'People':'people','Process':'process','Business':'business','Business Environment':'business'}[lessonData.domain] ?? 'process'`. Use `MonographTakeaways` for `key_takeaways` (map each takeaway string into the shape it expects — read `src/data/takeaways.ts` + `MonographTakeaways.tsx` for the prop shape; if it's tightly coupled to `MONOGRAPH_TAKEAWAYS`, render a simple monograph list of `key_takeaways` instead). Keep Hook/Reason minimal and content-driven.

- [ ] **Step 4: Run to verify it passes** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/lesson/screens/HookScreen.tsx src/components/lesson/screens/ReasonScreen.tsx src/components/lesson/screens/WrapScreen.tsx src/components/lesson/screens/__tests__/content-screens.test.tsx
git commit -m "feat(lesson): hook, reason, wrap content screens"
```

---

### Task 6: Question screens — Challenge, Practice, Transfer

**Files:**
- Create: `src/components/lesson/screens/ChallengeScreen.tsx`, `PracticeScreen.tsx`, `TransferScreen.tsx`
- Create: `src/components/lesson/screens/useQuestionScreen.ts` (shared question-iteration hook)
- Test: `src/components/lesson/screens/__tests__/question-screens.test.tsx`

**Interfaces:**
- Consumes: `useLesson()` (`state.currentQuestionIndex`, `setCurrentQuestionIndex`, `nextScreen`, `state.modalData`), `QuestionView` (Task 3), `FeedbackModal` (Task 4).
- Produces:
  - `useQuestionScreen(questions): { current, index, isLast, advance }` — `advance()` either `setCurrentQuestionIndex(index+1)` or, when on the last question, `nextScreen()`.
  - `ChallengeScreen({ screen })` — reads `screen.interaction.questions`; renders `QuestionView` for the current question + a `FeedbackModal` whose `onSuccessNext`/`onReveal` call `advance()` and `onRetry` is a no-op (stays on the question; disabled choice already set).
  - `PracticeScreen({ screen })` — same pattern over `screen.content.questions` (timer optional/omitted in Slice 1).
  - `TransferScreen({ screen })` — an intro phase (render `content.scenario` + a "Start" button) then the same question flow over `content.questions`.

- [ ] **Step 1: Write the failing test**

Create `src/components/lesson/screens/__tests__/question-screens.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LessonProvider, useLesson } from '../../../../contexts/lesson-context';
import { ChallengeScreen } from '../ChallengeScreen';
import { getLessonData } from '../../../../data/lessons-data';

function Harness({ lessonId }: { lessonId: string }) {
  const { loadLesson, state, currentScreen } = useLesson();
  React.useEffect(() => { loadLesson(lessonId); }, [loadLesson, lessonId]);
  if (!state.lessonData) return null;
  const challenge = state.lessonData.screens.find((s) => s.screen_type === 'challenge')!;
  return <ChallengeScreen screen={challenge} />;
}

test('challenge screen renders the first question of a real lesson', async () => {
  // Use a single_select-only lesson id discovered earlier; replace SS_LESSON below.
  const { getByText } = await render(<Harness lessonId="A1L1" />, {
    wrapper: ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider>,
  });
  await waitFor(() => expect(getByText(/check/i)).toBeTruthy());
});
```
> Use a real `single_select`-only lesson id (the discovery command from Task 2). If `A1L1`'s challenge contains a non-single_select question, the placeholder renders instead — pick an id whose challenge first question is `single_select` so the check button assertion holds.

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement** the shared hook and three screens per the interfaces above. Drive everything through `useLesson()` helpers and `QuestionView`/`FeedbackModal`; no business logic beyond reading `screen.*.questions`, tracking the current index, and advancing.

- [ ] **Step 4: Run to verify it passes** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/lesson/screens/ChallengeScreen.tsx src/components/lesson/screens/PracticeScreen.tsx src/components/lesson/screens/TransferScreen.tsx src/components/lesson/screens/useQuestionScreen.ts src/components/lesson/screens/__tests__/question-screens.test.tsx
git commit -m "feat(lesson): challenge, practice, transfer question screens"
```

---

### Task 7: LessonPlayer + screen registry + route

**Files:**
- Create: `src/components/lesson/LessonPlayer.tsx`
- Create: `src/app/lesson/[id].tsx`
- Test: `src/components/lesson/__tests__/LessonPlayer.test.tsx`

**Interfaces:**
- Consumes: `useLesson()` (`loadLesson`, `exitLesson`, `state`, `currentScreen`), all screen components (Tasks 5–6).
- Produces:
  - `LessonPlayer({ lessonId }: { lessonId: string })` — on mount `loadLesson(lessonId)`; on unmount `exitLesson()`. Renders `currentScreen` via a registry `{ hook, challenge, reason, practice, transfer, wrap }`; unknown type → a safe fallback. Passes `onFinish={() => router.back()}` to `WrapScreen`.
  - `src/app/lesson/[id].tsx` — reads `useLocalSearchParams()` `id` and renders `<LessonPlayer lessonId={id} />`.

- [ ] **Step 1: Write the failing test**

Create `src/components/lesson/__tests__/LessonPlayer.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { ProgressProvider } from '../../../contexts/progress-context';
import { SubscriptionProvider } from '../../../contexts/subscription-context';
import { LessonProvider } from '../../../contexts/lesson-context';
import { LessonPlayer } from '../LessonPlayer';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}>
    <SubscriptionProvider><ProgressProvider><LessonProvider>{children}</LessonProvider></ProgressProvider></SubscriptionProvider>
  </PersistenceProvider>
);

test('LessonPlayer loads a lesson and renders its first (hook) screen', async () => {
  const { queryByText } = await render(<LessonPlayer lessonId="A1L1" />, { wrapper: wrap });
  // A1L1 screen 1 is a hook; assert some hook headline text renders (non-empty screen).
  await waitFor(() => expect(queryByText(/continue/i)).toBeTruthy());
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement** `LessonPlayer` (registry switch + load/exit effect) and the route file. For the route, `import { useLocalSearchParams } from 'expo-router'`.

- [ ] **Step 4: Run to verify it passes** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/lesson/LessonPlayer.tsx src/app/lesson/[id].tsx src/components/lesson/__tests__/LessonPlayer.test.tsx
git commit -m "feat(lesson): LessonPlayer, screen registry, and route"
```

---

### Task 8: Lessons list screen

**Files:**
- Create: `src/components/lessons/LessonsList.tsx`
- Modify/Create: `src/app/(tabs)/lessons.tsx` (rename of `study.tsx`)
- Test: `src/components/lessons/__tests__/LessonsList.test.tsx`

**Interfaces:**
- Consumes: `lessonsIndex` / `getAllLessons` (`src/data/lessons-data`), `getLessonThumbnail`, `useProgress()` (completion via `progress.recentAttempts`), `router`.
- Produces: `LessonsList()` — sections per `lessonsIndex` module; each lesson row shows title, domain, duration, thumbnail, and a "Done" badge when `progress.recentAttempts.some(a => a.lessonId === lesson.id)`; tapping a row calls `router.push('/lesson/' + lesson.id)`.

- [ ] **Step 1: Write the failing test**

Create `src/components/lessons/__tests__/LessonsList.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { ProgressProvider } from '../../../contexts/progress-context';
import { LessonsList } from '../LessonsList';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}>
    <ProgressProvider>{children}</ProgressProvider>
  </PersistenceProvider>
);

test('renders a known lesson title from the bundled index', async () => {
  const { getByText } = await render(<LessonsList />, { wrapper: wrap });
  await waitFor(() => expect(getByText('What is Project Management?')).toBeTruthy());
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement** `LessonsList` (FlashList or ScrollView of sections, monograph cards reusing primitives) and `src/app/(tabs)/lessons.tsx` rendering `<LessonsList />`. Delete `src/app/(tabs)/study.tsx` if renaming (the tab is registered as `lessons` in Task 11).

- [ ] **Step 4: Run to verify it passes** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/lessons src/app/(tabs)/lessons.tsx
git rm src/app/(tabs)/study.tsx
git commit -m "feat(lessons): lessons list screen grouped by module"
```

---

### Task 9: Home dashboard wired to progress

**Files:**
- Modify: `src/components/dashboard/MonographDashboard.tsx`
- Modify: `src/components/dashboard/DashboardScreen.tsx` (drop the `onJoinArena` sample prop if unused; keep monograph path)
- Modify: `src/app/(tabs)/home.tsx`
- Test: `src/components/dashboard/__tests__/dashboard-progress.test.tsx`

**Interfaces:**
- Consumes: `useProgress()` (`getCurrentStreak`, `getCurrentMilestone`, `progress.domainProgress`, `progress.recentAttempts`), `getAllLessons` (next-lesson CTA), `router`.
- Produces: `MonographDashboard` no longer reads `useSession`; it reads `useProgress()`. The three "arena" rows come from `progress.domainProgress` (people/process/business → completed/total → pct). The streak header uses `getCurrentStreak()`. "Start studying" navigates to `/lesson/<first incomplete lesson id>` (or `/(tabs)/lessons`).

- [ ] **Step 1: Write the failing test**

Create `src/components/dashboard/__tests__/dashboard-progress.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { ProgressProvider, useProgress } from '../../../contexts/progress-context';
import { SubscriptionProvider } from '../../../contexts/subscription-context';
import { MonographDashboard } from '../MonographDashboard';

const wrap = (p = createInMemoryPersistence()) => ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={p}><SubscriptionProvider><ProgressProvider>{children}</ProgressProvider></SubscriptionProvider></PersistenceProvider>
);

test('dashboard renders domain progress derived from useProgress', async () => {
  const { getByText } = await render(<MonographDashboard onStartStudy={() => {}} />, { wrapper: wrap() });
  await waitFor(() => expect(getByText(/people/i)).toBeTruthy());
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL (it currently reads `useSession` and shows hardcoded arenas; the test runs without a SessionProvider so it must already be on `useProgress`).

- [ ] **Step 3: Implement** — replace `useSession` with `useProgress` in `MonographDashboard`; compute the three domain rows from `progress.domainProgress`; wire `onStartStudy` through. Update `DashboardScreen`/`home.tsx` props accordingly (`home.tsx` passes `onStartStudy={() => router.push('/(tabs)/lessons')}`). Keep monograph styling.

- [ ] **Step 4: Run to verify it passes** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard src/app/(tabs)/home.tsx src/components/dashboard/__tests__/dashboard-progress.test.tsx
git commit -m "feat(home): wire MonographDashboard to progress"
```

---

### Task 10: Onboarding flow

**Files:**
- Create: `src/app/(onboarding)/_layout.tsx`, `index.tsx` (splash), `welcome.tsx`, `goal-selection.tsx`, `question-reminder.tsx`
- Modify: `src/app/index.tsx` (redirect based on onboarding)
- Test: `src/app/(onboarding)/__tests__/onboarding-flow.test.tsx`

**Interfaces:**
- Consumes: `useOnboarding()` (`hasCompletedOnboarding`, `isLoading`, `setDailyGoal`, `completeOnboarding`), `router`, `useSettings`/notifications optional (reminder screen can store reminder time later — Slice 1 just calls `completeOnboarding`).
- Produces: a Stack of 4 screens. `goal-selection` offers 1/2/3 lessons → `setDailyGoal`. `question-reminder` offers reminder options then `completeOnboarding()` → navigate to `/(tabs)/home`. `src/app/index.tsx` redirects to `/(onboarding)` when `!hasCompletedOnboarding` (after `isLoading` resolves), else `/(tabs)/home`.

- [ ] **Step 1: Write the failing test**

Create `src/app/(onboarding)/__tests__/onboarding-flow.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';
import GoalSelection from '../goal-selection';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn() }, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

test('goal selection renders the daily-goal options', async () => {
  const { getByText } = await render(<GoalSelection />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/lesson/i)).toBeTruthy());
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement** the 4 onboarding screens (monograph styling, reuse `MonographIntro`'s patterns/primitives) and the `index.tsx` redirect. Keep copy simple; the reminder screen calls `completeOnboarding()` then `router.replace('/(tabs)/home')`.

- [ ] **Step 4: Run to verify it passes** — PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/(onboarding) src/app/index.tsx src/app/(onboarding)/__tests__
git commit -m "feat(onboarding): 4-step onboarding flow + index redirect"
```

---

### Task 11: Profile, tab layout, SessionContext removal, regression gate

**Files:**
- Create: `src/app/(tabs)/profile.tsx`
- Modify: `src/app/(tabs)/_layout.tsx` (tabs: home / lessons / profile; remove metrics + BrandSwitch header)
- Delete: `src/app/(tabs)/metrics.tsx`, `src/contexts/session-context.tsx`, `src/contexts/session-reducer.ts`, `src/components/quiz/QuizScreen.tsx`, their tests, and the `SessionProvider` from `src/app/_layout.tsx`
- Test: `src/app/(tabs)/__tests__/profile.test.tsx`

**Interfaces:**
- Consumes: `useSettings()` (toggles), `useSubscription()` (status), `SHOW_DEV_OPTIONS` (`src/config/feature-flags`), reset methods (`useOnboarding().resetOnboarding`, `useProgress().resetProgress`, `useLessonLimit().resetDailyLimit`).
- Produces: `profile.tsx` — settings toggles (haptics/sounds/notifications), subscription status line, dev-options section gated by `SHOW_DEV_OPTIONS`. Tab layout has exactly home/lessons/profile.

- [ ] **Step 1: Write the failing test**

Create `src/app/(tabs)/__tests__/profile.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { SettingsProvider } from '../../../contexts/settings-context';
import { SubscriptionProvider } from '../../../contexts/subscription-context';
import Profile from '../profile';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><SubscriptionProvider><SettingsProvider>{children}</SettingsProvider></SubscriptionProvider></PersistenceProvider>
);

test('profile shows a settings control', async () => {
  const { getByText } = await render(<Profile />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/haptics|sounds|notifications/i)).toBeTruthy());
});
```

- [ ] **Step 2: Run to verify it fails** — FAIL.

- [ ] **Step 3: Implement** profile, update the tab layout (remove the metrics `Tabs.Screen` and the `BrandSwitch` header; tabs = home/lessons/profile), delete `session-context.tsx`/`session-reducer.ts`/their tests/the showcase `QuizScreen.tsx`/its tests/`metrics.tsx`, and remove `SessionProvider` (import + JSX) from `src/app/_layout.tsx`. Any other file importing `useSession` must be rewired or deleted (the only consumers were `MonographDashboard` (done in Task 9), `EliteDashboard` (inactive — leave or stub its `useSession` with hardcoded data since it's not rendered), `study.tsx` (deleted Task 8), and the showcase `QuizScreen`). For `EliteDashboard`, replace `useSession()` with a local constant so the file still compiles without `SessionContext`.

- [ ] **Step 4: Full regression gate**

Run: `npm test`
Expected: ALL suites green. Any test that imported `useSession`/`session-reducer`/the showcase `QuizScreen` is deleted or updated (do not weaken assertions). Run `npx tsc --noEmit` and confirm it is clean (no dangling `session-context` imports).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(app): profile, 3-tab layout, remove SessionContext + showcase"
```

---

## Self-Review

**Spec coverage (Phase 4 design → Slice 1 scope):**
- Routing/onboarding → Tasks 10, 11 ✓ ; lessons list → Task 8 ✓ ; lesson player (6 screens + single_select + modal + wrap→progress) → Tasks 1–7 ✓ ; home wiring → Task 9 ✓ ; profile → Task 11 ✓ ; SessionContext removal → Task 11 ✓.
- Graceful placeholder for multi/drag → Task 3 ✓ ; `text_input` skipped ✓.

**Placeholder scan:** the only deliberately-deferred UI is the unsupported-question placeholder (a real rendered component, not a stub) and timer-on-practice (omitted, noted). No "TODO/TBD" left as work-in-disguise.

**Type consistency:** `useLesson()` helper names match the Phase-3 ported context (verified). `recordLessonAttempt` arg shape (`lessonId/lessonTitle/questionCount/score/domain`) matches `progress-context`. Question registry/`checkAnswer` only branch on `single_select`; multi/drag are explicit no-ops/placeholders. Several tasks instruct the implementer to confirm exact `src/types/lesson.ts` field names (`q_id`/`options[].id`/`ModalData` fields) before relying on them — these are the only assumed names and are flagged at each use.

**Risks:** Tasks 5–7 assert against the real bundled lesson `A1L1`; if `A1L1`'s first challenge question is not `single_select`, the check-button assertions need a `single_select`-only lesson id (discovery command provided in Task 2). The `MonographTakeaways` reuse may be too coupled to its hardcoded data — Task 5 allows a simple monograph list fallback. Deleting `SessionContext` (Task 11) must catch every `useSession` consumer; `tsc --noEmit` in the gate is the backstop.
