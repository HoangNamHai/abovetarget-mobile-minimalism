# Onboarding "Readiness Funnel" — Design Spec

**Date:** 2026-06-21
**Status:** Approved (design) — pending implementation plan
**Author:** Brainstormed with Claude
**Replaces:** the current 4-screen onboarding (`splash → welcome → goal-selection → question-reminder`)

---

## 1. Goal

Replace the existing minimal onboarding with a modern, conversion-oriented
"interactive questionnaire" funnel: a sequence of one-question-per-screen steps,
interleaved with real PMI facts, that ends in a personalized study-plan reveal
and the paywall.

The pattern is modeled on the highest-converting consumer onboarding funnels
(Duolingo, Headway, Impulse, Rise, Cal AI). The differentiator: **no PMP
competitor inserts fact interstitials during onboarding** — doing it with real,
citable PMI exam facts is a credibility edge unique to this product.

### Success criteria
- A first-time user moves through value → questions → personalized reveal →
  paywall in one session.
- Every answer the user gives visibly feeds the final reveal (the "earned plan").
- The funnel works whether or not RevenueCat is enabled (paywall gracefully
  no-ops to the app when `REVENUECAT_ENABLED` is false).
- No back-to-back cognitive questions; facts/value pace the flow.

---

## 2. Psychological model (why the flow is shaped this way)

- **Front-load value, back-load asks.** Positive, low-effort screens (the app's
  approach, flattering facts) come first; the paywall comes last, after value is
  felt. (Darius Contractor's "Psych" framework.)
- **Micro-commitments → consistency.** Each answer is a small commitment;
  subscribing becomes the consistent continuation of a declared intent. The
  explicit "Commit" pledge screen is the textbook execution.
- **IKEA / sunk-cost effect.** The effort of answering makes the resulting plan
  feel earned and more valuable — *only if the user reaches the finished reveal*,
  so the flow must minimize mid-funnel drop-off (progress bar, short steps).
- **Loss aversion at the reveal.** The personalized plan sets a reference point;
  the paywall is framed as "unlock your plan," so not subscribing feels like
  losing something already owned.
- **Social proof, timed late.** Shown *after* the user invests (post "why
  certified"), the "1M+ certified / +24% salary" stat reads as peer validation,
  not a brand claim.

---

## 3. The flow (16 steps)

One question per screen. Progress bar visible from the first question screen,
**pre-filled to ~15%** (endowed-progress effect), hidden on the pure value
screens (1–3) and the loader/reveal.

| # | Screen | Type | Notes |
|---|--------|------|-------|
| 1 | **Splash + Learn-by-doing** | Value (static) | Wordmark "PMP Exam Pro" + the learn-by-doing message in one screen. CTA "Get Started". |
| 2 | **Story: the concept** | Value (static) | "One story, start to finish." Why a single unfolding project beats disconnected facts. |
| 3 | **Story: Meet Savory & Co.** | Value (static) | Introduces the recurring cast/world. Uses existing character art. |
| 4 | **"When's your exam?"** | Question | Date picker + "Not booked yet" escape. First question. Feeds the projection. |
| 5 | *Fact* — exam shape | Interstitial | "180 questions, 230 minutes, two optional breaks." |
| 6 | **"Why are you getting certified?"** | Question (multi-select) | Promotion / Raise / Required for role / Switch into PM / Personal goal. |
| 7 | *Fact* — social proof | Interstitial | "Over 1M hold the PMP — ~24% higher median salary." Timed right after the career-motivation answer. |
| 8 | **"How much project management experience do you have?"** | Question (single) | New to PM / Run projects but no formal training / Experienced PM here for the cert. Calibrates plan intensity. |
| 9 | *Fact* — exam content mix | Interstitial | "Roughly half the exam is predictive, half agile or hybrid." |
| 10 | **Confidence self-rating** | Question | Three taps/sliders: confidence in People / Process / Business Environment. Lowest → `focusDomain`. |
| 11 | *Fact* — study effort | Interstitial | "Most candidates study 60–200 hours. A daily habit beats cramming." |
| 12 | **Belief-priming** | Tap-to-agree | "Studying for the PMP feels overwhelming." Micro-commitment; +Psych. |
| 13 | **Reminder time** | Question (single) | Morning / Lunch / Evening / None. (Reuses existing reminder content; now actually persisted.) |
| 14 | **Commit pledge** | Action | "Commit to passing by [exam date]." Big button; commitment device. |
| 15 | **Choose your starting domain** | Question (single) | Three domains (People / Process / Business Environment), each previewing 3 real lesson cards from the bundled curriculum. The confidence-recommended domain (from step 10) is pre-highlighted with a "Recommended for you" badge. Selection sets `focusDomain`. |
| 16 | **Reveal → Paywall** | Personalized + monetization | A short "Preparing your plan…" transition (~2–3s, character portrait — the folded-in labor-illusion beat) animates into the plan reveal, whose primary CTA opens the paywall (or the app if RC disabled). |

### Pacing rules
- No two cognitive questions are adjacent. (Belief-priming at 12 is a
  tap-to-agree, not a cognitive question, so 12→13 is acceptable; the Commit
  pledge at 14 is an action that separates questions 13 and 15.)
- Value screens (1–3) are the only place multiple non-question screens sit
  together, by design.

---

## 4. Content

### 4.1 Value screen copy (drafts)

**Screen 1 — Splash + Learn-by-doing**
> **PMP Exam Pro**
> **Learn by doing — not memorizing.**
> Master the PMP through real project decisions, one lesson at a time.
> *[Get Started]*

**Screen 2 — Story: the concept**
> *How it works*
> **One story, start to finish.**
> Instead of disconnected facts, you learn through a single unfolding project —
> so concepts build on each other and actually stick.

**Screen 3 — Story: Meet Savory & Co.**
> *Your case study*
> **Welcome to Savory & Co.**
> You'll steer real projects for a restaurant group — its sponsors, its team, its
> crises. Every PMP concept shows up as a decision someone has to make.
> *(visual: the recurring characters)*

### 4.2 Fact library

Stored in a single constant (`onboarding-facts.ts`) so exam-detail edits are
one-line. Each fact is rendered in the editorial display style.

1. "The PMP exam is 180 questions. You'll have 230 minutes — and two optional breaks."
2. "Three domains: People (42%), Process (50%), Business Environment (8%)."
3. "Over 1 million professionals hold the PMP. They report ~24% higher median salary."
4. "Roughly half the exam is predictive — the other half agile or hybrid."
5. "Most candidates study 60–200 hours. A daily habit beats weekend cramming."
6. "Consistency beats intensity. A short daily nudge is how streaks are built."

> ⚠️ **Time-sensitivity:** PMI updates the exam on **2026-07-09** (time rises
> toward ~240 minutes; references move to PMBOK 8th ed.). Because this ships
> around that date, the minute/edition figures live in `onboarding-facts.ts` as
> the single source of truth — revisit facts #1 and #4 at launch.

### 4.3 Domain-choosing screen (step 15)

Replaces the standalone loader. Lets the user pick where to start and previews
the actual curriculum — concrete value immediately before the paywall.

> *Your path*
> **Where do you want to start?**
> [ People  ·  3 lesson cards ]
> [ Process  ·  3 lesson cards ]  ← "Recommended for you" badge if confidence-lowest
> [ Business Environment  ·  3 lesson cards ]

- Renders all three domains; each shows **3 real lesson cards** (title +
  thumbnail + duration) pulled from `lessons-index.json`, filtered by domain.
- The domain with the **lowest confidence** (step 10) carries a "Recommended for
  you" badge and is pre-selected — but the user may pick any domain.
- The chosen domain sets `focusDomain` (overrides the recommendation).

### 4.4 Characters / mascot

**No dedicated onboarding mascot** — a persistent cartoon guide would clash with
the editorial brand. Instead, use the **existing Savory & Co. cast** at three
beats only:
1. Screen 3 (Meet Savory & Co.) — the cast's introduction.
2. Screen 16 transition — the ~2–3s "Preparing your plan…" beat carries one
   character portrait + line ("Elena's prepping your plan…") to humanize the wait.
3. Screen 16 (reveal) — optionally one character framing the plan.

Source art from existing lesson assets (`characters` in lesson JSON, comic
thumbnails) — no new art commissioned.

---

## 5. The reveal & plan logic

### 5.1 `buildPlan(inputs)` — a pure function

No scoring engine (the diagnostic quiz was cut). The reveal is derived from
collected inputs:

```
inputs: {
  examDate: number | null
  reasons: string[]
  experience: 'new' | 'informal' | 'experienced'   // PM experience level (step 8)
  confidence: { people: number; process: number; business: number }
}

output: {
  recommendedDomain: 'people' | 'process' | 'business'  // = argmin(confidence); badge only
  focusDomain: 'people' | 'process' | 'business'        // = user's explicit pick (step 15)
  intensity: 'foundational' | 'steady' | 'accelerated'  // f(examDate proximity, experience)
  dailyGoal: number                                 // DERIVED recommended pace (default 2)
  readyByDate: number | null                        // projection, capped at examDate
  rationale: string                                 // the "why" sentence
}
```

- **`recommendedDomain`** = lowest confidence rating (step 10); used only to
  pre-highlight the "Recommended for you" badge on the domain-choosing screen.
- **`focusDomain`** = the domain the user explicitly chose on step 15. Defaults to
  `recommendedDomain` if they accept the pre-selection. This is what the reveal
  and the post-onboarding curriculum order key off.
- **`dailyGoal`** is now **derived, not asked**: if `examDate` is set, compute the
  pace needed to finish the curriculum before it (total bundled lessons ÷ weeks
  remaining), clamped to 1–5; otherwise default 2 (matches current code default).
- **`readyByDate`** = today + (totalLessons ÷ dailyGoal) days, capped at
  `examDate` when present.
- **`intensity`** label chosen from exam proximity × PM experience.

### 5.2 Reveal screen

Surfaces the user's own inputs and states the *why*:

> **Your study plan is ready.**
> Starting with: **Process** (your choice)
> Pace: **2 lessons/day** — on track to be exam-ready by **Aug 14**
> *"Your exam is in 8 weeks, so we're starting you in Process and building a
> 2-a-day habit to get you there."*
> *[Unlock my plan]*

Rationale wording adapts: if the chosen domain equals `recommendedDomain`, it
notes "the area you felt least confident in"; otherwise it simply honors the
user's chosen starting point.

If no exam date: generic 30/60/90-day framing ("a steady 2-a-day plan, ready in
~6 weeks").

---

## 6. Data model

Extend `UserPreferences` in `src/contexts/onboarding-context.tsx`:

```ts
interface UserPreferences {
  // existing
  goals: string[];                 // kept; populated from `reasons`
  dailyGoal: number;               // now set from buildPlan() output, not a screen
  focusDomain?: string;            // the user's explicit pick on step 15 (defaults to recommendedDomain)
  onboardingCompletedAt: number;
  // new
  examDate?: number | null;
  reasons: string[];               // why-certified multi-select
  experience: 'new' | 'informal' | 'experienced';     // PM experience level (step 8)
  confidence: { people: number; process: number; business: number };
  reminder: 'morning' | 'lunch' | 'evening' | 'none';  // now persisted (currently dropped)
}
```

- Persistence stays on the existing `kv` API (`setString` / `setJSON`).
- The context exposes setters for each new field plus the existing
  `completeOnboarding()` / `resetOnboarding()`.
- **Bugfix folded in:** today the reminder selection is captured in local state
  but never saved — this design persists it.

---

## 7. Routing, paywall & account

- New screens live under `src/app/(onboarding)/`. The route order is enforced by
  each screen's CTA (`router.push`), matching the current pattern.
- The **reveal CTA** opens the existing paywall (`src/app/paywall.tsx` /
  `src/components/paywall/Paywall.tsx`) when `REVENUECAT_ENABLED` is true;
  otherwise it calls `completeOnboarding()` and routes to the app.
- `completeOnboarding()` continues to set `hasCompletedOnboarding`, so the root
  gate (`resolveLandingRoute`) sends the user to `(tabs)/home` thereafter.
- **No account creation in the funnel.** Per `auth-route.ts`, auth is optional and
  never forced — sign-in is offered later (after a completed unit, or Profile).
  This funnel does not change that.

---

## 8. Components & reuse

- Reuse primitives: `Button`, `Txt`, `Hairline`, `PressableFeedback`, `TOKENS`.
- Reuse `SafeAreaView` + the existing 24px/48px padding rhythm and editorial
  type scale already used across the current onboarding screens.
- New shared pieces (proposed):
  - `OnboardingProgress` — the pre-filled progress bar.
  - `FactScreen` — renders a fact from `onboarding-facts.ts` with a Continue CTA.
  - `ChoiceList` — single/multi-select option list (generalizes the existing
    goal-selection / reminder list UIs, which currently duplicate this markup).
  - `DomainPicker` (step 15) — three domain sections, each previewing 3 lesson
    cards. **Reuse the lesson-card visual from `LessonsList`** (extract a small
    `LessonCard` if needed) and `lessons-index.json` filtered via `DOMAIN_OF` /
    `DOMAIN_TITLE` (`src/data/domains.ts`) rather than re-deriving domain mapping.
  - `onboarding-plan.ts` — the pure `buildPlan()` function (unit-testable).
- Each onboarding screen file stays small and single-purpose.

---

## 9. Testing

- Unit-test `buildPlan()` across input permutations (no exam date, near/far exam
  date, each experience level, each confidence-min, chosen domain == vs != the
  recommendation) — pure function, isolated.
- Unit-test the extended `onboarding-context` persistence (mirrors the existing
  `onboarding-context.test.tsx`).
- Flow test: a user can traverse all 16 steps and reach the reveal; the
  `?skipOnboarding=true` deep-link path still short-circuits to completed.

---

## 10. Out of scope (YAGNI)

- The scored diagnostic quiz (explicitly cut).
- A/B testing infrastructure (the prior `onboarding-flow.md` listed it; not part
  of this build).
- New character art.
- Pricing/paywall redesign — this design only *routes into* the existing paywall.
