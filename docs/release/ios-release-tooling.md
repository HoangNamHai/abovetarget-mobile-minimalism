# iOS release tooling decision — use ASC, not Fastlane `deliver`

> 📘 Quy trình end-to-end (13 bước + checklist + troubleshooting):
> [`ios-appstore-runbook.md`](./ios-appstore-runbook.md). File này chỉ là phần
> *quyết định công cụ* (vì sao ASC thay vì `deliver`).

**Status:** adopted (2026-06-24) · **Scope:** iOS App Store Connect operations for PMP Exam Pro (`com.h2ai.pmpexampro`, ASC app `6782658779`).

## Decision

- **iOS App Store work → use `asc` (CLI) + the ASC REST API directly.** Deterministic, scriptable, structured output. This is the proven path: version create/rename, build attach, `validate`, `status`, `builds wait`, export-compliance (encryption) + content-rights, screenshot management, and submission were all done cleanly via ASC.
- **Android (Google Play) → keep Fastlane `supply`.** `asc` is App Store Connect only; it cannot touch Play. The Android lanes in `fastlane/Fastfile` stay as-is.
- **iOS `deliver` lanes are deprecated** — do **not** use `fastlane deliver` for iOS screenshots/metadata.

| Task | Tool |
|---|---|
| iOS version / build attach / compliance / submit | `asc` (CLI + API) |
| iOS screenshots / metadata | ASC API (idempotent: clear set → upload once → **verify count**) |
| iOS binary upload | `xcrun altool` or `asc builds upload` |
| iOS archive / signing | `xcodebuild` + local `signing/` keychain (see memory `ios-release-build`) |
| **Android (Play)** | **Fastlane `supply`** |

## Why — the `deliver` screenshot duplication (2026-06-23)

A single `fastlane deliver` (v2.232.0) `upload_screenshots` run uploaded **each of the 5 screenshots twice** → 10 assets in the `APP_IPHONE_67` set. Evidence: the run logged `Successfully uploaded all screenshots` **twice** and re-uploaded `05-pmp` in two separate batches. `deliver` parallel-uploads then runs a verify/retry loop; when the large 1320×2868 assets were still processing at verification time it re-ran the upload pass, and ASC has **no server-side de-duplication**, so copies accumulated. `overwrite_screenshots: true` did **not** help — it only clears *pre-existing* screenshots at the start (the set was empty), not duplicates created within the same run.

Fix applied: deleted the 5 dupes via `DELETE /v1/appScreenshots/{id}` and verified the set held exactly 5.

## Prevention (the rule going forward)

1. **Upload iOS screenshots via the ASC API, idempotently:** clear the set → upload each once → **assert count == expected**. No retry-append behavior.
2. **Always verify after any screenshot upload** (query the set count via API; fail/auto-trim if ≠ N). Catch dupes in the workflow, not in the ASC UI later.
3. Never re-run an upload against a non-empty set without clearing first.

## Caveat — App Privacy has no public API (either tool)

The App Privacy / data-usage declaration is **not** in the public ASC API and is not handled by Fastlane either. Complete it once via the ASC web UI, or `asc web privacy pull|plan|apply|publish` (experimental web session, needs Apple ID + 2FA). Accurate answers for this app (Clerk sign-in only; Sentry DSN empty/inactive; RevenueCat off; no analytics): Email Address, Name, User ID — all *App Functionality*, linked, **not** tracking.

## Reference helpers
- API auth: ES256 JWT from `~/.appstoreconnect/private_keys/AuthKey_G3CD625ZNS.p8`, key id `G3CD625ZNS`, issuer `48d421d0-29a7-4799-97ee-4330306500d9`, aud `appstoreconnect-v1`.
- Endpoints used: `/v1/appStoreVersionLocalizations/{id}/appScreenshotSets`, `/v1/appScreenshotSets/{id}/appScreenshots`, `DELETE /v1/appScreenshots/{id}`, `PATCH /v1/builds/{id}` (`usesNonExemptEncryption`).
