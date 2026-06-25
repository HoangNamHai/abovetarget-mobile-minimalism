# PMP Exam Pro — iOS Lesson UX/UI & Content Audit

- **Date:** 2026-06-22
- **Platform:** iOS only — iPhone 17, iOS 26.0 simulator
- **Build:** Expo dev client (`com.h2ai.pmpexampro`), JS served from Metro
- **Method:** Maestro-driven walkthrough of 6 randomly-selected lessons, deep-linked via `pmp-exam-pro:///lesson/<id>`. Every screen + answer-feedback state screenshotted and reviewed visually against the rubric. Stage navigation used the in-lesson **Quick Jump** grid (jumps to any stage without answer-gating). Content audited separately from `assets/data/*.json` — all EVM/EMV math and answer keys verified (see **`content-audit.md`**).
- **Lessons sampled:** A1L4 (Project Life Cycles · drag-drop), B1L2 (Stakeholder Power/Interest · drag-drop), B2L3 (Conflict Resolution · full traversal), C2L2 (Earned Value Mgmt · quant), C3L1 (Risk Identification), D2L1 (User Story INVEST).
- **Screenshots:** `docs/ux-audit-ios/screenshots/` (35 frames) — all 6 lessons captured at hook + challenge; B2L3 traversed end-to-end.
- **Rubric:** visual hierarchy · consistency · copy/voice · affordance/feedback · accessibility · flow/navigation · state coverage · brand fidelity. **Severity:** P0 blocker · P1 trust/conversion · P2 polish · P3 nitpick.
- **Design intent we audit against** (`docs/design-system.md`): *editorial monochrome*; Anton + Hanken Grotesk; **no shadows**; color carries meaning only (selection ink, success green, error red, reveal orange, premium gold). The app is faithful to this — recommendations below respect it rather than push generic "add color/shadow."

---

## Executive summary

The lesson player is **well-built, on-brand, and pedagogically strong.** The hook→challenge→reason→transfer→practice→wrap arc is consistent across all six lessons; the comic-driven hooks are genuinely compelling; selection and feedback states are expressive (full-bleed colored result sheets with a points award and firework burst). The monochrome editorial system is executed faithfully and gives the app a distinctive, premium feel that stands apart from typical quiz apps.

The issues are mostly **polish and information-scent**, not breakage. The recurring theme: **each screen shows one idea at a time and pushes the next action below the fold**, so users must scroll without always knowing there's more (options, a Check button, the Continue CTA). One genuinely **broken element** is visible — a leftover placeholder chip/zone in the A1L4 drag-drop. Content is accurate apart from a handful of trust issues (an EVM rounding inconsistency, a mislabeled stakeholder model, invented PMBOK page citations, and characters whose roles drift between lessons) — all detailed in `content-audit.md`.

**Headline counts** (UI/UX findings in this report): **P0 0 · P1 2 · P2 7 · P3 5.** Content findings (separate): P1 ×6, P2 ×5, P3 ×8.

### Top fixes, in order
1. **L-DD-1 (P1)** — remove the visible placeholder "Chip → Description / Correct Zone" pair rendered in the A1L4 drag-drop (and audit other drag-drops for the same scaffolding). *Visibly broken; erodes trust on screen one of the challenge.*
2. **L-CHAL-1 / L-HOOK-1 (P2)** — make "there's more below" and the primary CTA discoverable without hunting: a pinned/again-at-bottom primary action and a scroll affordance when options/Check/Continue are off-screen.
3. **L-NAV-1 (P2)** — add "Question X of N" inside each question set.
4. Content P1s — see `content-audit.md` (EVM numbers, "Salience Model" mislabel, fake page citations, character-role drift).

---

## Findings at a glance

| ID | Sev | Screen | Finding |
|----|-----|--------|---------|
| L-DD-1 | **P1** | A1L4 challenge | Placeholder "Chip"/"Description (Correct Zone)" rendered as a real chip + drop zone |
| L-FB-1 | **P1** | Feedback (retry) | Wrong-answer path can't be exited without answering correctly or "reveal" (gating risk for stuck users) — verify a give-up path exists |
| L-CHAL-1 | P2 | Challenge | Options + Check Answer sit below the fold with no "more below" cue |
| L-HOOK-1 | P2 | Hook | Primary Continue CTA buried mid-scroll; Quick Jump renders *after* it |
| L-NAV-1 | P2 | Question sets | No "Question X of N" progress within a set |
| L-WRAP-1 | P2 | Wrap | One stage via Quick Jump → full "Lesson Complete" at 20%; verify gating/score meaning |
| L-TYPE-2 | P2 | Challenge/Reason | Long body copy + dense theory lists; high reading load per screen |
| L-PROG-1 | P2 | Header | Top progress bar jumps on Quick-Jump navigation; meaning of the bar is ambiguous |
| L-A11Y-1 | P2 | Global | Quiz options/chips expose no stable `testID`/label → automation + screen-reader order rely on raw text |
| L-TYPE-1 | P3 | Challenge | Anton condensed all-caps display on multi-line question stems reads "shouty" |
| L-PERF-1 | P3 | Lesson entry | Slow first paint: comic placeholder (grid/rings) with no text skeleton for several seconds |
| L-HOOK-2 | P3 | Hook | Hook is 3+ viewports (headline + carousel + quote + learning hook); heavy before the first interaction |
| L-CHIP-1 | P3 | Drag-drop | Tap-to-place chips are small, low-contrast pills vs. the large option cards elsewhere — inconsistent target sizing |
| L-DEV-1 | caveat | All | "Open debugger to view warnings" toast overlaps bottom content — **dev-build only**, not shipping |

---

## Cross-cutting findings

### L-CHAL-1 · Options & primary action live below the fold (P2)
On the challenge, the scenario paragraph + the large Anton question stem consume the entire first viewport; all four option cards and the **Check Answer** button require scrolling, with nothing indicating they exist (`B2L3-02-challenge.png` vs `B2L3-02-challenge-options.png`). Same pattern on the hook: the **Continue** CTA is reached only after scrolling past the carousel, character quote, and "Learning Hook" (`B2L3-01-hook.png` → `B2L3-01-hook-bottom.png`). **Fix:** shorten the above-the-fold block (tighten scenario, smaller stem), and add a persistent bottom action bar (or a scroll-cue chevron / fade) so "Check Answer" / "Continue" is always reachable and obviously present.

### L-HOOK-1 · The advance CTA is buried, and Quick Jump comes after it (P2)
Reading order on the hook is headline → intro → failure-card carousel → character quote → "Learning Hook" → **Continue** → **Quick Jump grid**. Putting navigation *below* the primary CTA means a user who taps Continue never sees Quick Jump, and a user who scrolls to Quick Jump has already scrolled past Continue. **Fix:** pin Continue, or move Quick Jump above it / into the header as a stage stepper.

### L-NAV-1 · No "Question X of N" inside a set (P2)
The header progress bar reflects whole-lesson progress, not position within the current challenge/transfer/practice set, so users don't know how many questions remain before the next stage. **Fix:** add a small "2 / 4" counter near the stem (`QuestionRunner`/`useQuestionScreen` already track `isLast`).

### L-PROG-1 · Progress bar semantics are ambiguous (P2)
Jumping stages via Quick Jump moves the top bar to that stage's position (e.g. Transfer shows ~70%), so the bar tracks *furthest stage reached* rather than *work completed*. Combined with no per-set counter, "progress" is hard to read. **Fix:** decide whether the bar means stages-visited or questions-answered, and label it.

### L-TYPE-1 / L-TYPE-2 · Reading load (P3 / P2)
Question stems render in Anton (tall condensed, all-caps via the display variant) at a large size; stacked under a scenario paragraph this reads as a wall of heavy type (`B2L3-02-challenge.png`). Theory screens are long bulleted breakdowns (`B2L3-03-reason-*.png`). The type system is beautiful for *headlines*; for *question stems* a slightly smaller stem (or Hanken for the question, reserving Anton for the scenario label) would lower the load. **Fix:** cap stem size / line count; consider Hanken for the question body.

### L-A11Y-1 · Options/chips lack stable identifiers (P2)
Quiz options and drag chips expose only their rendered text (no `testID`/`accessibilityLabel`), which made automated tapping by text unreliable on iOS and means VoiceOver reads raw option text with no role/position context. The A/B/C/D key is a separate visually-uppercased node. **Fix:** add `testID`/`accessibilityLabel` (e.g. `option-A`, "Option A: …") to `QuizOption`, chips, and drop zones — improves a11y *and* testability.

### L-PERF-1 · Slow, skeleton-less first paint (P3)
Entering/re-entering a lesson shows the comic image's placeholder (a grey grid + concentric rings) with **no text skeleton** for several seconds before the hook renders (`/tmp/qj2-a` during capture). **Fix:** render the headline/intro text immediately (it's local JSON) and show a proper image skeleton, so the screen isn't "empty graphic" on entry.

---

## Screen-by-screen

### Hook (all 6 lessons) — strong
Consistent, high-quality: a punchy headline in Anton, a tight first-person scenario, a polished comic illustration, a swipeable **failure-card carousel** (‹ › arrows + dots), a character-quote card with avatar, then "Learning Hook" + Continue + Quick Jump.
- Headlines are genuinely good copy: *"58% Spent, 40% Done: Is Savory's Expansion Headed for Disaster?"* (C2L2), *"34 Risks, $4.2M at Stake: Which 5 Could Kill This Project?"* (C3L1), *"7 Out of 10 Stories Failed INVEST…"* (D2L1). (`*-01-hook.png`)
- **L-HOOK-2 (P3):** the hook is 3+ viewports before any interaction — a lot of reading before the first "win." Consider collapsing the carousel/quote by default.
- Carousel affordance (arrows + dots) is clear and on-brand (`A1L4-01-hook-mid.png`).

### Challenge — single-select (`B2L3-02-*`)
Scenario label (small caps) → scenario → big stem → outlined option cards → Check Answer. Selecting fills the card with **ink** (`B2L3-02-challenge-selected.png`) — clear, on-brand, not color-dependent.
- **L-CHAL-1 (P2)** below-fold options/CTA (above).
- Option cards are large, comfortable tap targets; good.

### Challenge — drag-drop / tap-to-place (`A1L4-02-*`, `B1L2-02-*`)
Tap a chip, then tap a drop zone. Zones are labelled cards (with a category subtitle); chips are pills below. B1L2 reduces the 2×2 grid to a binary "Manage Closely / Not" sort — a smart simplification.
- **L-DD-1 (P1):** A1L4 renders a **leftover placeholder**: a chip literally labelled "**Chip**" and a drop zone "**Description / Correct Zone**" sit among the real items (`A1L4-02-challenge-dragdrop.png`). Visibly broken; must be removed (see `content-audit.md` A1L4). 
- **L-CHIP-1 (P3):** chips are small low-contrast pills, inconsistent with the large cards used for single-select options — target-size inconsistency.

### Feedback result sheet (`B2L3-02-feedback-success.png`) — strong
Full-bleed **green** bottom sheet: "EXCELLENT WORK." + "+125 pts" + explanation + a firework burst. Retry is **red** "NOT QUITE." + hint; reveal is **orange** "HERE'S THE ANSWER." Expressive, motivating, and not color-only (each carries a headline). One of the best parts of the app.
- **L-FB-1 (P1 — verify):** on a wrong answer the sheet offers "Try Again" (returns to the same question) — confirm there is always a reachable "reveal/skip" path so a user who can't get it right is never hard-stuck (code suggests `reveal` exists; verify it surfaces in-product).

### Reason / Theory (`B2L3-03-reason-*.png`) — good, dense
"The Conflict Resolution Toolkit": an expandable section with the **Thomas-Kilmann 2×2 diagram** (assertiveness × cooperativeness, colored quadrant icons) then a structured per-strategy breakdown (Outcome / Speed / Best For / PMI Priority / Example). Well-organized; the diagram is a nice payoff. Dense — a lot of text per screen (L-TYPE-2).

### Transfer (`B2L3-04-transfer-intro.png`) — clean
A scenario intro card ("The Social Media Strategy Conflict") with a **Start** button, then a question set. Good "apply it" framing.

### Practice (`B2L3-05-practice*.png`)
Same `QuestionRunner` UI as the challenge (scenario label → stem → option cards → Check Answer), shorter scenarios. Success feedback awards **+50 pts** (vs +125 in the challenge) — point weighting per stage is sensible. **L-CHAL-1 recurs sharply here:** with 2-line options the **Check Answer** button drops under the fold (and under the dev toast), so even a deliberate user must scroll to find it — captured live across q0–q3.

### Wrap / completion (`B2L3-06-wrap-*.png`)
"Lesson Complete!" with a **score card** ("YOUR SCORE 20% · 200 OF 1000 POINTS"), a plain-language summary, a structured **Key Takeaways** list, and a next-lesson CTA. Clean and motivating.
- **L-WRAP-1 (P2, verify):** completing a **single** stage (I reached wrap via Quick Jump → Practice only, answering 4 of ~10 questions) still presents the full completion screen at **20%**. Confirm whether the lesson is then marked "complete" in the catalog at a 20% score — if so, Quick Jump lets users skip the gated stages and still "finish," which undercuts the gating and the score's meaning. **Fix:** require all stages, or label the score as partial and don't mark complete until stages are done.
- The score card is a good spot to reinforce streak/XP; verify those surface here.

---

## What's working well (keep)
- **Distinctive, faithful visual system.** Monochrome editorial with Anton/Hanken and no shadows is executed consistently across every screen and lesson — it reads premium and unlike commodity quiz apps.
- **Comic-driven hooks.** High-quality, consistent illustrations + sharp headlines create real narrative pull before the quiz.
- **Expressive feedback.** Colored result sheets + points + firework on success make correctness feel rewarding; wrong/reveal states are distinct and humane.
- **Clear lesson chrome.** Persistent header with an always-present ✕ exit and a progress bar gives a way out and a sense of place.
- **Ink-fill selection.** Selection state is obvious and brand-consistent without relying on hue.
- **Quick Jump.** Letting users jump between stages is a genuinely useful navigation aid (and an automation gift).
- **Well-timed conversion at the finish.** The wrap screen pairs a "Lesson Complete" score card with a *"Create a free account to keep your streak and history safe — right now it only lives on this device"* card **and** an "Up Next" next-lesson card + Next Lesson CTA (`B2L3-06-wrap-cta.png`). This is exactly where an anonymous user is most invested — strong retention/conversion design.
- **Content is largely accurate** with plausible distractors and a coherent pedagogical arc (see `content-audit.md`).

---

## Coverage notes (honest)
- **Driving method:** iOS Maestro `tapOn`-by-text was unreliable here — the simulator's accessibility-hierarchy fetch on these content-heavy screens is very slow (~30 s/call), so text matching and `scrollUntilVisible` time out. **Coordinate** taps + swipes + `simctl` screenshots are fast and reliable, so capture was driven by reading each screenshot and tapping by coordinate. This is itself the basis of **L-A11Y-1** (no stable identifiers).
- **Captured (35 frames in `screenshots/`):** all **6 lessons at hook + challenge** (incl. C2L2's numeric "Planned Value" question, A1L4 & B1L2 **drag-drop** challenges, C3L1 Delphi, D2L1 INVEST); **B2L3 fully traversed** — hook → challenge (stem / options / ink-selected / success feedback) → reason (diagram + breakdown) → transfer intro → practice (questions + feedback) → **wrap** (score card / takeaways / account-CTA + Next Lesson).
- **Confirmed from code, not screenshotted live:** the **retry** ("NOT QUITE.", red) and **reveal** ("HERE'S THE ANSWER.", orange) feedback states (`FeedbackModal.tsx`); reason/transfer/practice/wrap for the non-B2L3 lessons (identical components, content verified in `content-audit.md`).
- **Not driven:** full answer-by-answer completion of all 6 lessons (answer-gated; unnecessary for a UI audit — content correctness verified from JSON).
