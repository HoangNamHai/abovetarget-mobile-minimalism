# Phase 6 — Release Infra — Record

**Goal:** Make the SDK-56 shell shippable as an update to the existing **PMP Exam Pro** store
listing: adopt PMP's app identity, port EAS/fastlane/Play tooling, harden secret handling, and
document the credential-gated steps that cannot be done in-repo.

This phase is config-as-code; it was executed directly (not via TDD subagents) because the
deliverables are configuration + tooling with a single machine-checkable guard test. See
`docs/RELEASE.md` for the operator handoff.

## Done in-repo

1. **App identity** (`app.json`) — `name` PMP Exam Pro, `slug`/`scheme` pmp-exam-pro, `owner`
   hoangnamhai, iOS `bundleIdentifier` + Android `package` `com.h2ai.pmpexampro`, `extra.eas.projectId`
   `d31b8c5a-...`, `android.edgeToEdgeEnabled`, splash `imageWidth`/dark parity. Phase 5 infra
   plugins kept intact.
2. **`eas.json`** — `development`, `development-device`, `preview`, `production` build profiles +
   `submit.production` (iOS placeholders; Android service-account path + internal track).
3. **`fastlane/`** — `Appfile`, `Fastfile` (upload/download metadata + screenshots lanes),
   `metadata/en-US/**` listing text (title, short/full description, changelog).
4. **`scripts/google-play-upload.py`** — Play Console upload/version/track tooling (reads the
   gitignored service-account JSON; no embedded secrets).
5. **Secret hygiene** — `.gitignore` now excludes `.env`, `*.keystore`, `credentials.json`,
   `pc-api-*.json`, `fastlane/report.xml`; `.env.example` documents required env vars.
6. **Guard test** — `src/app/__tests__/app-config.test.ts` locks identity + plugin set + EAS
   profiles so they cannot silently regress.

## Verification

- `app.json` + `eas.json` parse; `npx expo config` resolves the full config on `sdkVersion 56.0.0`
  with all infra plugins loading cleanly.
- Suite: 61 suites / 180 tests green; `tsc --noEmit` clean.

## Deferred / credential-gated (in `docs/RELEASE.md`)

- `.env` with real Clerk/Sentry values; Android keystore + `credentials.json`; Play service-account
  JSON; iOS submit identifiers; `SENTRY_AUTH_TOKEN`.
- **First native `eas build` is the real SDK 54→56 validation gate** for Clerk/RevenueCat/Sentry/
  notifications/NetInfo — only validated in JS so far.
- Phone screenshots regenerated for the monograph UI.
- Optional PMP parity not carried over: `experiments.reactCompiler` (needs babel-plugin-react-compiler;
  left off to avoid an unvalidated build change).
