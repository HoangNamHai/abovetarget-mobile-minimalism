# Release Guide — PMP Exam Pro

This app ships as an **update to the existing `PMP Exam Pro` store listing** (it replaces
`pmp-prod-v3`). Identity is locked in `app.json` and guarded by
`src/app/__tests__/app-config.test.ts`:

| Field | Value |
|---|---|
| name | `PMP Exam Pro` |
| slug | `pmp-exam-pro` |
| owner | `hoangnamhai` |
| scheme | `pmp-exam-pro` |
| iOS bundleIdentifier | `com.h2ai.pmpexampro` |
| Android package | `com.h2ai.pmpexampro` |
| EAS projectId | `d31b8c5a-d243-401a-af76-35f0b42342bc` |

Native projects use **Continuous Native Generation** — `/ios` and `/android` are
gitignored and produced by `expo prebuild` at build time. Do **not** commit native dirs.

## What is done in-repo (this branch)

- `app.json` — PMP identity, infra config plugins (notifications, Sentry, build-properties).
- `eas.json` — `development`, `development-device`, `preview`, `production` build profiles + a
  `production` submit target.
- `fastlane/` — `Appfile`, `Fastfile`, and `metadata/en-US/**` store listing text.
- `scripts/google-play-upload.py` — Play Console upload/version/track tooling.
- `.env.example` — required env vars; `.gitignore` hardened against committing secrets.

## What YOU must supply (credential-gated — cannot be done in-repo)

These need accounts/secrets and must run on a machine with the Expo/EAS + store credentials:

1. **`.env`** — copy from `.env.example` and fill `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and
   `EXPO_PUBLIC_SENTRY_DSN` (leave blank to keep those integrations dormant). Never commit it.
2. **Android signing keystore** — `eas.json` production uses `credentialsSource: "local"`;
   provide `credentials.json` + the `*.keystore` (both gitignored), or switch to EAS-managed
   credentials with `eas credentials`.
3. **Google Play service account** — place `pc-api-9211159543626347762-239-4d9390d4bf09.json`
   (gitignored) at the repo root for `fastlane` and `scripts/google-play-upload.py`.
4. **iOS submit identifiers** — replace `YOUR_APPLE_ID` / `YOUR_ASC_APP_ID` / `YOUR_TEAM_ID`
   in `eas.json` `submit.production.ios`.
5. **Sentry auth token** — `SENTRY_AUTH_TOKEN` in the EAS build environment for sourcemap upload.

## Build & submit

```bash
# Login + link the EAS project (projectId already in app.json)
eas login
eas init   # confirms link to projectId d31b8c5a-...

# Dev client for on-device testing
eas build --profile development --platform ios
eas build --profile development-device --platform android

# Production
eas build --profile production --platform all
eas submit --profile production --platform ios
eas submit --profile production --platform android   # track: internal (bump in eas.json to promote)
```

## ⚠️ Open risk — SDK 54 → 56 native validation

Phase 5 installed Clerk / RevenueCat / Sentry / expo-notifications / NetInfo at SDK-56-aligned
versions, but they have **only been validated in JS (Jest) — not in a native build**. The first
`eas build --profile development` is the real gate: confirm all five native modules compile and
link on SDK 56 before promoting to production. This is the biggest remaining unknown.

## Store metadata

Text lives in `fastlane/metadata/en-US/` (title, short/full description, changelog). Phone
screenshots must be **regenerated for the monograph UI** — see
`fastlane/metadata/en-US/images/phoneScreenshots/README.md`. Push metadata with:

```bash
cd fastlane && fastlane upload_metadata     # draft release
# or
python scripts/google-play-upload.py images --language en-US
```
