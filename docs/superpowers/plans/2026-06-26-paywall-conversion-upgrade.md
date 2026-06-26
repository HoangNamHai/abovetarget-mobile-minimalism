# Paywall Conversion Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the high-leverage paywall tactics from `docs/thinking/paywall.md` (free-trial "$0.00" CTA, annual price-anchoring, a compliant win-back offer on dismiss, and a peak-moment review ask) to PMP Exam Pro — without tripping Apple's 3.1.2 / 2.3.1 / 5.6 rejection rules.

**Architecture:** The app already places the paywall correctly (end of onboarding, after a built study plan + commitment) and already has RevenueCat wiring, a `Paywall` component, a streak system, and a commitment screen. This plan does NOT restructure the funnel. It (a) adds an **annual** package and **free-trial** support to the pricing model, (b) makes the paywall App-Store-compliant (auto-renew disclosure + Terms/Privacy links) while changing the CTA to "$0.00", (c) adds a **single, exitable, genuinely-different win-back offer** when the onboarding paywall is dismissed, and (d) adds a native `expo-store-review` ask at the post-plan-reveal peak.

**Tech Stack:** Expo SDK 56, React Native, expo-router, TypeScript, `react-native-purchases@^10.4.0`, Jest + `jest-expo` + `@testing-library/react-native`, `expo-store-review` (to be added).

---

## Current State (snapshot — 2026-06-26)

Where the billing switch actually stands today, so every task below starts from a known baseline:

- **Billing flag (`EXPO_PUBLIC_REVENUECAT_ENABLED`): OFF in production.** It is `true` for `development` / `development-device` / `preview` (`eas.json`) and in local `.env`, but `.env.production:8` sets it `false` and the `production` profile in `eas.json` does **not** set it. So the **shipped app collects no money**: the SDK never initialises, the paywall is hidden, and every user is treated as premium (ship-as-free). → This is **Task 8**, intentionally the last task.
- **API keys (`src/config/revenuecat.ts:33-34`): still Test Store.** Both iOS and Android use the `test_…` key — purchases are *simulated*, generate **no revenue**, and never touch App Store / Play billing. No live `appl_…` / `goog_…` keys yet. RevenueCat's SDK **crashes if a Test-Store key ships in a production build**, so the flag and the keys MUST flip together (Task 8) — flipping the flag alone would crash the release.
- **Store products: none yet.** No auto-renewable subscriptions exist in App Store Connect / Play Console. This is the hard prerequisite gating Task 8.
- **Auth is optional — anonymous use is fully supported and escapable everywhere.** Every `(auth)` screen now carries a "Continue as guest" ✕ that exits back into the app — `sign-in`, `sign-up`, `forgot-password`, `verify-email` — via the shared pure helper `src/lib/auth-dismiss.ts` (`authDismissAction({canGoBack})`, mirrors `paywall-close.ts`: `back` when poppable, else `replace('/')`). Committed: `0e41b6c`, `6a17963`. This keeps the paywall's **"Sign in to subscribe"** path (shown to anonymous users when RC is on, because the app has **no anonymous premium**) from trapping users on a dead-end sign-in screen.
- **Android Phase 1 verified** (Clerk **production** `pk_live` + RC **Test Store**): app boots, onboarding completes, the RC SDK loads the 3-package `default` offering, and the Clerk-prod sign-in renders cleanly (no "Native API disabled" error). Live purchase/restore on Android still awaits the demo-account password (Test Store) and, for real billing, Task 8.

**Net: the "charge real money" switch is OFF and cannot be flipped safely yet.** Tasks 1–7 build the compliant paywall; Task 8 (plus the store-side products) is the only step that actually turns billing on.

## Global Constraints

These are copied from the Apple App Store Review research done for this plan. **Every task implicitly inherits them.**

- **3.1.2 (subscriptions):** The paywall MUST clearly show, near the CTA, for the selected plan: exact price, billing frequency, free-trial length (if any), and that it **auto-renews until cancelled**. Functional **Terms of Use (EULA)** and **Privacy Policy** links MUST be present in-app on the paywall. A **Restore Purchases** action MUST be present (already exists — keep it).
- **"$0.00" CTA is allowed ONLY** when the trial length + post-trial price + auto-renew terms are disclosed adjacent to the button at ≥16pt. Never show "$0.00" with no surrounding disclosure.
- **Annual anchoring:** showing a large "/mo" figure while the user is actually billed yearly is a known rejection. Any per-month figure on an annual plan MUST be visibly qualified as billed yearly (e.g. "$59.99/yr ($5.00/mo)").
- **2.3.1 (accurate metadata):** Do NOT flip the live app from freemium to a hard wall via remote config after release. Enable RevenueCat at **build time** per profile (compile-time env), and keep the paywall **dismissible** (the close ✕ stays). Do not remove the close button. The same dismiss pattern already backs every `(auth)` screen via `src/lib/auth-dismiss.ts` — anonymous use must stay escapable everywhere, so do not regress those ✕ controls either.
- **5.6 (aggressive patterns):** Do NOT immediately re-show a paywall after a decline. The win-back offer is shown **once**, must be **exitable**, and must be a **genuinely different** offer (longer trial / real discount), not the same screen again.
- **Review ask:** Use the native `expo-store-review` (`StoreReview.requestReview()`) API only. Never deep-link to the write-review page and never gate/incentivize a review. The OS rate-limits prompts (~3/yr); the app must no-op gracefully when unavailable.
- **Prices are not authoritative in code.** Live localized amounts come from RevenueCat (`product.priceString` / `product.pricePerMonthString`). `fallbackPrice` is offline-only placeholder. Never hardcode a charged price into a CTA.
- **RevenueCat SDK facts (verified in `@revenuecat/purchases-typescript-internal`):** `pkg.product.introPrice` is `{ price, priceString, cycles, period, periodUnit, periodNumberOfUnits } | null` — a **free trial** is `introPrice.price === 0`. `pkg.product.pricePerMonthString` is `string | null`. `pkg.product.currencyCode` is `string`.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/config/pricing.ts` | Tier metadata for the **Profile plan-status label** (NOT the paywall — the paywall is RC-offering-driven) | Modify — add `annual` tier so `plan-status.ts` can label annual subs |
| `src/config/revenuecat.ts` | RC product ids + entitlement + limits | Modify — add `ANNUAL` product id |
| `src/lib/paywall-pricing.ts` | Pure helpers: trial detection, CTA label, per-month anchor string | **Create** |
| `src/lib/__tests__/paywall-pricing.test.ts` | Unit tests for the helpers | **Create** |
| `src/config/legal.ts` | EULA + Privacy URLs (single source) | **Create** |
| `src/components/paywall/Paywall.tsx` | Paywall UI: plans, CTA, disclosure, legal links | Modify |
| `src/components/paywall/__tests__/Paywall.test.tsx` | Paywall component tests | Modify |
| `src/lib/paywall-close.ts` | Where ✕ / decline routes | Modify — route onboarding decline to win-back once (keep its shape consistent with the sibling `src/lib/auth-dismiss.ts`) |
| `src/lib/__tests__/paywall-close.test.ts` | Tests for close routing | Modify |
| `src/lib/auth-dismiss.ts` + `(auth)` screens | "Continue as guest" ✕ exit on every auth screen | **Done** (`0e41b6c`, `6a17963`) — do not regress; reference for routing-helper consistency |
| `src/app/paywall.tsx` | Paywall screen wrapper (reads `from`/`next`) | Modify — pass a `wonBack`/offer flag through |
| `src/app/win-back.tsx` | The single second-chance offer screen | **Create** |
| `src/lib/review-ask.ts` | Wraps `expo-store-review`, fires once at peak | **Create** |
| `src/lib/__tests__/review-ask.test.ts` | Unit tests | **Create** |
| `src/app/(onboarding)/domain.tsx` | Final onboarding screen → plan reveal → paywall | Modify — trigger review ask at the reveal peak |
| `src/data/onboarding-facts.ts` or `belief.tsx` | "Name the bad outcome" loss-framing copy | Modify |
| `eas.json` | Build profiles | Modify — enable RC + prod keys in the production profile |

---

## Task 1: Add the Annual tier and product id

**Files:**
- Modify: `src/config/pricing.ts`
- Modify: `src/config/revenuecat.ts:50-54`
- Test: `src/config/__tests__/pricing.test.ts` (create if absent — check first with `ls src/config/__tests__`)

**Interfaces:**
- Produces: `PricingTierId` now includes `'annual'`; `PRICING_TIERS` contains an `annual` tier with `packageId: '$rc_annual'`, `productId: 'annual'`. `PRODUCTS.ANNUAL = 'pmp_pro_annual'`.

> **What this task actually controls (read before starting):** `PRICING_TIERS` / `PAID_TIERS` are consumed **only** by `src/config/pricing.ts` itself and `src/lib/subscription/plan-status.ts` (the Profile "Plan" row). **The paywall does NOT read them** — `Paywall.tsx` renders the live RevenueCat offering `packages` directly (`Paywall.tsx:129`) and ignores `highlighted` / `badge`. The default selection and visual emphasis come from `defaultPackageId()`, which **already prefers `ANNUAL`** (`Paywall.tsx:37-42`).
>
> So the real value of this task is: give `plan-status.ts` an `annual` tier so a purchased annual subscription gets a correct label on the Profile screen. The "annual is the anchored best-value plan on the paywall" outcome is delivered by the **RevenueCat `default` offering** (Task 8 store-side config) plus the per-month anchor (Task 4) — **not** by editing `highlighted` here. Likewise, removing `weekly` from the *sold lineup* happens by dropping `$rc_weekly` from the RC offering (Task 8), **not** by changing `PAID_TIERS`.
>
> ⚠️ **Identifier mismatch to confirm:** existing tiers use a **bare** `productId` (`'monthly'`), while `PRODUCTS.MONTHLY = 'pmp_pro_monthly'`. `tierForProductId` matches the bare form against `CustomerInfo`'s `productIdentifier`. Before relying on the annual plan-status label, confirm what identifier the live store / RC actually emits (bare `annual` vs `pmp_pro_annual`) and set `productId` to match — otherwise the Profile label silently falls through.
>
> Keep the `weekly` tier object only if other screens reference it — grep first (Step 1).

- [ ] **Step 1: Confirm whether `weekly` is referenced elsewhere**

Run: `grep -rn "'weekly'\|\"weekly\"\|\$rc_weekly\|PRODUCTS.WEEKLY\|WEEKLY" src --include=*.ts --include=*.tsx | grep -v node_modules`
Expected: a short list. If `weekly` is only referenced in `pricing.ts` / `revenuecat.ts`, it is safe to drop from `PAID_TIERS`. If referenced in UI, leave the object but ensure it is **not** in the default offering shown.

- [ ] **Step 2: Write the failing test**

Create/extend `src/config/__tests__/pricing.test.ts`:

```typescript
import { PRICING_TIERS, PAID_TIERS } from '../pricing';

test('includes an annual tier mapped to the $rc_annual package', () => {
  const annual = PRICING_TIERS.find((t) => t.id === 'annual');
  expect(annual).toBeDefined();
  expect(annual?.packageId).toBe('$rc_annual');
  expect(annual?.productId).toBe('annual');
  expect(annual?.highlighted).toBe(true);
});

test('annual is the only highlighted paid tier', () => {
  const highlighted = PAID_TIERS.filter((t) => t.highlighted);
  expect(highlighted).toHaveLength(1);
  expect(highlighted[0].id).toBe('annual');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- pricing.test`
Expected: FAIL — no tier with id `annual`.

- [ ] **Step 4: Add the annual tier and move the highlight off monthly**

In `src/config/pricing.ts`, change the type and add the tier. Update `PricingTierId`:

```typescript
export type PricingTierId = 'free' | 'weekly' | 'monthly' | 'annual' | 'lifetime';
```

Insert this object into `PRICING_TIERS` immediately **before** the `monthly` object, and remove `highlighted: true` / `badge: 'Best Value'` from `monthly`:

```typescript
  {
    id: 'annual',
    name: 'Yearly',
    badge: 'Best Value',
    highlighted: true,
    cta: 'Upgrade',
    packageId: '$rc_annual',
    productId: 'annual',
    fallbackPrice: '$59.99',
    fallbackPeriod: '/year',
    features: [
      'All lessons unlocked',
      'All learning paths',
      'Best price — billed yearly',
      'Cancel anytime',
    ],
  },
```

Update the RevenueCat-mapping comment block at the top of the file to list `annual → package $rc_annual → product annual`.

- [ ] **Step 5: Add the product id**

In `src/config/revenuecat.ts`, add to `PRODUCTS`:

```typescript
export const PRODUCTS = {
  WEEKLY: 'pmp_pro_weekly',
  MONTHLY: 'pmp_pro_monthly',
  ANNUAL: 'pmp_pro_annual',
  LIFETIME: 'pmp_pro_lifetime',
} as const;
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- pricing.test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/config/pricing.ts src/config/revenuecat.ts src/config/__tests__/pricing.test.ts
git commit -m "feat(pricing): add annual tier as the anchored best-value plan"
```

---

## Task 2: Trial + per-month pricing helpers

**Files:**
- Create: `src/lib/paywall-pricing.ts`
- Test: `src/lib/__tests__/paywall-pricing.test.ts`

**Interfaces:**
- Produces:
  - `freeTrial(pkg: PurchasesPackage): { days: number } | null` — non-null only when `introPrice.price === 0`; converts `periodUnit`/`periodNumberOfUnits` to a day count.
  - `ctaLabel(pkg: PurchasesPackage | null | undefined): string` — `'Start — $0.00 today'` when the package has a free trial, else `'Continue'`.
  - `perMonthAnchor(pkg: PurchasesPackage): string | null` — for an ANNUAL package, the localized `pricePerMonthString` (or null).
  - `disclosure(pkg: PurchasesPackage | null | undefined): string` — the auto-renew sentence to render under the CTA.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/paywall-pricing.test.ts`:

```typescript
import { freeTrial, ctaLabel, perMonthAnchor, disclosure } from '../paywall-pricing';

function pkg(over: any = {}) {
  return {
    identifier: over.identifier ?? 'annual',
    packageType: over.packageType ?? 'ANNUAL',
    product: {
      identifier: 'prod',
      title: 'Yearly',
      priceString: over.priceString ?? '$59.99',
      pricePerMonthString: over.pricePerMonthString ?? '$5.00',
      currencyCode: 'USD',
      price: 59.99,
      introPrice: over.introPrice ?? null,
    },
  } as any;
}

const trial7 = { price: 0, priceString: '$0.00', cycles: 1, period: 'P1W', periodUnit: 'WEEK', periodNumberOfUnits: 1 };

test('freeTrial returns day count for a zero-price intro', () => {
  expect(freeTrial(pkg({ introPrice: trial7 }))).toEqual({ days: 7 });
});

test('freeTrial is null when intro price is non-zero', () => {
  expect(freeTrial(pkg({ introPrice: { ...trial7, price: 1.99 } }))).toBeNull();
});

test('freeTrial is null when there is no intro price', () => {
  expect(freeTrial(pkg())).toBeNull();
});

test('ctaLabel is the $0.00 trial CTA when a free trial exists', () => {
  expect(ctaLabel(pkg({ introPrice: trial7 }))).toBe('Start — $0.00 today');
});

test('ctaLabel is Continue without a trial or package', () => {
  expect(ctaLabel(pkg())).toBe('Continue');
  expect(ctaLabel(null)).toBe('Continue');
});

test('perMonthAnchor returns the localized per-month string only for annual', () => {
  expect(perMonthAnchor(pkg())).toBe('$5.00');
  expect(perMonthAnchor(pkg({ packageType: 'MONTHLY', pricePerMonthString: '$9.99' }))).toBeNull();
});

test('disclosure names trial length, price, period and auto-renew', () => {
  const d = disclosure(pkg({ introPrice: trial7 }));
  expect(d).toContain('7-day free trial');
  expect(d).toContain('$59.99');
  expect(d).toContain('auto-renews');
});

test('disclosure without a trial still names price + auto-renew', () => {
  const d = disclosure(pkg());
  expect(d).toContain('$59.99');
  expect(d).toContain('auto-renews');
  expect(d).not.toContain('free trial');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- paywall-pricing`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helpers**

Create `src/lib/paywall-pricing.ts`:

```typescript
import type { PurchasesPackage } from 'react-native-purchases';

const UNIT_DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

/** A free trial exists only when the intro offer is genuinely $0. */
export function freeTrial(pkg: PurchasesPackage): { days: number } | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const days = (UNIT_DAYS[intro.periodUnit] ?? 0) * intro.periodNumberOfUnits;
  return days > 0 ? { days } : null;
}

/** "$0.00" CTA only when a real trial backs it (Apple 3.1.2). */
export function ctaLabel(pkg: PurchasesPackage | null | undefined): string {
  if (pkg && freeTrial(pkg)) return 'Start — $0.00 today';
  return 'Continue';
}

/** Localized per-month figure for annual plans only (the legible anchor). */
export function perMonthAnchor(pkg: PurchasesPackage): string | null {
  if (pkg.packageType !== 'ANNUAL') return null;
  return pkg.product.pricePerMonthString ?? null;
}

/** Auto-renew disclosure rendered adjacent to the CTA (Apple 3.1.2). */
export function disclosure(pkg: PurchasesPackage | null | undefined): string {
  if (!pkg) return 'Auto-renews until cancelled. Cancel anytime in Settings.';
  const price = pkg.product.priceString;
  const trial = freeTrial(pkg);
  const head = trial
    ? `${trial.days}-day free trial, then ${price}. `
    : `${price}. `;
  return `${head}Auto-renews until cancelled. Cancel anytime in Settings.`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- paywall-pricing`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/paywall-pricing.ts src/lib/__tests__/paywall-pricing.test.ts
git commit -m "feat(paywall): trial-aware CTA + disclosure + per-month anchor helpers"
```

---

## Task 3: Legal links config + paywall disclosure block (3.1.2 compliance)

**Files:**
- Create: `src/config/legal.ts`
- Modify: `src/components/paywall/Paywall.tsx`
- Modify: `src/components/paywall/__tests__/Paywall.test.tsx`

**Interfaces:**
- Consumes: `disclosure`, `perMonthAnchor` (Task 2).
- Produces: paywall renders `testID="paywall-disclosure"`, `testID="paywall-terms"`, `testID="paywall-privacy"`.

> This task is a **compliance prerequisite for shipping at all** — the current paywall has no auto-renew disclosure and no Terms/Privacy links, which is a 3.1.2 rejection on its own. The real published legal URLs are confirmed (below); just verify both pages load before submission.

- [ ] **Step 1: Create the legal URLs config**

Create `src/config/legal.ts` (these are the confirmed live URLs — verify both return 200 before submitting):

```typescript
// Single source of truth for legal URLs surfaced in-app (App Store 3.1.2 requires
// Terms of Use / EULA + Privacy Policy reachable from the paywall).
export const LEGAL_URLS = {
  terms: 'https://abovetarget.org/terms/',
  privacy: 'https://abovetarget.org/privacy/',
} as const;
```

- [ ] **Step 2: Write the failing tests**

Add to `src/components/paywall/__tests__/Paywall.test.tsx`. First extend the `pkg()` helper at the top of that file so products carry the new fields (edit the existing helper to add `pricePerMonthString`, `currencyCode`, `introPrice`):

```typescript
function pkg(identifier: string, packageType: string, priceString: string, introPrice: any = null) {
  return {
    identifier,
    packageType,
    product: {
      identifier: `prod_${identifier}`, title: identifier, description: '', price: 1, priceString,
      pricePerMonthString: packageType === 'ANNUAL' ? '$5.00' : null,
      currencyCode: 'USD', introPrice,
    },
  } as never;
}
```

Then add tests:

```typescript
test('renders the auto-renew disclosure for the selected plan', async () => {
  const { getByTestId } = await render(<Paywall onClose={jest.fn()} />);
  expect(getByTestId('paywall-disclosure')).toBeTruthy();
});

test('renders Terms and Privacy links', async () => {
  const { getByTestId } = await render(<Paywall onClose={jest.fn()} />);
  expect(getByTestId('paywall-terms')).toBeTruthy();
  expect(getByTestId('paywall-privacy')).toBeTruthy();
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- Paywall.test`
Expected: FAIL — `paywall-disclosure` / `paywall-terms` not found.

- [ ] **Step 4: Render the disclosure + legal links**

In `src/components/paywall/Paywall.tsx`:

Add imports near the top:

```typescript
import { Linking } from 'react-native';
import { disclosure } from '../../lib/paywall-pricing';
import { LEGAL_URLS } from '../../config/legal';
```

Compute the selected package above the `return`:

```typescript
  const selectedPkg = packages.find((p) => p.identifier === selectedId) ?? null;
```

Inside the footer `<View>`, directly **above** the `<Button>`, add the disclosure:

```typescript
        {packages.length > 0 ? (
          <Txt testID="paywall-disclosure" variant="body" style={styles.disclosure}>
            {disclosure(selectedPkg)}
          </Txt>
        ) : null}
```

Below the existing `Restore Purchases` `PressableFeedback`, add the legal row:

```typescript
        <View style={styles.legalRow}>
          <PressableFeedback testID="paywall-terms" onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
            <Txt variant="label" style={styles.legalLink}>Terms</Txt>
          </PressableFeedback>
          <Txt variant="label" style={styles.legalDot}>·</Txt>
          <PressableFeedback testID="paywall-privacy" onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
            <Txt variant="label" style={styles.legalLink}>Privacy</Txt>
          </PressableFeedback>
        </View>
```

Add to `StyleSheet.create`:

```typescript
  disclosure: {
    fontSize: 16,
    color: TOKENS.outline,
    textAlign: 'center',
    lineHeight: 22,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    fontSize: 13,
    color: TOKENS.outline,
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: 13,
    color: TOKENS.outline,
  },
```

- [ ] **Step 5: Run the full paywall suite**

Run: `npm test -- Paywall.test`
Expected: PASS (existing + 2 new tests).

- [ ] **Step 6: Commit**

```bash
git add src/config/legal.ts src/components/paywall/Paywall.tsx src/components/paywall/__tests__/Paywall.test.tsx
git commit -m "feat(paywall): add 3.1.2 auto-renew disclosure + Terms/Privacy links"
```

---

## Task 4: "$0.00" CTA + annual per-month anchor in the paywall UI

**Files:**
- Modify: `src/components/paywall/Paywall.tsx`
- Modify: `src/components/paywall/__tests__/Paywall.test.tsx`

**Interfaces:**
- Consumes: `ctaLabel`, `perMonthAnchor` (Task 2).

> The button currently reads `'Continue'` / `'Sign in to subscribe'`. With a trial-backed plan selected it must read the `$0.00` label. The annual row shows the localized `/mo` anchor next to the yearly price (qualified as billed yearly to satisfy the global constraint).

- [ ] **Step 1: Write the failing tests**

Add to `src/components/paywall/__tests__/Paywall.test.tsx`. Add a trial fixture near the other `pkg(...)` declarations:

```typescript
// periodNumberOfUnits is 1 (one WEEK = 7 days) — keep this consistent with the
// Task 2 trial7 fixture; `periodNumberOfUnits: 7` here would mean a 49-day trial.
const trial7 = { price: 0, priceString: '$0.00', cycles: 1, period: 'P1W', periodUnit: 'WEEK', periodNumberOfUnits: 1 };
const annualTrial = pkg('annual', 'ANNUAL', '$59.99', trial7);
```

Then:

```typescript
test('CTA shows the $0.00 trial label when the selected plan has a free trial', async () => {
  mockValue = baseValue({ packages: [annualTrial, monthly] });
  const { getByTestId, getByText } = await render(<Paywall onClose={jest.fn()} />);
  // annual is the default selection (defaultPackageId prefers ANNUAL)
  expect(getByText('Start — $0.00 today')).toBeTruthy();
  // selecting monthly (no trial) reverts the CTA
  await fireEvent.press(getByTestId('pkg-monthly'));
  expect(getByText('Continue')).toBeTruthy();
});

test('annual row shows the per-month anchor', async () => {
  const { getByText } = await render(<Paywall onClose={jest.fn()} />);
  expect(getByText('$5.00 / mo · billed yearly')).toBeTruthy();
});
```

(For the second test to apply, `baseValue` must include an ANNUAL package — the existing `annual` fixture in the file already is `ANNUAL` with priceString `$59.99`; ensure `pkg('annual', ...)` now yields `pricePerMonthString: '$5.00'` via the Task 3 helper edit.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- Paywall.test`
Expected: FAIL — old CTA text `Continue` shown when a trial exists; no per-month anchor text.

- [ ] **Step 3: Drive the CTA label from the selected package**

In `src/components/paywall/Paywall.tsx`, extend the existing helpers import. **Task 3 already added `import { disclosure } from '../../lib/paywall-pricing';`** — do not add a second import line; widen that one to:

```typescript
import { ctaLabel, perMonthAnchor, disclosure } from '../../lib/paywall-pricing';
```

Replace the `<Button label={...}>` expression. Current:

```typescript
            label={mustSignIn ? 'Sign in to subscribe' : 'Continue'}
```

New:

```typescript
            label={mustSignIn ? 'Sign in to subscribe' : ctaLabel(selectedPkg)}
```

- [ ] **Step 4: Render the per-month anchor on annual rows**

Inside the `packages.map(...)` plan row, replace the single price `<Txt>`:

```typescript
                    <Txt variant="label" style={styles.planPrice}>{pkg.product.priceString}</Txt>
```

with a price column that adds the anchor when present:

```typescript
                    <View style={styles.planPriceCol}>
                      <Txt variant="label" style={styles.planPrice}>{pkg.product.priceString}</Txt>
                      {perMonthAnchor(pkg) ? (
                        <Txt variant="label" style={styles.planAnchor}>
                          {`${perMonthAnchor(pkg)} / mo · billed yearly`}
                        </Txt>
                      ) : null}
                    </View>
```

Add styles:

```typescript
  planPriceCol: {
    alignItems: 'flex-end',
  },
  planAnchor: {
    fontSize: 12,
    color: TOKENS.outline,
    marginTop: 2,
  },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- Paywall.test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/paywall/Paywall.tsx src/components/paywall/__tests__/Paywall.test.tsx
git commit -m "feat(paywall): $0.00 trial CTA + annual per-month anchor"
```

---

## Task 5: Compliant win-back offer on onboarding dismiss

**Files:**
- Modify: `src/lib/paywall-close.ts`
- Modify: `src/lib/__tests__/paywall-close.test.ts`
- Modify: `src/app/paywall.tsx`
- Create: `src/app/win-back.tsx`

**Interfaces:**
- Produces: `paywallCloseAction` gains an optional `offerShown: boolean` input. When dismissing **from onboarding** and an offer has **not** yet been shown, it returns `{ type: 'replace', href: '/win-back?next=...' }`. Otherwise unchanged.

> Compliance (5.6): the win-back is shown **once** (guarded by `offerShown`), is its own screen the user reaches **after** choosing to leave (not an instant re-pop over the paywall), and is **exitable** (its own ✕ continues into the app). It presents a *genuinely different* offer — the longer-trial / discounted annual offering — not the same paywall.

- [ ] **Step 1: Write the failing tests for routing**

Add to `src/lib/__tests__/paywall-close.test.ts`:

```typescript
import { paywallCloseAction } from '../paywall-close';

test('first onboarding dismiss routes to the win-back offer', () => {
  const action = paywallCloseAction({
    from: 'onboarding', next: '/lesson/intro', canGoBack: true, offerShown: false,
  });
  expect(action).toEqual({ type: 'replace', href: '/win-back?next=%2Flesson%2Fintro' });
});

test('after the offer was shown, onboarding dismiss goes forward to next', () => {
  const action = paywallCloseAction({
    from: 'onboarding', next: '/lesson/intro', canGoBack: true, offerShown: true,
  });
  expect(action).toEqual({ type: 'replace', href: '/lesson/intro' });
});

test('non-onboarding dismiss is unchanged by offerShown', () => {
  expect(paywallCloseAction({ next: '/x', canGoBack: true, offerShown: false }))
    .toEqual({ type: 'replace', href: '/x' });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- paywall-close`
Expected: FAIL — `offerShown` not honored; routes straight to `next`.

- [ ] **Step 3: Implement the win-back routing**

Replace `src/lib/paywall-close.ts` with:

```typescript
// Decides where the paywall's close (✕) button should lead.
// From onboarding the reveal already completed onboarding, so closing must go
// FORWARD — never back to the reveal. The FIRST onboarding dismiss is routed to a
// single, exitable win-back offer (App Store 5.6: shown once, never an instant
// re-pop). After the offer, dismiss proceeds to `next` (the first lesson) or home.
export type PaywallCloseAction = { type: 'replace'; href: string } | { type: 'back' };

export function paywallCloseAction(opts: {
  from?: string;
  next?: string;
  canGoBack: boolean;
  offerShown?: boolean;
}): PaywallCloseAction {
  if (opts.from === 'onboarding' && !opts.offerShown) {
    const q = opts.next ? `?next=${encodeURIComponent(opts.next)}` : '';
    return { type: 'replace', href: `/win-back${q}` };
  }
  if (opts.next) return { type: 'replace', href: opts.next };
  if (opts.from === 'onboarding') return { type: 'replace', href: '/' };
  return opts.canGoBack ? { type: 'back' } : { type: 'replace', href: '/' };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- paywall-close`
Expected: PASS.

- [ ] **Step 5: Thread `offerShown` through the paywall screen**

In `src/app/paywall.tsx`, read an `offer` search param and pass `offerShown` into `paywallCloseAction`. Locate the existing `useLocalSearchParams` / `paywallCloseAction(...)` call and add `offerShown: params.offer === 'shown'` to its argument object. (Open the file and match the existing call; the screen already wires `from`/`next` — add the one field.)

- [ ] **Step 6: Create the win-back screen**

Create `src/app/win-back.tsx`. It reuses the live offering but frames the genuinely-different offer and is fully exitable:

```typescript
import { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '../contexts/subscription-context';
import { ctaLabel, disclosure, freeTrial } from '../lib/paywall-pricing';
import { Button } from '../components/primitives/Button';
import { PressableFeedback } from '../components/primitives/PressableFeedback';
import { Txt } from '../components/primitives/Txt';
import { TOKENS } from '../theme/tokens';

export default function WinBack() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const insets = useSafeAreaInsets();
  const { packages, purchasePackage, isLoading, isPremium } = useSubscription();
  // Lead with the annual plan — the one with the strongest trial/value.
  const annual = packages.find((p) => p.packageType === 'ANNUAL') ?? packages[0] ?? null;
  const trial = annual ? freeTrial(annual) : null;

  const leave = () => {
    if (next) router.replace(next as never);
    else router.replace('/');
  };

  const accept = () => {
    if (annual) purchasePackage(annual);
  };

  // A successful purchase flips isPremium — leave the win-back screen. There is NO
  // global premium router, and (unlike Paywall) this screen has no onClose; without
  // this effect a successful buyer would be stranded here. Mirrors Paywall.tsx:70.
  useEffect(() => {
    if (isPremium) leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  return (
    <View style={[styles.c, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <PressableFeedback testID="winback-close" onPress={leave}>
          <Txt variant="label" style={styles.close}>✕</Txt>
        </PressableFeedback>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Txt variant="display" style={styles.title}>Wait — start free</Txt>
        <Txt variant="body" style={styles.sub}>
          {trial
            ? `Try everything free for ${trial.days} days. You won't be charged today.`
            : `Unlock every lesson and keep your study plan.`}
        </Txt>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 28) }]}>
        {annual ? (
          <Txt testID="winback-disclosure" variant="body" style={styles.disclosure}>
            {disclosure(annual)}
          </Txt>
        ) : null}
        <Button
          testID="winback-accept"
          label={ctaLabel(annual)}
          onPress={accept}
          loading={isLoading}
          disabled={!annual}
        />
        <PressableFeedback testID="winback-skip" onPress={leave}>
          <Txt variant="label" style={styles.skip}>No thanks, continue</Txt>
        </PressableFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: TOKENS.background },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16 },
  close: { fontSize: 22, color: TOKENS['on-background'], paddingHorizontal: 8, paddingVertical: 4 },
  body: { paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 34, color: TOKENS['on-background'], marginTop: 8 },
  sub: { fontSize: 16, color: TOKENS.outline, marginTop: 12, lineHeight: 24 },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  disclosure: { fontSize: 16, color: TOKENS.outline, textAlign: 'center', lineHeight: 22 },
  skip: { fontSize: 14, color: TOKENS.outline, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2 },
});
```

- [ ] **Step 7: Register the route as a modal**

In `src/app/_layout.tsx`, find the `Stack.Screen name="paywall"` registration (presentation modal) and add a sibling:

```typescript
        <Stack.Screen name="win-back" options={{ presentation: 'modal', headerShown: false }} />
```

Continuation is handled **inside `win-back.tsx`**, not by any global router (there is none — only `Paywall` and `profile.tsx` read `isPremium`). The `useEffect(() => { if (isPremium) leave() }, [isPremium])` added in Step 6 navigates away on a successful purchase; the explicit `leave()` covers decline. (No second offer is ever shown — `win-back` never re-routes back into another paywall.)

> Note on the `offerShown: true` branch (Step 3): at runtime the win-back screen always exits forward to `next`, so it never re-enters the paywall with `offer=shown`. That branch is therefore **defensive, not runtime-reachable** — its unit test (Step 1) exercises the helper directly, which is fine, but don't expect to hit it via the UI.

- [ ] **Step 8: Run the routing tests + typecheck**

Run: `npm test -- paywall-close && npx tsc --noEmit`
Expected: tests PASS; `tsc` reports no errors in the touched files.

- [ ] **Step 9: Commit**

```bash
git add src/lib/paywall-close.ts src/lib/__tests__/paywall-close.test.ts src/app/paywall.tsx src/app/win-back.tsx src/app/_layout.tsx
git commit -m "feat(paywall): single exitable win-back offer on onboarding dismiss (5.6-safe)"
```

---

## Task 6: Peak-moment review ask (expo-store-review)

**Files:**
- Create: `src/lib/review-ask.ts`
- Test: `src/lib/__tests__/review-ask.test.ts`
- Modify: `src/app/(onboarding)/domain.tsx`
- Add dependency: `expo-store-review`

**Interfaces:**
- Produces: `maybeAskForReview(): Promise<void>` — calls `StoreReview.isAvailableAsync()` then `requestReview()`, guarded so it fires at most once ever (persisted flag) and never throws.

> Placement (paywall.md Principle 2): ask at the onboarding-completion peak — the moment the user picks a domain and finishes their plan — **before** the paywall/price and any friction. Note there is **no separate "reveal" screen**: `domain.tsx`'s `onSelect` builds the plan, completes onboarding, then navigates straight on (the file comment says "no separate reveal/Continue step"). The peak is that `onSelect` moment. The OS rate-limits and may show nothing — that is expected and fine.

- [ ] **Step 1: Add the dependency**

Run: `npx expo install expo-store-review`
Expected: `expo-store-review` added to `package.json` at an SDK-56-compatible version.

- [ ] **Step 2: Write the failing tests**

Create `src/lib/__tests__/review-ask.test.ts`:

```typescript
import { maybeAskForReview, __resetReviewAskForTests } from '../review-ask';

const isAvailableAsync = jest.fn(async () => true);
const requestReview = jest.fn(async () => {});
jest.mock('expo-store-review', () => ({
  isAvailableAsync: () => isAvailableAsync(),
  requestReview: () => requestReview(),
}));

const store: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (k: string) => store[k] ?? null,
  setItem: async (k: string, v: string) => { store[k] = v; },
}));

beforeEach(() => {
  jest.clearAllMocks();
  for (const k of Object.keys(store)) delete store[k];
  __resetReviewAskForTests();
});

test('requests a review when available and not yet asked', async () => {
  await maybeAskForReview();
  expect(requestReview).toHaveBeenCalledTimes(1);
});

test('never asks twice', async () => {
  await maybeAskForReview();
  await maybeAskForReview();
  expect(requestReview).toHaveBeenCalledTimes(1);
});

test('no-ops when the API is unavailable', async () => {
  isAvailableAsync.mockResolvedValueOnce(false);
  await maybeAskForReview();
  expect(requestReview).not.toHaveBeenCalled();
});

test('swallows errors', async () => {
  requestReview.mockRejectedValueOnce(new Error('nope'));
  await expect(maybeAskForReview()).resolves.toBeUndefined();
});
```

(Confirm the AsyncStorage import path matches the rest of the app: `grep -rn "async-storage" src | head -1`. Adjust the mock + import if the app uses a wrapper.)

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- review-ask`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the review ask**

Create `src/lib/review-ask.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const ASKED_KEY = 'review:asked';
let askedThisSession = false;

/** Test-only reset of the in-memory guard. */
export function __resetReviewAskForTests() {
  askedThisSession = false;
}

/**
 * Ask for an App Store / Play review at a peak moment, at most once ever.
 * Uses the native rate-limited API; silently no-ops when unavailable. Never throws.
 */
export async function maybeAskForReview(): Promise<void> {
  try {
    if (askedThisSession) return;
    const already = await AsyncStorage.getItem(ASKED_KEY);
    if (already) return;
    if (!(await StoreReview.isAvailableAsync())) return;
    askedThisSession = true;
    await AsyncStorage.setItem(ASKED_KEY, '1');
    await StoreReview.requestReview();
  } catch {
    // Reviews are best-effort; never surface an error to the user.
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- review-ask`
Expected: PASS (4 tests).

- [ ] **Step 6: Fire it at onboarding completion (the peak)**

In `src/app/(onboarding)/domain.tsx`, the `onSelect` handler builds the plan, calls `await completeOnboarding(...)`, then branches: `if (REVENUECAT_ENABLED) router.push(\`/paywall?...\`)` **else** `router.replace(next)`. (Note: it's `router.push`, not `router.replace`, for the paywall — and there are **two** nav branches.) Add the import:

```typescript
import { maybeAskForReview } from '../../lib/review-ask';
```

Insert the ask **after `await completeOnboarding(...)` and before the `if (REVENUECAT_ENABLED)` branch**, so it fires on **both** paths (RC on → paywall; RC off → straight to the lesson):

```typescript
    void maybeAskForReview();
```

(`void` — do not await; the prompt is fire-and-forget and must not block navigation.)

> ⚠️ Sequencing: firing the ask and then immediately `router.push`-ing the paywall can pop the OS review modal **over** the paywall. The native prompt is rate-limited and often shows nothing, so this is usually benign — but if it looks bad in the smoke test, gate the ask to the RC-off branch (where it lands cleanly on the first lesson) or defer it a tick. Keep it fire-and-forget either way.

- [ ] **Step 7: Run the suite + typecheck**

Run: `npm test -- review-ask && npx tsc --noEmit`
Expected: PASS; no new type errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/lib/review-ask.ts src/lib/__tests__/review-ask.test.ts "src/app/(onboarding)/domain.tsx"
git commit -m "feat(onboarding): native review ask at the plan-reveal peak"
```

---

## Task 7: Name the bad outcome (loss-framing copy)

**Files:**
- Modify: `src/app/(onboarding)/belief.tsx` (or `src/data/onboarding-facts.ts` — whichever holds the copy)
- Test: the data test under `src/data/__tests__` if the copy lives in data; otherwise a light render assertion.

**Interfaces:** none (copy change).

> paywall.md Principle 5 ("name the exact bad thing you prevent"). The app's `belief` screen already does light loss-framing ("feels overwhelming → daily wins"). Strengthen one line to name the concrete stake — failing the exam costs the real PMP retake fee + a stalled promotion — without inventing numbers you can't support. Keep claims truthful (Apple 2.3.x / honest-marketing).

- [ ] **Step 1: Locate the copy**

Run: `grep -rn "overwhelming\|daily wins\|not alone" src | grep -v node_modules`
Expected: the exact file + line of the current belief copy.

- [ ] **Step 2: Write/extend the failing test (if copy is in data)**

If the copy is a data constant, add an assertion in the matching `__tests__` file that the strengthened line is present, e.g.:

```typescript
expect(BELIEF_COPY.reassurance).toContain('retake');
```

If the copy is inline JSX, instead add a render test asserting `getByText(/retake/)`.

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- belief` (or the relevant data test)
Expected: FAIL.

- [ ] **Step 4: Update the copy**

Replace the reassurance line with a truthful loss-naming version, e.g.:

```
"Most people who quit lose the exam fee and another year before they retry. We break it into daily wins so you don't."
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- belief`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "copy(onboarding): name the concrete cost of quitting on the belief screen"
```

---

## Task 8: Enable RevenueCat at build time for production (2.3.1-safe)

**Files:**
- Modify: `eas.json`
- Modify: `.env.production:8` (currently pins `EXPO_PUBLIC_REVENUECAT_ENABLED=false`)
- Modify: `src/config/revenuecat.ts:33-34` (swap Test-Store keys for production keys)

**Interfaces:** none (build config).

> ### ⛔ Pre-Task-8 CODE gates (surfaced by the final whole-branch review of Tasks 1–7)
> These MUST be resolved before flipping billing on, because they only affect real users once RevenueCat is live:
> - [ ] **Win-back is a real purchase surface but lacks 3.1.2 furniture.** `src/app/win-back.tsx` can complete a purchase and can show the "$0.00" CTA + auto-renew disclosure, but unlike the paywall (Task 3) it has **no Terms/EULA link, no Privacy link, and no Restore Purchases action**. Add the same `LEGAL_URLS` Terms/Privacy row and a Restore action (reuse the paywall footer pattern, including the `mustSignIn` → sign-in guard) so every screen that offers the subscription is 3.1.2-compliant. Likely App-Review rejection point otherwise.
> - [ ] **Win-back must be a *genuinely different* offer (5.6).** Today `win-back.tsx` picks `packages.find(ANNUAL) ?? packages[0]` from the **same** offering as the paywall — only the copy differs. Showing the same price/trial twice with new wording is the exact 5.6 risk the win-back was meant to avoid. Configure a **distinct RevenueCat offering** (e.g. longer trial or a real discount) store-side and have the win-back load that offering, not the default.
>
> 2.3.1: enable at **build time**, not via runtime remote config. The production build ships with the paywall **on** and the freemium model intact (3 lessons/day free, dismissible paywall). Do this LAST, after Tasks 1–7 are merged and the store-side products + trial exist.
>
> ⚠️ **Two sources currently disagree** and must end up consistent: `.env.production:8` sets the flag `false`, while this task sets it `true` in `eas.json`. Expo's dotenv loader does not override env vars already set by the EAS build profile, so the `eas.json` value would *usually* win — but relying on that precedence is fragile. Flip **both** to `true` (Step 3) so there is a single, unambiguous source of truth.

- [ ] **Step 1: Pre-req checklist (store side — do before building)**

Confirm, in App Store Connect + RevenueCat dashboard:
- [ ] `pmp_pro_annual` auto-renewable subscription created, with a **7-day free trial** introductory offer, price set.
- [ ] `pmp_pro_monthly` exists (anchor), price set.
- [ ] `$rc_annual` and `$rc_monthly` packages are in the RevenueCat `default` offering; `$rc_weekly` removed from it.
- [ ] The `pro` entitlement maps to both products.
- [ ] Production API keys (`appl_…` iOS / `goog_…` Android) copied from the RevenueCat project.

- [ ] **Step 2: Swap to production keys**

In `src/config/revenuecat.ts`, replace the Test-Store keys with the production keys (keep the comment explaining they are now live store keys):

```typescript
export const REVENUECAT_API_KEYS = {
  ios: 'appl_XXXXXXXXXXXXXXXXXXXX',
  android: 'goog_XXXXXXXXXXXXXXXXXXXX',
} as const;
```

- [ ] **Step 3: Enable the flag in BOTH the production profile and `.env.production`**

In `eas.json`, set the production build profile's env:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_REVENUECAT_ENABLED": "true"
  }
}
```

(Merge into the existing `production` profile's `env` block — do not clobber other vars. Leave `development`/`preview` as they are.)

Then flip `.env.production:8` so it no longer contradicts the build profile:

```
EXPO_PUBLIC_REVENUECAT_ENABLED=true
```

Both now agree — there is no longer a `false` lurking that could win the precedence race and silently ship billing OFF.

- [ ] **Step 4: Verify the flag resolves on by running the config test**

Run: `EXPO_PUBLIC_REVENUECAT_ENABLED=true npm test -- revenuecat` (add a test asserting `REVENUECAT_DISABLED === false` when the env is `'true'`, if one does not exist).
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add eas.json .env.production src/config/revenuecat.ts
git commit -m "chore(release): enable RevenueCat in production build with live store keys"
```

- [ ] **Step 6: Build + manual store-review smoke test**

Build the production iOS app (see `docs/.../ios release build` recipe). On a TestFlight/sandbox device verify the App-Store-review checklist: paywall shows price + 7-day trial + auto-renew text + Terms/Privacy + Restore; ✕ dismisses; first dismiss shows the win-back once; win-back is exitable. Capture screenshots for the submission notes.

---

## Self-Review

**Spec coverage (against `docs/thinking/paywall.md`):**
- Stage 1 "have a paywall / charge" → Task 8 enables it in production. ✅
- Stage 2 "paywall inside onboarding after something to lose" → already satisfied; preserved (not regressed). ✅
- Trick #1 "$0.00 CTA" → Tasks 2 + 4. ✅
- Trick #2 "sell promotions / annual anchored by monthly" → delivered by the **RevenueCat `default` offering** (Task 8 store-side) + `defaultPackageId()` (already prefers ANNUAL) + per-month anchor (Task 4). Task 1 only adds tier metadata for the Profile plan label — it does **not** drive the paywall lineup. ✅
- Trick #3 "show twice" → already shown at onboarding + daily limit; not regressed (no new aggressive re-pop, per 5.6). ✅
- Trick #4 "decision now or lost / second funnel on no" → Task 5 (compliant single win-back). ✅
- Trick #5 "commit before paywall" → already exists (`commit.tsx`); untouched. ✅
- Principle 2 "review at peak" → Task 6. ✅
- Principle 5 "name the bad outcome" → Task 7. ✅
- Compliance gaps surfaced (disclosure + legal links + restore) → Task 3. ✅

**Type consistency:** `freeTrial`, `ctaLabel`, `perMonthAnchor`, `disclosure` (Task 2) are consumed with identical signatures in Tasks 3–6. `paywallCloseAction` gains `offerShown?: boolean` (Task 5) consumed in `paywall.tsx`. Product id `annual` / package `$rc_annual` consistent across Tasks 1, 5, 8.

**Premium-continuation wiring (verified against code):** there is **no global `isPremium` router**. `Paywall` self-navigates via its own `useEffect` (`Paywall.tsx:70`); `win-back.tsx` must replicate that effect (Task 5 Step 6) or a successful buyer is stranded. Both screens read `isPremium` from `useSubscription()`.

**Dismiss-helper consistency:** `paywallCloseAction` (Task 5) and the already-shipped `authDismissAction` (`src/lib/auth-dismiss.ts`) share the same `{ type: 'back' } | { type: 'replace'; href }` shape and the same "back when poppable, else `replace('/')`" fallback. Keep them aligned — any change to the routing convention should apply to both so the paywall ✕ and the auth ✕ behave identically.

**Baseline:** the "Current State (snapshot — 2026-06-26)" section above is the agreed starting point — billing flag OFF in production, Test-Store keys still in place, no store products, auth ✕ already shipped. Tasks 1–8 are written forward from exactly that state.

**Deliberately out of scope (raised in review, rejected on compliance grounds):** hard paywall with no close button (2.3.1/2.3.1 risk for a freemium app), fake/perpetual countdown urgency (2.3.1), runtime remote-config flip to a wall (2.3.1). If the team still wants a real time-boxed discount in the win-back, it must be a genuine, expiring offer configured store-side — track as a separate spec.

**Open product decisions needed before Task 8:** (1) trial length — plan assumes **7 days**; (2) annual price point and the monthly anchor gap; (3) whether to keep `weekly` anywhere in the UI. These are store-side configuration, not code.
