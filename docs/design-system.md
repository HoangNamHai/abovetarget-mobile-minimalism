# PMP Exam Pro — UI/UX Design System

The single source of truth for visual and interaction design across the app. The
goal is **consistency**: every screen should be buildable from the tokens,
components, and rules below without inventing new values.

> Source of truth in code:
> - Colors → `src/theme/tokens.ts` (+ `src/theme/brand.css` for NativeWind/uniwind)
> - Type variants → `src/components/primitives/Txt.tsx`
> - Fonts → `src/components/FontGate.tsx`
> - Buttons / cards → `src/components/primitives/Button.tsx`, `src/theme/variants.ts`
> - Animation → `src/components/primitives/Appear.tsx`, `PressableFeedback.tsx`
> - Rich text → `src/components/primitives/RichText.tsx`
>
> **Rule:** never hardcode a hex or magic size in a screen if a token/component
> already covers it. If a new value is genuinely needed, add it here first.

---

## 1. Design principles

1. **Editorial & monochrome.** Bold condensed display type on a near-white
   canvas, strict black/white/grey. Color is used sparingly and only to carry
   meaning (selection, success, error).
2. **Type does the work.** Hierarchy comes from the Anton/Hanken pairing and
   size, not from boxes and shadows. There are no drop shadows.
3. **One action per moment.** Solid black = the primary action. Everything else
   is quieter (outlined, grey, or text).
4. **Calm motion.** A single, gentle entrance animation everywhere; quick press
   feedback. No bounce, no spinners-as-decoration.
5. **Honest UI.** Every control does what it says; progress reflects real data.

---

## 2. Color tokens

All colors come from `TOKENS` (`src/theme/tokens.ts`). Use the **token name**, not
the hex.

### Core palette

| Token | Hex | Use |
|---|---|---|
| `primary` | `#000000` | Primary actions, ink, filled buttons, active bars |
| `on-primary` | `#ffffff` | Text/icons on `primary` |
| `background` / `surface` | `#f9f9f9` | App canvas |
| `on-background` | `#1a1c1c` | Default body text |
| `surface-dim` | `#dadada` | Subtle dividers / muted dots |
| `surface-container-lowest` | `#ffffff` | Cards, sheets, option backgrounds |
| `surface-container-low` | `#f3f3f3` | Subtle raised surface (module headers) |
| `surface-container` | `#eeeeee` | Chips/disabled fills, filter banner |
| `surface-container-high` | `#e8e8e8` | Tray chip fill |
| `surface-container-highest` | `#e2e2e2` | Progress-bar track |
| `outline` | `#7e7576` | Secondary/meta text, muted labels |
| `outline-variant` | `#cfc4c5` | Borders, hairlines |

### Semantic / accent colors

These are **the only** non-greyscale colors, centralized in `src/theme/accents.ts`
(`ACCENTS`). Import from there; don't introduce new ones.

| Name | Hex | Meaning | Where |
|---|---|---|---|
| Selection blue | `#2563EB` | "Your current pick" (pre-check) | `QuizOption` selected |
| Success green | `#16A34A` | Correct answer | `FeedbackModal` success sheet |
| Error red | `#DC2626` | Wrong / try again | `FeedbackModal` retry sheet |
| Reveal orange | `#C2410C` | Answer reveal | `FeedbackModal` reveal sheet |
| Hairline grey | `#9ca3af` | Table borders | `RichText` tables |

> Decorative only: `FireworkBurst` success particles (pastel set `#FDE68A`,
> `#FCA5A5`, `#FACC15`, `#F9A8D4`, `#BBF7D0`, `#93C5FD`). Not part of the UI palette.

### Color usage rules

- **Black is reserved for actions and ink.** Don't use black to indicate
  "selected" — that's blue's job.
- **Selection = blue, committed/correct = green, wrong/locked = grey, error = red.**
- White text on `primary`/blue/green/red/ink; dark text (`on-background`) on light surfaces.
- Muted/secondary text = `outline`. Never grey-on-grey below ~4.5:1.

---

## 3. Typography

### Fonts (registered in `FontGate.tsx`)

| Family string | Source | Role |
|---|---|---|
| `Anton` | Anton 400 | **Display** — headlines, numbers, question prompts |
| `Hanken Grotesk` | Hanken 400 | **Body** & labels |
| `Hanken Grotesk Medium` | Hanken 500 | Emphasis |
| `Hanken Grotesk Bold` | Hanken 700 | Inline **bold**, table headers |
| `Hanken Grotesk ExtraBold` | Hanken 800 | Heavy emphasis (rare) |
| `Hanken Grotesk Light` | Hanken 300 | Light captions (rare) |

### The `Txt` primitive — always use it

`<Txt variant="display | body | label">` (`src/components/primitives/Txt.tsx`).

- `display` → Anton, `letterSpacing: -0.5`. **Auto line-height safety:** Anton clips
  at the top when `lineHeight ≈ fontSize`, so `Txt` enforces a min `lineHeight` of
  **1.35 × fontSize** for inline-sized display text. When sizing display via
  `className`, pass an explicit `lineHeight` at the call site.
- `body` / `label` → Hanken Grotesk.

### Type scale (canonical)

| Role | Size / line-height | Font | Notes |
|---|---|---|---|
| Hero numeral (streak) | 64 / 64 | display | Home only |
| Stat numeral | 40 / 44 | display | Home stats |
| Feedback headline | 36 / 1.35× | display | "EXCELLENT WORK." |
| Screen title | `text-3xl` 30 / **42** | display | Hook/Reason/Wrap (lineHeight required) |
| Question prompt | 24 / 33 | display | Single/Multi/Drag prompts |
| Section title | 18–20 | display | "YOUR PROGRESS", milestone |
| **Body (reading)** | `text-lg` **18** / `leading-relaxed` | body | Lesson narrative, explanations |
| Secondary / detail | `text-base` 16 | body | Sub-text, option labels, list details |
| Eyebrow / label | 11–12, `letterSpacing 2–4`, **UPPERCASE** | label | Section headers, meta |
| Micro meta | 10–11 | label | "DOMAIN · 8 MIN", badges |

Rules:
- **Body reading text is 18px** (`text-lg leading-relaxed`). Don't drop lesson
  prose below 16px.
- Eyebrow labels are uppercase with wide tracking and `outline` color.
- Headlines are UPPERCASE for display moments (feedback, milestones); sentence
  case is acceptable for authored lesson titles.

**Inline emphasis (`**bold**`):**
- In **body** text → bold face (`Hanken Grotesk Bold`).
- In **display headings** (Anton, which has no bold weight) → recolor the span
  with `ACCENTS.selection` (blue) instead. Use `parseInlineMarkdown(text, { color })`
  (see `QuestionPrompt`). Never let raw `**` reach the screen.

---

## 4. Spacing, radius, layout

### Spacing scale

Use multiples of 4. Common values in use: **4, 6, 8, 12, 16, 20, 24, 32**.

- Screen horizontal padding: **24** (lesson screens) / **20** (dashboard, profile).
- Section vertical rhythm: **24** between blocks, **16** within.
- Inline gaps: **8** (chips), **12** (options/zones), **16** (stat groups).

### Radius scale (canonical)

Source of truth in code: `RADIUS` in `src/theme/tokens.ts`. Import it — never
hardcode a radius literal in a screen.

| Token | `RADIUS` key | Value | Use |
|---|---|---|---|
| `radius-card` | `RADIUS.card` | **4** | Cards, quiz options, drop zones (= Tailwind `rounded-sm`) |
| `radius-media` | `RADIUS.media` | **8** | Image cards (lesson hero), tables |
| `radius-sheet` | `RADIUS.sheet` | **16** | Bottom-sheet top corners |
| `radius-pill` | `RADIUS.pill` | **999** | Buttons, chips, badges, nav buttons (`rounded-full`) |
| `radius-track` | `RADIUS.track` | **3** | Thin progress-bar tracks |

All card containers use `RADIUS.card` (4). Don't introduce new radii outside this
scale. **Exception:** geometric circles use `radius = ½ · width/height` computed
inline (selection dots, the Elite progress ring) — these are shapes, not scale
values. The **Elite** brand is sharp (`rounded-none` / `0`), so Elite surfaces
deliberately opt out of `RADIUS.card`.

### Layout patterns

- Screens are a `ScrollView` on `background`, `showsVerticalScrollIndicator={false}`.
- **Safe area:** lesson player applies a top inset; respect notch/status bar.
- **Dividers:** use the `Hairline` primitive (`outline-variant`, hairline width).
  On dark surfaces use a translucent white divider instead.
- **Section header pattern:** uppercase eyebrow (11px / tracking) + optional
  display title with a 1px `primary` bottom rule.

---

## 5. Components

### Button (`primitives/Button.tsx`)

Pill, uppercase label, `tracking-widest`, `px-6 py-3`, light haptic on press
(respects the Haptics setting).

| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| `primary` | `primary` (black) | `on-primary` | — | The one main action |
| `secondary` | `on-primary` (white) | `primary` | `primary` | Secondary / on-dark surfaces |

- Exactly **one** primary button per view where possible.
- On dark/colored surfaces (reveal sheet, black CTA cards) use `secondary` for contrast.

### Cards (`theme/variants.ts` → `cardVariants`)

- **monograph** (default): `rounded-sm`, 1px `outline-variant` border, `surface-container-lowest` fill.
- **elite**: `rounded-none`, 2px `primary` border.

### QuizOption (`components/quiz/QuizOption.tsx`) — answer states

| State | Fill | Border | Text | Notes |
|---|---|---|---|---|
| Unselected | white | `outline-variant` | `on-background` | Default card |
| **Selected** | **`#2563EB`** | blue | white | Pre-check pick |
| Disabled (wrong/locked) | `surface-container` | `outline-variant` | `outline`, **strikethrough**, 60% opacity | Inert; no press feedback |

Precedence: **disabled > selected > unselected**.

### Drag & drop (`questions/DragDrop.tsx`)

- **Drop zones:** card-like — white fill, `outline-variant` border, `radius-card`;
  active drop target = `primary` border + `surface-container-low` fill.
- **Placed chip** (committed): `primary` pill, white text.
- **Tray chip** (idle): `surface-container-high` pill + border; **picked-up** =
  `primary` pill, white text.

### Feedback sheet (`lesson/FeedbackModal.tsx`)

- Bottom sheet, `radius-sheet` top corners, **not drag-dismissable** (no grab handle;
  dismiss via action button).
- Three identities, all white text: **success = green**, **retry = red**,
  **reveal = orange**. Reveal uses a `secondary` (white) button for contrast.
- Headline 36 display uppercase; explanation 18/28 via `RichText`.

### RichText (`primitives/RichText.tsx`)

Renders the authored-markdown subset: `**bold**`, bullet (`-`/`*`) lists, numbered
(`1.`) lists, pipe tables, blank-line paragraphs. Typography/colour pass through
via `className`/`style`. **Use `RichText`, not `Txt`, for any authored content**
(it may contain markdown).

### Lists & rows

- **Lesson card** (lessons list): full-width **16:9** hero image (`radius-media`,
  `contentFit="cover"`, 200ms transition), title 17/700, meta row (`domain · N min`).
- **Settings/list row:** label left, control/`›`/value right, `Hairline` between,
  inside a `cardVariants` card. Link rows use a `›` chevron.

---

## 6. Motion & animation guidelines

Two reusable behaviors cover the whole app. Don't author bespoke animations
without adding them here.

### Entrance — `Appear` (`primitives/Appear.tsx`)

The standard "objects appear" motion:

- **Fade** opacity 0 → 1, **duration 300ms**.
- **Small slide** up from **+12px** (`translateY`). No spring, no bounce.
- **Stagger** `index * 80ms` down a list (prompt = 0, items = 1…n, trailing
  button = n+1).
- For items that **re-mount** during interaction (e.g. a drag chip returning to
  the tray), **cap the delay** (`Math.min(i, 6) * 50`) so it never lags.

Usage: wrap each top-level object on a screen in `<Appear index={i}>`. This is
applied across all learning-unit screens (Hook, Reason, Transfer, Wrap,
Challenge/Practice questions) — keep new screens consistent.

### Press feedback — `PressableFeedback` (`primitives/PressableFeedback.tsx`)

- Scale to **0.96** on press-in (80ms), back to **1.0** on press-out (120ms).
- Honors `disabled` (no scale, no `onPress`).
- All tappable custom surfaces (options, chips, cards, rows) use this, not bare
  `Pressable`.

### Other motion

- **Images:** `expo-image` `transition={200}` for fade-in.
- **Feedback sheet:** native modal slide-up; `FireworkBurst` only on success.
- **Carousel** (Hook failure cards): paged horizontal scroll with dot indicators
  + prev/next pill buttons.

### Timing reference

| Purpose | Duration | Curve |
|---|---|---|
| Entrance fade/slide | 300ms | ease (default) |
| Press in / out | 80 / 120ms | timing |
| Image fade | 200ms | — |
| Stagger step | 80ms (capped 50ms on re-mount) | — |

---

## 7. Iconography

- **MaterialIcons** via `@expo/vector-icons`, mapped through `components/.../icon-map`.
- Carousel/nav controls: `chevron-left` / `chevron-right`; list affordance: `›` glyph.
- Tint icons with `on-background` (default) or `on-primary`/`outline` per surface.

---

## 8. Domains (content taxonomy)

Three PMP domains, single source `src/data/domains.ts`:

| Key | Title | Real lesson count |
|---|---|---|
| `people` | People | 12 |
| `process` | Process | 32 |
| `business` | Business Environment | 7 |

- Lesson JSON tags Title-case (`People`/`Process`/`Business Environment`);
  progress/home use lowercase keys. **Always** map via `DOMAIN_OF`.
- Progress percentages must use **real per-domain totals** (`domainLessonTotals()`),
  never a hardcoded denominator.

---

## 9. Brand system

Two brands via `BrandProvider` (`theme/brand-context`), toggled by `BrandSwitch`:

- **monograph** (default, shipped): soft radius, 1px borders, the system above.
- **elite** (not shipped; mock data): sharp `rounded-none`, 2px black borders.

Build for **monograph** unless explicitly working on Elite. Keep both reading from
the same `TOKENS`.

---

## 10. Consistency checklist (per screen)

- [ ] Colors come from `TOKENS`; the only non-grey colors are the §2 accents.
- [ ] All text uses `Txt`; authored/markdown content uses `RichText`.
- [ ] Body reading text is 18px (`text-lg leading-relaxed`); eyebrows uppercase + tracked.
- [ ] Display headings have an explicit/auto `lineHeight` (no Anton clipping).
- [ ] One `primary` button; secondary actions are `secondary`/text.
- [ ] Cards/options use `radius-card` (4) + `outline-variant` border; pills use `radius-pill`.
- [ ] Selected = blue, correct = green, wrong/locked = grey strikethrough, error = red.
- [ ] Tappable surfaces use `PressableFeedback`; objects enter via `Appear`.
- [ ] Spacing is on the 4-pt scale; screen padding 20–24.
- [ ] Any progress/percentage reflects real data, not placeholders.

---

## 11. Known inconsistencies to resolve

1. **Sounds setting** persists but has no audio layer yet (toggle is inert) — wire
   real playback or hide until shipped.
2. **Legal/links** in `src/config/links.ts`: Terms/Privacy point to
   `abovetarget.org`; confirm these are final before release.

_Resolved: card radius standardized to 4; stale `DEFAULT_PROGRESS` domain totals
(`total: 50`) removed — domain progress now derives real denominators from
`domainLessonTotals()`. Radius scale extracted to `RADIUS` in
`src/theme/tokens.ts` (single source of truth) and every screen now imports it
instead of hardcoding literals; off-scale strays fixed — Takeaways quick-jump
chips `6 → RADIUS.pill`, Elite dashboard cards `4 → 0` (sharp, per Elite brand)._
