# PMP Exam Pro — Lesson UX Fix Plan (iOS audit)

Findings from `audit-report.md` (UI/UX) and `content-audit.md` (content), regrouped into impact-ordered phases. Effort: **S** ≤½ day · **M** ~1–2 days · **L** ≥3 days. File paths are where the change lands.

---

## Phase 1 — Broken / trust (do first)

| ID | Change | Files | Effort |
|----|--------|-------|--------|
| L-DD-1 | Delete the leftover placeholder drag item — chip `{"id":"chip","label":"Chip"}` + drop zone `{"id":"description","label":"Description","detail":"Correct Zone"}`. Then grep every lesson JSON for the same scaffolding and remove it. Add a unit test in `lessons-data.test.ts` asserting no chip/zone is literally "Chip"/"Description". | `assets/data/A1L4.json` (+ audit all `assets/data/*.json`), `src/data/__tests__/lessons-data.test.ts` | S |
| C2L2-EVM | Reconcile EVM numbers: make CPI a clean value (e.g. AC=$160K → CPI=0.60 exact) **or** state "CPI rounded to 0.69" wherever EAC is derived; fix the $108K-vs-$110K and the $15K/$20K/$180K/$212K/$280K corrective-action conflicts to one consistent set. | `assets/data/C2L2.json` | M |
| B1L2-MODEL | Remove "(also called Stakeholder Salience Model)"; rename "Persuasive Power" → "Informational Power" across objective/challenge q3/reason tab3; align the practice_3 "Coercive" distractor with a taught type. | `assets/data/B1L2.json` | S |
| CITES | Strip invented "PMBOK 7th Ed, page NNN" / "Section 2.2" citations across lessons; cite Performance Domains by name instead. | `assets/data/{B1L2,B2L3,C3L1,D2L1}.json` | S |
| L-FB-1 | Verify (and if missing, add) an always-reachable give-up/reveal path on repeated wrong answers so a user is never hard-stuck on a gated question. | `src/components/lesson/FeedbackModal.tsx`, `src/components/lesson/screens/QuestionRunner.tsx`, `use-check-answer.ts` | S–M |

## Phase 2 — Information scent & flow (highest UX leverage)

| ID | Change | Files | Effort |
|----|--------|-------|--------|
| L-CHAL-1 | Keep the primary action reachable: add a pinned bottom action bar for **Check Answer** / **Continue** (or a fade/▾ scroll cue when it's off-screen). Tighten the above-the-fold block so ≥1 option is visible with the stem. | `src/components/lesson/screens/QuestionRunner.tsx`, `SingleSelect.tsx`, `src/components/lesson/LessonPlayer.tsx` | M |
| L-HOOK-1 | Pin the hook **Continue**, or move **Quick Jump** above it / into the header as a stage stepper so navigation isn't below the CTA. | `src/components/lesson/screens/HookScreen.tsx`, `src/components/lesson/QuickJump.tsx` | M |
| L-NAV-1 | Add a "Question X of N" counter inside each question set. | `src/components/lesson/screens/QuestionRunner.tsx`, `useQuestionScreen.ts` | S |
| L-PROG-1 | Define + label the header progress bar (stages-visited vs questions-answered) so Quick-Jump doesn't make it read as "70% done." | `src/components/lesson/LessonPlayer.tsx` (`LessonHeader`) | S |
| L-WRAP-1 | Decide gating: either require all stages before "Lesson Complete," or label a partial score (reaching wrap via Quick Jump → Practice only shows full completion at 20%). Verify streak/XP surface on the score card. | `src/components/lesson/screens/WrapScreen.tsx`, `use-lesson-limit.ts`, `lesson-reducer.ts`, `QuickJump.tsx` | M |

## Phase 3 — Readability, a11y, perf, consistency

| ID | Change | Files | Effort |
|----|--------|-------|--------|
| L-A11Y-1 | Add `testID` + `accessibilityLabel` (role/position) to quiz options, drag chips, and drop zones (e.g. "Option B: …", `zone-…`). Fixes screen-reader order **and** makes Maestro text-driving reliable. | `src/components/quiz/QuizOption.tsx`, `src/components/lesson/questions/{DragDrop,MultiSelect}.tsx` | S–M |
| L-TYPE-1/2 | Cap question-stem size/line-count; consider Hanken for the stem body (reserve Anton for the scenario label) to cut reading load. | `src/components/lesson/questions/QuestionPrompt.tsx`, `src/components/primitives/Txt.tsx` | S |
| L-PERF-1 | Paint headline/intro text immediately on entry (local JSON) and show an image skeleton instead of the bare placeholder grid. | `src/components/lesson/screens/HookScreen.tsx`, `src/components/lesson/LessonPlayer.tsx`, `lesson-images.ts` | M |
| L-CHIP-1 | Make drag chips closer in size/contrast to option cards for consistent target sizing. | `src/components/lesson/questions/DragDrop.tsx` | S |
| L-HOOK-2 | Optionally collapse the failure-card carousel / character quote by default to shorten the hook before first interaction. | `src/components/lesson/screens/HookScreen.tsx`, `FailureCarousel.tsx` | M |
| CHARS | Give recurring characters one stable name↔role across lessons (Maya, Taylor, Devon, Jordan, Carlos, Sam, Elena currently drift), or diversify names. | `assets/data/*.json` | M |
| COPY | D2L1 transfer_q1 "As a anyone…" grammar; B2L3 "four conflicts" vs three failure cards; soften C2L2 "CPI will not magically improve"; clarify B2L3 "withdraw vs accommodate" label. | `assets/data/{D2L1,B2L3,C2L2}.json` | S |

---

## Notes
- **Dev-only:** the "Open debugger to view warnings" toast in screenshots is the Expo dev client; it does not ship. No action.
- **Don't regress the brand.** Phase 2/3 should stay within the monochrome/no-shadow system (`docs/design-system.md`) — a pinned action bar and scroll cue can be built from existing tokens (ink pill, hairline, fade) without introducing new chrome.
- Sequencing: Phase 1 is shippable independently (content + one broken element). Phase 2 is the conversion/usability win and should be designed together (they all touch `QuestionRunner`/`HookScreen`). Phase 3 is incremental polish.
