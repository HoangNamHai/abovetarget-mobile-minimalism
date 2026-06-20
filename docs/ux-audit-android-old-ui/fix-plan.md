# PMP Exam Pro — UX Fix Plan

Findings regrouped into impact-ordered phases. Effort: **S** ≈ <1h, **M** ≈ a few hours, **L** ≈ a day+. IDs map to `audit-report.md`.

---

## Phase 0 — Ship-blocker (do before anything else)

### L-01 · P0 · Restore lesson feedback + progression
The feedback bottom sheet renders invisibly on device → lessons soft-lock. Two-part fix:

1. **Make progression resilient (safety net, do first — S).**
   `src/components/lesson/screens/QuestionRunner.tsx:56` — render the screen-level Continue whenever the question is answered, regardless of `modalVisible`, so a sheet failure can never trap the user:
   ```diff
   - {supported && done && !state.modalVisible && (
   + {supported && done && (
       <Button label="Continue" onPress={advance} />
     )}
   ```
   (Or always render Continue after `done` and let the sheet's own Continue duplicate it.)

2. **Fix the sheet rendering (root cause — M).**
   `src/components/lesson/FeedbackModal.tsx:53-81`. Options, in order of preference:
   - Replace `BottomSheetModal`/`BottomSheetView` with a plain React Native `Modal` + animated container (removes the gorhom + New-Architecture risk entirely; the content is simple). **Recommended.**
   - Or keep gorhom but drop `flex:1` on `BottomSheetView`/`body`, enable dynamic sizing (`enableDynamicSizing`), and give the content an explicit height; verify the sheet actually opens on a release build with `newArchEnabled`.
   - Add a `backdropComponent` so the presented state is always visible and tappable-to-dismiss.

3. **Close the test gap (S).** The current tests mock `BottomSheetModal` with a `View`, so they can't catch non-presentation. Add a test asserting the fallback Continue advances when the sheet is not visible, and (ideally) a Maestro/e2e smoke test that answers one question and reaches the next screen on a real build.

- Files: `QuestionRunner.tsx`, `FeedbackModal.tsx`, `FeedbackModal.test.tsx`. Effort: **M**.
- **Verify on a release build**, not just the dev client.

---

## Phase 1 — High-impact polish (P1)

### L-02 · Render markdown in lesson content — M
3,088 `**…**` markers leak as literal text. Add a lightweight inline-markdown renderer (bold/italic at minimum) and use it wherever lesson prose is shown.
- Files: `src/components/primitives/` (new `RichText`/`Markdown` component), then `HookScreen.tsx:25,34`, `ReasonScreen`, `WrapScreen`, question/explanation bodies, `FeedbackModal` explanation/hint. Effort: **M** (single component, many call sites).

### L-03 · Add safe-area insets to lesson screens — S
Wrap lesson screens in `SafeAreaView` (or apply `useSafeAreaInsets().top` as `paddingTop`) so headings clear the status bar/dynamic island.
- Files: `HookScreen.tsx:18`, `ChallengeScreen`/question screens, `ReasonScreen`, `TransferScreen`, `PracticeScreen`, `WrapScreen`. Consider doing it once in `LessonPlayer.tsx` around the switch. Effort: **S**.

### H-01 · Fix Anton glyph clipping on hero stats — S
`lineHeight === fontSize` clips the tall Anton caps. Increase line-height (~1.15–1.25×) or add top padding on display numerals.
- Files: `MonographDashboard.tsx:63` (64→~76), `:88` (40→~48); audit other `variant="display"` blocks with tight line-heights (`FeedbackModal.tsx:188` 48/52, onboarding headings 36/40). Effort: **S**.

### O-01 · Make the daily reminder actually work — M
Wire the onboarding selection to the notification service:
- Pass the chosen reminder into `completeOnboarding(...)` (or call the service from `handleFinish`), map the option id → `ReminderTime`, then `await notificationService.scheduleDailyReminder(time)` (which requests permission internally).
- Add **in-app priming** copy before the OS prompt (the reminder screen already primes; just trigger the request on "Let's begin").
- Honor the Profile **Notifications** toggle by (re)scheduling/cancelling.
- Files: `question-reminder.tsx:26`, `onboarding-context.tsx:128`, a new notification-service instantiation/provider, `settings-context`, `profile.tsx`. Effort: **M**.

---

## Phase 2 — Functional polish (P2)

### A-01 · Accessibility labels on lesson interactives — M
Add `accessibilityRole`/`accessibilityLabel`/`accessibilityState` (and `testID`) to quiz options, drag-drop tray chips, the primitive `Button`, and tab-bar items so VoiceOver works and the flows are testable.
- Files: `SingleSelect.tsx`, `MultiSelect.tsx`, `DragDrop.tsx`, `quiz/QuizOption.tsx`, `primitives/Button.tsx`, tab layout. Effort: **M**.

### L-04 · Fix malformed drag-drop content — S
Replace the placeholder chip/zone (`id:"chip", label:"Chip", correctZone:"description"`) with a real project + zone.
- Files: `assets/data/A1L4.json:98-119`, `assets/data/A1L2.json:~446`. Grep other lessons for stray `"label": "Chip"` / `"description"` zones. Effort: **S**.

### H-02 · Fix off-brand hero copy — S
`MonographDashboard.tsx:219` — replace "TOP-TIER MONOGRAPHS" with e.g. "TOP PROJECT PROFESSIONALS". Effort: **S**.

### H-03 · Align "Arena" framing with reality — S/M
Either build a real arena/leaderboard, or retitle "Join Arena"/"Challenge Arenas" to match what it does (browse lessons by domain) and make the milestone copy reflect actual progress (don't tell a 0-pt user they're "nearing the professional tier").
- Files: `MonographDashboard.tsx`, `home.tsx`. Effort: **S** (copy) / **M** (feature).

### L-05 · Lesson exit + progress indicator — M
Add a close/back affordance and a "step X of N" (or progress bar) to the lesson player.
- Files: `LessonPlayer.tsx` (shared header). Effort: **M**.

### P-01 · Profile completeness — M
Add Sign Out, Restore Purchases, and Terms/Privacy links; gate the "PREMIUM" status behind real entitlement before enabling RevenueCat.
- Files: `profile.tsx`, `subscription-context.tsx`. Effort: **M**.

### O-02 · Reconcile reminder times — S
Make option copy match `TIME_MAPPING` (or vice-versa). Files: `question-reminder.tsx:13-15`, `notifications.ts:6-10`. Effort: **S**.

---

## Phase 3 — Nitpicks (P3)

- **O-03 · S** — Show an empty radio indicator on unselected single-select onboarding options. `goal-selection.tsx`, `question-reminder.tsx`.
- **S-01 · S (dev-only)** — Resolve the JS warnings behind the LogBox toast (it overlaps CTAs/tab bar in dev) so the dev surface is clean and warnings don't mask real ones. Triage via the in-app debugger.

---

## Suggested order
1. **L-01** (unblock lessons) — verify on release build.
2. **L-02, L-03, H-01, O-01** (the four P1s — all visible on first run).
3. **A-01, L-04, H-02, H-03, L-05, P-01, O-02**.
4. **O-03, S-01**.
