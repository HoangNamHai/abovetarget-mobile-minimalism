# Phase 4 Slice 2 — multi_select Questions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `multi_select` question support to the lesson player so the 21 lessons that use it become fully playable — a `MultiSelect` renderer, the multi-select correctness/scoring path in `useCheckAnswer`, and removing `multi_select` from the "unsupported → Skip" set.

**Architecture:** Extends the Slice 1 pattern. Correctness is a pure helper (`isMultiSelectCorrect`) added to `scoring.ts`. `useCheckAnswer` gains a `multi_select` branch reusing the same success/retry/reveal flow (retry deselects the incorrect picks, keeping correct ones). A `MultiSelect` component (multi-toggle via the reducer's `TOGGLE_MULTI_SELECT`) joins the question registry; `QuestionRunner`'s `SUPPORTED_TYPES` adds `multi_select`.

**Tech Stack:** Expo 56, React Native, Jest (`jest-expo`) + `@testing-library/react-native`. Reuse `QuizOption`, primitives, `useLesson()`.

## Global Constraints

- Expo SDK 56, `jest-expo`. Full suite: `npm test` (TZ=UTC); single file: `npx jest <path>`. Also keep `npx tsc --noEmit` clean.
- **RNTL is async:** `await render(...)` / `await renderHook(...)`; state changes in `await act(async () => {})`; tests `async`. Test style plain `test(...)`, no `describe`.
- Monograph only. Reuse `QuizOption` (`src/components/quiz/QuizOption.tsx`, `brand="monograph"`), primitives, `useLesson()`.
- **multi_select correctness rule (from PMP):** the selected set must EXACTLY equal the correct set — every correct option selected AND no incorrect option selected. Empty selection is incorrect.
- **Types** (`src/types/lesson.ts`): `MultiSelectQuestion = BaseQuestion & { type:'multi_select'; options: QuestionOption[]; minSelections?; maxSelections? }`; `QuestionOption = { id, text, correct, whyWrong? }`; `BaseQuestion` has `q_id`, `points`, `explanation?`, `retryHint?`.
- **Reducer/context:** `useLesson()` provides `toggleMultiSelect(qid, optId, maxSelections?)`, `state.multiSelectAnswers` (`Record<string,string[]>`), plus the helpers used in Slice 1 (`incrementAttempt`, `recordQuestionScore`, `markQuestionCompleted`, `showSuccessModal/RetryModal/RevealModal`, `isQuestionCompleted`). `MAX_ATTEMPTS` from `src/contexts/reducers/lesson-reducer.ts`.
- **Test data (real lesson `A1L3`):** challenge screen, first question `q_id='q1'`, type `multi_select`, `points=250`, `minSelections=3`, `maxSelections=3`, correct options `['A','B','C']`, incorrect `['D','E','F']`.

---

### Task 1: `isMultiSelectCorrect` + `correctOptionsOf` helpers

**Files:**
- Modify: `src/components/lesson/scoring.ts`
- Test: `src/components/lesson/__tests__/scoring.test.ts` (extend)

**Interfaces:**
- Consumes: `MultiSelectQuestion` from `../../types/lesson`.
- Produces:
  - `isMultiSelectCorrect(question: MultiSelectQuestion, selectedIds: string[]): boolean`
  - `correctOptionsOf(question: MultiSelectQuestion): { id: string; text: string }[]`

- [ ] **Step 1: Add failing tests** — append to `scoring.test.ts`:
```typescript
import { isMultiSelectCorrect, correctOptionsOf } from '../scoring';
import type { MultiSelectQuestion } from '../../../types/lesson';

const mq = {
  type: 'multi_select', q_id: 'm1', question: 'Pick all', points: 250,
  options: [
    { id: 'A', text: 'A', correct: true }, { id: 'B', text: 'B', correct: true },
    { id: 'C', text: 'C', correct: true }, { id: 'D', text: 'D', correct: false },
  ],
} as MultiSelectQuestion;

test('isMultiSelectCorrect requires the exact correct set', () => {
  expect(isMultiSelectCorrect(mq, ['A', 'B', 'C'])).toBe(true);
  expect(isMultiSelectCorrect(mq, ['A', 'B'])).toBe(false);        // missing C
  expect(isMultiSelectCorrect(mq, ['A', 'B', 'C', 'D'])).toBe(false); // extra incorrect
  expect(isMultiSelectCorrect(mq, [])).toBe(false);                // empty
});

test('correctOptionsOf returns all correct options', () => {
  expect(correctOptionsOf(mq).map((o) => o.id)).toEqual(['A', 'B', 'C']);
});
```

- [ ] **Step 2: Run → FAIL** — `npx jest src/components/lesson/__tests__/scoring.test.ts`.

- [ ] **Step 3: Implement** — append to `src/components/lesson/scoring.ts`:
```typescript
import type { MultiSelectQuestion } from '../../types/lesson';

export function correctOptionsOf(question: MultiSelectQuestion) {
  return question.options.filter((o) => o.correct).map((o) => ({ id: o.id, text: o.text }));
}

export function isMultiSelectCorrect(question: MultiSelectQuestion, selectedIds: string[]): boolean {
  if (selectedIds.length === 0) return false;
  const correct = question.options.filter((o) => o.correct).map((o) => o.id);
  const selectedSet = new Set(selectedIds);
  const correctSet = new Set(correct);
  const allCorrectSelected = correct.every((id) => selectedSet.has(id));
  const noIncorrectSelected = selectedIds.every((id) => correctSet.has(id));
  return allCorrectSelected && noIncorrectSelected;
}
```
> Keep the existing single_select helpers (`correctOptionOf`, `isSingleSelectCorrect`, `pointsForAttempt`) unchanged. Note `correctOptionOf` (single) and `correctOptionsOf` (multi) are distinct names — do not collide.

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit**
```bash
git add src/components/lesson/scoring.ts src/components/lesson/__tests__/scoring.test.ts
git commit -m "feat(lesson): multi_select correctness helpers"
```

---

### Task 2: Extend `useCheckAnswer` with the multi_select branch

**Files:**
- Modify: `src/components/lesson/use-check-answer.ts`
- Test: `src/components/lesson/__tests__/use-check-answer-multi.test.tsx` (new)

**Interfaces:**
- Consumes: `toggleMultiSelect`, `state.multiSelectAnswers` from `useLesson()`; `isMultiSelectCorrect`, `correctOptionsOf` (Task 1).
- Produces: `checkAnswer(question, isLastQuestion)` now also handles `multi_select`: reads `state.multiSelectAnswers[q_id]`; if empty → no-op; else `incrementAttempt`; correct → score + complete + success; wrong & attempt<MAX → **deselect each incorrect selection** (via `toggleMultiSelect`, keeping correct ones) + retry; wrong & attempt≥MAX → score 0 + complete + reveal (correctAnswer = correct option texts joined by ", ").

- [ ] **Step 1: Write failing test** — `src/components/lesson/__tests__/use-check-answer-multi.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { LessonProvider, useLesson } from '../../../contexts/lesson-context';
import { useCheckAnswer } from '../use-check-answer';
import type { MultiSelectQuestion } from '../../../types/lesson';

const wrapper = ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider>;
function harness() {
  return renderHook(() => ({ lesson: useLesson(), check: useCheckAnswer() }), { wrapper });
}
async function loadQ(result: Awaited<ReturnType<typeof harness>>['result']): Promise<MultiSelectQuestion> {
  await act(async () => { await result.current.lesson.loadLesson('A1L3'); });
  const ch = result.current.lesson.state.lessonData!.screens.find(
    (s: { screen_type: string }) => s.screen_type === 'challenge',
  );
  return (ch as any).interaction.questions[0] as MultiSelectQuestion;
}

test('exact correct multi_select selection scores full points and shows success', async () => {
  const { result } = await harness();
  const q = await loadQ(result);
  for (const id of ['A', 'B', 'C']) {
    await act(async () => { result.current.lesson.toggleMultiSelect('q1', id, 3); });
  }
  await act(async () => { result.current.check.checkAnswer(q, false); });
  expect(result.current.lesson.state.questionScores['q1']).toBe(250);
  expect(result.current.lesson.state.modalType).toBe('success');
});

test('wrong multi_select selection shows retry and deselects the incorrect pick', async () => {
  const { result } = await harness();
  const q = await loadQ(result);
  for (const id of ['A', 'B', 'D']) {
    await act(async () => { result.current.lesson.toggleMultiSelect('q1', id, 3); });
  }
  await act(async () => { result.current.check.checkAnswer(q, false); });
  expect(result.current.lesson.state.modalType).toBe('retry');
  // incorrect 'D' deselected, correct 'A','B' kept
  expect(result.current.lesson.state.multiSelectAnswers['q1'].sort()).toEqual(['A', 'B']);
});

test('multi_select wrong to MAX_ATTEMPTS reveals and scores zero', async () => {
  const { result } = await harness();
  const q = await loadQ(result);
  for (let i = 0; i < 3; i++) {
    await act(async () => { result.current.lesson.toggleMultiSelect('q1', 'D', 3); }); // wrong only
    await act(async () => { result.current.check.checkAnswer(q, false); });
  }
  expect(result.current.lesson.state.modalType).toBe('reveal');
  expect(result.current.lesson.state.questionScores['q1']).toBe(0);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** — modify `src/components/lesson/use-check-answer.ts`. Pull `toggleMultiSelect` and `state` from `useLesson()`, import `isMultiSelectCorrect`, `correctOptionsOf`, and the `MultiSelectQuestion` type. Replace the single-`if` body of `checkAnswer` with a `type` switch keeping the existing `single_select` logic and adding:
```typescript
      if (question.type === 'multi_select') {
        const qid = question.q_id;
        const selected = state.multiSelectAnswers[qid] ?? [];
        if (selected.length === 0) return;
        const attempt = incrementAttempt(qid);
        if (isMultiSelectCorrect(question, selected)) {
          const pts = pointsForAttempt(question.points, attempt);
          recordQuestionScore(qid, pts);
          markQuestionCompleted(qid);
          showSuccessModal({ points: pts, explanation: question.explanation, isLastQuestion });
        } else if (attempt < MAX_ATTEMPTS) {
          const correctIds = new Set(correctOptionsOf(question).map((o) => o.id));
          for (const id of selected) {
            if (!correctIds.has(id)) toggleMultiSelect(qid, id); // deselect incorrect
          }
          showRetryModal({ hint: question.retryHint });
        } else {
          recordQuestionScore(qid, 0);
          markQuestionCompleted(qid);
          showRevealModal({
            correctAnswer: correctOptionsOf(question).map((o) => o.text).join(', '),
            explanation: question.explanation,
            isLastQuestion,
          });
        }
        return;
      }
```
Add `state.multiSelectAnswers`, `toggleMultiSelect` to the `useCallback` deps. Keep the non-single/non-multi no-op guard for `drag_drop` (Slice 3).

- [ ] **Step 4: Run → PASS (3 tests).**

- [ ] **Step 5: Commit**
```bash
git add src/components/lesson/use-check-answer.ts src/components/lesson/__tests__/use-check-answer-multi.test.tsx
git commit -m "feat(lesson): multi_select check-answer branch (exact-set + retry-deselect)"
```

---

### Task 3: `MultiSelect` component + registry + un-skip

**Files:**
- Create: `src/components/lesson/questions/MultiSelect.tsx`
- Modify: `src/components/lesson/questions/QuestionView.tsx` (register `multi_select`)
- Modify: `src/components/lesson/screens/QuestionRunner.tsx` (add `multi_select` to `SUPPORTED_TYPES`)
- Test: `src/components/lesson/questions/__tests__/MultiSelect.test.tsx`

**Interfaces:**
- Consumes: `useLesson()` (`toggleMultiSelect`, `isQuestionCompleted`, `state.multiSelectAnswers`), `useCheckAnswer`, `QuizOption`, `Button`, `Txt`.
- Produces: `MultiSelect({ question, isLastQuestion }: { question: MultiSelectQuestion; isLastQuestion: boolean })` — renders each option via `QuizOption` with `selected` reflecting membership in `state.multiSelectAnswers[q_id]`; tapping toggles via `toggleMultiSelect(q_id, opt.id, question.maxSelections)`; a "Check Answer" Button calls `useCheckAnswer().checkAnswer(question, isLastQuestion)`; options/button disabled once `isQuestionCompleted`.

- [ ] **Step 1: Write failing test** — `src/components/lesson/questions/__tests__/MultiSelect.test.tsx`:
```tsx
import React, { type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { LessonProvider } from '../../../../contexts/lesson-context';
import { QuestionView } from '../QuestionView';
import type { MultiSelectQuestion } from '../../../../types/lesson';

const mq = {
  type: 'multi_select', q_id: 'm1', question: 'Select all that apply', points: 250, maxSelections: 3,
  options: [
    { id: 'A', text: 'Alpha', correct: true }, { id: 'B', text: 'Bravo', correct: true },
    { id: 'C', text: 'Charlie', correct: false },
  ],
} as MultiSelectQuestion;

const wrap = ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider>;

test('QuestionView renders MultiSelect options and a check button (no longer a placeholder)', async () => {
  const { getByText, queryByText } = await render(
    <QuestionView question={mq} isLastQuestion={false} />, { wrapper: wrap },
  );
  expect(getByText('Alpha')).toBeTruthy();
  expect(getByText('Bravo')).toBeTruthy();
  expect(getByText(/check/i)).toBeTruthy();
  expect(queryByText(/isn't supported|not supported/i)).toBeNull();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** `MultiSelect.tsx` (mirror `SingleSelect.tsx` but with `toggleMultiSelect` and `selected = (state.multiSelectAnswers[q_id] ?? []).includes(opt.id)`); add the `multi_select` branch to `QuestionView`; add `'multi_select'` to `SUPPORTED_TYPES` in `QuestionRunner.tsx`.

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Regression gate** — `npm test` (all green) + `npx tsc --noEmit` (0 errors).

- [ ] **Step 6: Commit**
```bash
git add src/components/lesson/questions/MultiSelect.tsx src/components/lesson/questions/QuestionView.tsx src/components/lesson/screens/QuestionRunner.tsx src/components/lesson/questions/__tests__/MultiSelect.test.tsx
git commit -m "feat(lesson): MultiSelect question component + registry; un-skip multi_select"
```

---

## Self-Review

**Spec coverage (Slice 2 = multi_select):** correctness helper → Task 1; orchestration branch (exact-set, retry-deselect, reveal) → Task 2; renderer + registry + un-skip → Task 3. After this, lessons whose only unsupported type was `multi_select` are fully playable; lessons still containing `drag_drop` keep the Skip affordance (Slice 3).

**Placeholder scan:** none — complete code in every step.

**Type consistency:** `isMultiSelectCorrect`/`correctOptionsOf` names distinct from single-select `correctOptionOf`. `useCheckAnswer` switch preserves the single_select path verbatim and adds multi_select; `drag_drop` remains a no-op (still Skip-able). `MultiSelect` mirrors `SingleSelect`'s props (`{ question, isLastQuestion }`). `SUPPORTED_TYPES` now `['single_select','multi_select']`.

**Risk:** the retry-deselect uses `toggleMultiSelect` per incorrect id — verify the reducer toggles off an already-selected id (it does: `indexOf > -1` removes). The reveal `correctAnswer` is a joined string (ModalData.correctAnswer is a string field). A1L3's q1 (min=max=3) means `maxSelections` caps selection at 3 — the test selects exactly 3.
