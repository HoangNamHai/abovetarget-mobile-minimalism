# Home Upgrade CTA — Design

**Date:** 2026-06-21
**Status:** Approved
**Branch:** `feat/home-upgrade-cta`

## Goal

Boost subscription conversion by showing free-tier users a premium upgrade
call-to-action block on the Home screen. It is the first colored surface in an
otherwise strictly monochrome editorial app, so it should feel premium, not
garish — an on-brand deep-ink → gold gradient.

## Decisions

- **Visual style:** On-brand gradient (deep-ink → refined gold). The only
  colored surface in the app.
- **Placement:** Directly after the "Continue Learning" card (and its trailing
  `<Hairline />`), before "Recently Learned". Users engage with their primary
  action first, then see the upsell.
- **Messaging:** Aspirational one-liner — *"Pass the PMP faster with unlimited
  practice."* under an `UNLOCK PMP EXAM PRO` eyebrow.
- **Dismissal:** Always visible for free users. No dismiss state. Disappears
  automatically when the user becomes premium.
- **Scope:** Monograph dashboard only (the shipped brand). Elite dashboard is
  not shipped and is intentionally skipped.

## Component

New presentational component: `src/components/dashboard/UpgradeBlock.tsx`

- **Props:** `{ onPress: () => void }`. No data dependencies — fully testable in
  isolation.
- **Visual:** Full-width card (`RADIUS.card`) rendered with
  `expo-linear-gradient` (already a dependency). Diagonal deep-ink → gold
  gradient. Contents on light text:
  - Eyebrow label: `UNLOCK PMP EXAM PRO` (uppercase, letter-spaced — matches the
    existing editorial label style).
  - Display line: *"Pass the PMP faster with unlimited practice."*
  - CTA: `Go Premium →`, rendered with the existing `Button` `secondary`
    variant (the same pattern the Continue Learning card uses on its dark
    background).
- The entire card is wrapped in `PressableFeedback` so the gradient area itself
  is a hit target, not only the button. Both invoke the same `onPress`.

## Color handling

The global `TOKENS` palette is pure monochrome (`primary: #000000`), with no
gold/accent token. To keep blast radius to a single file, the premium accent
colors are defined as **local constants inside `UpgradeBlock.tsx`**, clearly
commented as "the app's only colored surface — premium accent".

- Gradient: `#0A0A0A → #B98A2E` (refined gold), diagonal.
- Light text uses the brand's existing opacity conventions
  (`rgba(255,255,255,0.7)` for labels, full white for the display line) — the
  same values the Continue Learning card uses on its dark background.

## Gating & wiring

- `MonographDashboard` reads `const { isPremium } = useSubscription();` and
  renders `{!isPremium && <UpgradeBlock onPress={onUpgrade} />}`.
- Navigation stays in the route layer (consistent with the existing
  `onStartStudy` / `onOpenLesson` / `onOpenDomain` props): add an `onUpgrade`
  prop threaded through `DashboardScreen` → `MonographDashboard`, wired in
  `src/app/(tabs)/home.tsx` to `router.push('/paywall')`.
- The existing `/paywall` route handles offerings, purchase, and restore. This
  block is purely an additional entry point into it.

### No-op while RevenueCat is disabled

RevenueCat is off by default (`REVENUECAT_DISABLED`), in which case
`isPremium === true` for every user. The block is therefore invisible in the
current build and only appears once RevenueCat is enabled and the user is
genuinely free-tier. Zero impact on the shipped build.

## Testing

Extend `src/components/dashboard/__tests__/dashboard.test.tsx`:

- Free user (`isPremium: false`) → the block renders; tapping `Go Premium`
  invokes the upgrade navigation handler.
- Premium user (`isPremium: true`) → the block is absent.

## Out of scope

- Dismiss / snooze behavior.
- Usage-aware copy (e.g. "2 of 3 free lessons used today").
- Elite dashboard.
- Adding a global `accent`/`gold` design token (left as a possible future
  cleanup if more color is introduced elsewhere).
