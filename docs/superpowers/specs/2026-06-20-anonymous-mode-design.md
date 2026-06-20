# Anonymous Mode + Post-Unit Sign-in Prompt — Design Spec

Date: 2026-06-20 · Branch: `feat/learning-ux-overhaul`

## Goal

Let users use the app **without signing in** (anonymous). After completing a
unit, nudge them to create an account so their progress isn't lost. This pivots
the auth model from "required after onboarding" to **optional / opt-in**.

## Two layers

- **Layer 1 (this spec, implemented):** anonymous gate + post-unit sign-in nudge.
  UI only — no backend.
- **Layer 2 (next milestone, not built):** real progress sync to the AboveTarget
  Cloudflare D1 backend (`lesson_progress`, `user_app_stats`, keyed by Clerk user
  id — the same store the abovetarget-pwa uses), including the **anonymous →
  signed-in merge** (upload local attempts on first sign-in). Only once Layer 2
  ships does "sync across devices" become true; until then copy says "keep your
  progress safe — it only lives on this device."

## Layer 1 changes

1. **Landing gate** (`src/lib/auth/auth-route.ts`, `app/index.tsx`):
   `resolveLandingRoute` now depends only on onboarding — onboarding → tabs.
   Auth never forces a redirect. (Reverted the earlier required-after-onboarding
   gate.)
2. **Post-unit nudge** (`components/auth/SaveProgressCard.tsx`, shown from
   `WrapScreen`): a dismissable-by-ignoring CTA card on the lesson-complete
   screen — "Don't lose your progress / Create a free account" → `(auth)/sign-up`,
   with a "Sign in" link. Renders only when **auth is configured**
   (`authRequired()` === `hasClerkKey()`) and the user is **signed out**. Gating on
   the non-hook `authRequired()` keeps it (and `useAppAuth`) inert in key-less /
   CI runs, so existing `WrapScreen` tests are unaffected.
3. **Profile** gains a **Sign In** row (Account section) when signed out and auth
   is configured; the existing Sign Out row stays for signed-in users.
4. **Sign-out / onboarding-finish** route through `/` → the gate → tabs, so a
   signed-out user lands back in the app anonymously (not trapped on auth).

The `(auth)` screens, `use-email-auth`, `use-social-auth`, and the Clerk
provider stack are unchanged and reused; auth is now reached on demand
(WrapScreen CTA, Profile) instead of via a forced gate.

## Honesty rule

Until Layer 2, progress is device-local. The nudge promises only what's true
("keep it safe / it only lives on this device"), never "sync across devices".
When Layer 2 ships, update the copy.

## Out of scope (Layer 2)

Backend sync, anonymous→account merge, cross-device restore, prompt
frequency-capping/snooze (the card is passive, shown each completion while
signed out — revisit if it feels naggy in testing).
