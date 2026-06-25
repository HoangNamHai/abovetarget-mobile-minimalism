# RevenueCat + Clerk Subscription — Phase 1 Verification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify end-to-end that a RevenueCat **Test Store** purchase grants the `pro` entitlement and unlocks gated content while signed in with a **Clerk production** (`pk_live_`) account, on the iOS simulator.

**Architecture:** No production code changes. The subscription feature is already built (`SubscriptionProviderLive` initializes RevenueCat, links the RC customer to the Clerk user, reads `pro`, drives the paywall, gates lessons). This plan is a verification runbook: confirm config + dashboard state, build & launch a local dev client, then drive the purchase/restore/sign-out flows and capture evidence in the app **and** cross-check in the RevenueCat dashboard.

**Tech Stack:** Expo SDK 56 (CNG, `ios/` prebuilt), `react-native-purchases@^10.4.0` (Test Store), Clerk (`pk_live_`), Jest + Testing Library, `xcrun simctl`, chrome-cdp (RevenueCat dashboard read-back).

## Global Constraints

- Platform: **iOS only** this phase. No Android steps.
- **No production code changes.** If a task appears to need one, stop and report — it means the spec assumption ("config: nothing to change") was wrong.
- RevenueCat key in use stays the **Test Store** key (`test_UFx…` in `src/config/revenuecat.ts`). Do **not** swap in any `appl_`/`goog_` key (that is Phase 2).
- `.env` must have `EXPO_PUBLIC_REVENUECAT_ENABLED=true` and the Clerk `pk_live_` key active. Do **not** touch `.env.production`.
- Entitlement identifier is exactly `pro`. Offering identifier is exactly `default` with 3 packages: `$rc_weekly`, `$rc_monthly`, `$rc_lifetime`.
- Interaction model: the agent drives build / launch / screenshots / logs / dashboard read-back; **in-app button taps are performed by the human** (no `idb` installed). Each verification step names who acts.
- Chrome CDP connection: `export CDP_WS_URL=$(curl -s http://localhost:9333/json/version | grep -o 'ws://[^"]*')`; target IDs are not stable — re-run `cdp.mjs list` each time. (See memory `chrome-cdp-connection`.)
- Clerk sign-in account: **production** instance. Default to the reviewer demo `appstore.review@abovetarget.org`; its password must be supplied by the user at Task 3 (or the user signs in with their own prod account).

---

### Task 1: Green baseline + config/dashboard pre-flight

**Files:**
- Read: `.env`, `src/config/revenuecat.ts`, `src/config/env.ts`
- Test: `src/contexts/__tests__/subscription-context-live.test.tsx`, `src/contexts/__tests__/subscription-context.test.tsx`

**Interfaces:**
- Produces: confirmation that the unit suite is green and that env + RC dashboard satisfy Phase 1 preconditions. No artifacts consumed by later tasks beyond "preconditions hold".

- [ ] **Step 1: Run the subscription unit tests (automated baseline)**

Run:
```bash
cd /Users/hoangnamhai/Downloads/monograph-elite-native
TZ=UTC npx jest subscription-context entitlement plan-status use-lesson-limit --silent 2>&1 | tail -20
```
Expected: all suites PASS (this is the mocked-Purchases logic baseline; it does not hit the Test Store).

- [ ] **Step 2: Confirm runtime env flags**

Run:
```bash
grep -E "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live|EXPO_PUBLIC_REVENUECAT_ENABLED=true" .env
grep -E "ios:|android:" src/config/revenuecat.ts
```
Expected: the `pk_live_` Clerk key line is uncommented/active, `EXPO_PUBLIC_REVENUECAT_ENABLED=true` present, and `REVENUECAT_API_KEYS` shows the `test_…` key for ios/android.

- [ ] **Step 3: Cross-check RC dashboard — entitlement + offering (via CDP)**

Run:
```bash
export CDP_WS_URL=$(curl -s --max-time 3 http://localhost:9333/json/version | grep -o 'ws://[^"]*')
CDP=/Users/hoangnamhai/.claude/skills/chrome-cdp/scripts/cdp.mjs
TID=$($CDP list | grep -i revenuecat | awk '{print $1}' | head -1)
$CDP nav "$TID" "https://app.revenuecat.com/projects/0a64724c/product-catalog/entitlements" >/dev/null; sleep 4
$CDP eval "$TID" "(document.querySelector('main')||document.body).innerText.replace(/\n{2,}/g,'\n').slice(0,500)"
```
Expected: an entitlement with identifier `pro` exists and lists 3 attached products (`weekly`, `monthly`, `lifetime`). If `weekly` shows unattached, note it — the monthly purchase in Task 5 is unaffected.

- [ ] **Step 4: Commit (runbook note only, no code)**

```bash
git add docs/superpowers/plans/2026-06-25-revenuecat-clerk-subscription-phase1.md
git commit -m "docs(plan): Phase 1 RevenueCat+Clerk verification runbook"
```

---

### Task 2: Build & launch the dev client on the iOS simulator

**Files:**
- Run-only: `package.json` (`ios` script → `expo run:ios`)

**Interfaces:**
- Produces: a booted simulator running the dev build with RevenueCat + Clerk initialized (no init errors). Later tasks act on this running app.

- [ ] **Step 1: Build & launch**

Run (in a background-capable shell; first build can take several minutes):
```bash
cd /Users/hoangnamhai/Downloads/monograph-elite-native
npm run ios 2>&1 | tee /tmp/pmp-run-ios.log
```
Expected: app builds, a simulator boots, the app opens to the first screen (onboarding or home).

- [ ] **Step 2: Confirm a simulator is booted**

Run:
```bash
xcrun simctl list devices booted | grep -i booted
```
Expected: one booted device listed.

- [ ] **Step 3: Verify RevenueCat + Clerk initialized without errors**

Run:
```bash
grep -iE "revenuecat|purchases|clerk|entitlement|error|warn" /tmp/pmp-run-ios.log | grep -ivE "deprecat" | tail -30
```
Expected: no fatal RevenueCat/Clerk init errors. RevenueCat configures with the `test_…` key. (Test Store init logs may differ from StoreKit — absence of thrown errors is the pass signal.)

- [ ] **Step 4: Capture a launch screenshot (evidence)**

Run:
```bash
xcrun simctl io booted screenshot /tmp/pmp-01-launch.png && echo saved
```
Expected: `/tmp/pmp-01-launch.png` written.

---

### Task 3: Sign in with a Clerk production account

**Files:** none (runtime only)

**Interfaces:**
- Consumes: running app from Task 2.
- Produces: an authenticated session whose Clerk user id is the RevenueCat App User ID (used for dashboard read-back in Task 5).

- [ ] **Step 1: Obtain credentials**

Action (user): provide the password for `appstore.review@abovetarget.org` (prod Clerk), or choose to sign in with your own prod account. Record which account is used.

- [ ] **Step 2: Navigate to the sign-in screen and sign in**

Action (user): tap through to sign-in and authenticate with the chosen prod account. Agent: screenshot the signed-in state.
```bash
xcrun simctl io booted screenshot /tmp/pmp-02-signed-in.png && echo saved
```
Expected: app shows a signed-in state (e.g., Profile shows the account).

- [ ] **Step 3: Confirm the RC customer was identified (via CDP)**

Run:
```bash
export CDP_WS_URL=$(curl -s --max-time 3 http://localhost:9333/json/version | grep -o 'ws://[^"]*')
CDP=/Users/hoangnamhai/.claude/skills/chrome-cdp/scripts/cdp.mjs
TID=$($CDP list | grep -i revenuecat | awk '{print $1}' | head -1)
$CDP nav "$TID" "https://app.revenuecat.com/projects/0a64724c/customers" >/dev/null; sleep 4
$CDP eval "$TID" "(document.querySelector('main')||document.body).innerText.replace(/\n{2,}/g,'\n').slice(0,500)"
```
Expected: a recent customer appears whose App User ID is the Clerk user id (`user_…`). It will currently show **no** active `pro` entitlement (purchase happens in Task 5).

---

### Task 4: Open the paywall and verify packages render

**Files:**
- Reference: `src/app/paywall.tsx`, `src/components/paywall/Paywall.tsx`, `src/config/pricing.ts`

**Interfaces:**
- Consumes: authenticated running app.
- Produces: confirmation the `default` offering loads 3 packages with Test Store prices.

- [ ] **Step 1: Open the paywall**

Action (user): trigger the paywall (Profile → upgrade, or a gated lesson). Agent: screenshot.
```bash
xcrun simctl io booted screenshot /tmp/pmp-03-paywall.png && echo saved
```
Expected: paywall shows Weekly / Monthly (Best Value) / Lifetime tiers.

- [ ] **Step 2: Verify prices came from RevenueCat (not the fallback)**

Inspect `/tmp/pmp-03-paywall.png`. Expected: prices are the RevenueCat/Test-Store `priceString` values, not the static fallbacks (`$6/week` etc. from `pricing.ts` are the offline fallback — if you see exactly those, offerings may have failed to load; re-check logs).

---

### Task 5: Purchase the Monthly package → verify `pro` grants access

**Files:**
- Reference: `src/contexts/subscription-context.tsx`, `src/hooks/use-lesson-limit.ts`, `src/app/(tabs)/profile.tsx`

**Interfaces:**
- Consumes: paywall open, signed-in session.
- Produces: `pro` entitlement active for the Clerk user; gated content unlocked.

- [ ] **Step 1: Purchase the Monthly package**

Action (user): tap the Monthly "Upgrade" button and complete the Test Store purchase (the Test Store completes without a StoreKit payment sheet). Agent: screenshot the post-purchase state.
```bash
xcrun simctl io booted screenshot /tmp/pmp-04-post-purchase.png && echo saved
```
Expected: paywall dismisses / shows success.

- [ ] **Step 2: Verify premium in-app — Profile plan row**

Action (user): go to Profile. Agent: screenshot.
```bash
xcrun simctl io booted screenshot /tmp/pmp-05-profile-plan.png && echo saved
```
Expected: the "Plan" row shows the Monthly tier (not Free).

- [ ] **Step 3: Verify the lesson gate lifted**

Action (user): open a previously gated lesson (one beyond the free daily limit / a Pro path). Agent: screenshot.
```bash
xcrun simctl io booted screenshot /tmp/pmp-06-gate-lifted.png && echo saved
```
Expected: the lesson opens; no paywall/limit block.

- [ ] **Step 4: Cross-verify the entitlement in the RC dashboard (via CDP)**

Run:
```bash
export CDP_WS_URL=$(curl -s --max-time 3 http://localhost:9333/json/version | grep -o 'ws://[^"]*')
CDP=/Users/hoangnamhai/.claude/skills/chrome-cdp/scripts/cdp.mjs
TID=$($CDP list | grep -i revenuecat | awk '{print $1}' | head -1)
$CDP nav "$TID" "https://app.revenuecat.com/projects/0a64724c/customers" >/dev/null; sleep 4
$CDP eval "$TID" "(document.querySelector('main')||document.body).innerText.replace(/\n{2,}/g,'\n').slice(0,600)"
```
Expected: the Clerk user's customer now shows an **active `pro`** entitlement from a Test Store `monthly` purchase. This is the authoritative pass signal.

---

### Task 6: Verify restore and sign-out behavior

**Files:**
- Reference: `src/contexts/subscription-context.tsx` (`restorePurchases`, login/logout handling)

**Interfaces:**
- Consumes: signed-in session with active `pro`.
- Produces: confirmation that restore re-grants and sign-out revokes (no anonymous premium).

- [ ] **Step 1: Restore purchases**

Action (user): trigger "Restore Purchases" (Profile/paywall). Agent: screenshot.
```bash
xcrun simctl io booted screenshot /tmp/pmp-07-restore.png && echo saved
```
Expected: `pro` remains active; no error toast.

- [ ] **Step 2: Sign out and confirm premium is revoked**

Action (user): sign out. Agent: screenshot.
```bash
xcrun simctl io booted screenshot /tmp/pmp-08-signed-out.png && echo saved
```
Expected: app returns to signed-out state and premium is **not** granted (gated content blocks again — no anonymous premium per `isPremium` requiring sign-in).

---

### Task 7: Record verification results

**Files:**
- Create: `docs/superpowers/verification/2026-06-25-phase1-results.md`

**Interfaces:**
- Consumes: screenshots `/tmp/pmp-0*.png` and observations from Tasks 1–6.

- [ ] **Step 1: Write the results report**

Create `docs/superpowers/verification/2026-06-25-phase1-results.md` with: account used, pass/fail per task, the RC dashboard entitlement confirmation, and links to the screenshots (copy them into the folder). Use this skeleton (fill with actual observed values — no placeholders):

```markdown
# Phase 1 Verification Results — 2026-06-25
- Clerk account: <account used>
- Unit baseline: <PASS/FAIL>
- Launch + init: <PASS/FAIL — notes>
- Paywall renders 3 packages w/ Test Store prices: <PASS/FAIL>
- Monthly purchase → pro active in-app: <PASS/FAIL>
- RC dashboard shows active pro for <user_id>: <PASS/FAIL>
- Lesson gate lifted: <PASS/FAIL>
- Restore re-grants: <PASS/FAIL>
- Sign-out revokes (no anonymous premium): <PASS/FAIL>
- Screenshots: pmp-01..08
- Verdict: <Phase 1 PASS → ready to schedule Phase 2 / issues found: …>
```

- [ ] **Step 2: Copy evidence and commit**

```bash
cd /Users/hoangnamhai/Downloads/monograph-elite-native
mkdir -p docs/superpowers/verification/phase1-screens
cp /tmp/pmp-0*.png docs/superpowers/verification/phase1-screens/ 2>/dev/null || true
git add docs/superpowers/verification/
git commit -m "docs(test): Phase 1 RevenueCat+Clerk verification results + screenshots"
```

---

## Self-Review

**Spec coverage:** Phase 1 config (Task 1), run approach A / simulator (Task 2), the 6-step verification procedure (Tasks 3–6), and success criteria + evidence (Task 7) all map to spec §"Phase 1". Phase 2 is intentionally out of scope for this plan (spec marks it design-only). Cleanup items (`yearly` product, `PRODUCTS` constant) are noted in the spec but deliberately NOT acted on here (no-code-change constraint).

**Placeholder scan:** No "TBD"/"handle errors"/"similar to" placeholders. The only fill-ins are observed runtime values in the Task 7 report, which is correct (results can't be known before running).

**Type/identifier consistency:** `pro` entitlement, `default` offering, `$rc_weekly/$rc_monthly/$rc_lifetime` packages, project `0a64724c`, app `6782658779`, port `9333` used consistently across tasks and match the spec.

**Open dependency:** Task 3 needs the Clerk demo-account password (or the user's own prod login) — flagged as a user action, not a silent blocker.
