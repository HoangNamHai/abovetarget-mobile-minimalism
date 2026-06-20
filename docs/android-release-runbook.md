# Android Release Runbook — local build → Play draft (battle-tested)

The exact sequence that worked for building the AAB **locally** and uploading it to
Google Play as a **draft**, plus every gotcha hit along the way. Complements:

- `docs/RELEASE.md` — high-level release guide + credential checklist.
- `docs/android-testing.md` — booting the Genymotion emulator + adb UI automation
  (uiautomator dump, taps, screenshots). **Read its emulator section first**; this
  runbook only covers the build/upload + store-screenshot specifics.

Identity: package `com.h2ai.pmpexampro`, EAS project `d31b8c5a-…`, owner `hoangnamhai`.

---

## TL;DR — the happy path

```bash
# 0. Credentials into repo root (all gitignored). Source from sibling repo pmp-prod-v3.
cp ~/Documents/workspace/pmp-prod-v3/release.keystore   ./release.keystore
cp ~/Documents/workspace/pmp-prod-v3/credentials.json   ./credentials.json
cp ~/Downloads/pc-api-9211159543626347762-239-4d9390d4bf09.json ./   # Play service account

# 1. Build the AAB LOCALLY (not cloud). ~20 min, all 4 ABIs compiled.
export ANDROID_HOME=$HOME/Library/Android/sdk
export SENTRY_DISABLE_AUTO_UPLOAD=true        # else Gradle SentryUpload task fails (no token)
eas build --platform android --profile production --local --non-interactive \
  --output ./pmp-exam-pro-prod.aab

# 2. Submit to Play as a DRAFT (eas.json submit.production.android = track:production, releaseStatus:draft)
eas submit --platform android --profile production --path ./pmp-exam-pro-prod.aab --non-interactive

# 3. Confirm the real version code (remote autoIncrement ≠ what you expect!)
java -jar bundletool.jar dump manifest --bundle=pmp-exam-pro-prod.aab | grep -o 'versionCode="[0-9]*"'

# 4. Upload store screenshots tied to that version code (see screenshot section).
```

---

## Gotchas, in the order they bit (each cost a full rebuild or retry)

### 1. `credentialsSource: local` but no `credentials.json` in repo
`eas.json` production points at a local keystore, but the keystore + `credentials.json`
are gitignored and absent. They live in the predecessor repo
`~/Documents/workspace/pmp-prod-v3/` (same slug `pmp-exam-pro`). Upload key alias
`pmp-release`, store/key password `962911`. Copy both into repo root before building.
Verify the key is the registered upload key: `keytool -list -v -keystore release.keystore`
(SHA1 `AD:D9:A3:…`). Wrong key → Play rejects the upload (recoverable, not destructive).

### 2. Build fails at JS bundling — `Cannot find module 'babel-plugin-transform-remove-console'`
`babel.config.js` adds this plugin when `NODE_ENV=production`, but it was never in
`package.json`. **Now fixed** (added as devDependency). If it regresses:
`npm i -D babel-plugin-transform-remove-console`. The error surfaces as a generic
"Unknown error … Bundle JavaScript build phase" — grep the build log for `EAGER_BUNDLE`
to find the real cause.

### 3. Build fails at Gradle — `Sentry … Auth token is required`
The `@sentry/react-native/expo` plugin runs `:app:…SentryUpload…` during a release build,
which needs `SENTRY_AUTH_TOKEN`. None exists locally (only `.env.example` references it).
Fix: `export SENTRY_DISABLE_AUTO_UPLOAD=true` before the build. App still builds; runtime
crash reporting still works; only source-map symbolication is skipped (upload maps later if
you get a token). The failing task is task #~334 of ~931 — if the build dies early-ish,
suspect this.

### 4. Version code is auto-incremented server-side — don't assume it
`eas.json` has `appVersionSource: remote` + `autoIncrement`. **Every** build attempt
(including failed ones) consumes a number. This session: failed builds took 12 & 13, the
successful AAB was **14**. Always read the true code from the artifact before referencing it:
`bundletool dump manifest --bundle=…aab`. Using the wrong code in `supply` fails with
"Could not find release for version code N".

### 5. `fastlane supply` for screenshots needs `--version_code` when >1 release exists
Production already had a `completed` v11 release; our draft added v14. supply errors
"More than one release found in this track. Please specify with the :version_code option."
Pass `--version_code 14` (the draft's code). Listing images are technically listing-level,
but supply still resolves a track release for its edit.

---

## Building locally

- `eas build … --local` runs the full build on this machine (clones project to a temp dir,
  `npm ci`, prebuild, Gradle). It does **not** touch the working tree's `android/`.
- Needs `ANDROID_HOME=$HOME/Library/Android/sdk` and JDK (21 worked here).
- ~20 min wall-clock; it compiles CMake for all 4 ABIs (armeabi-v7a, arm64, x86, x86_64).
  Output AAB is ~108 MB.
- `expo doctor` prints schema warnings and "fails" but is **non-fatal** — the build proceeds.
- Run it in the background and poll for the artifact:
  `pgrep -f 'eas build'` (running?) and `ls pmp-exam-pro-prod.aab` (done?). Don't trust the
  wrapper exit code alone — check that the AAB actually exists and the log says
  `BUILD SUCCESSFUL`.

## Submitting as a draft

- `eas.json` → `submit.production.android` must be `{ track: "production", releaseStatus: "draft" }`
  (it shipped as `track: "internal"`; changed this session).
- `eas submit … --path ./x.aab` uploads via the Play service account. Success prints
  `Release status: DRAFT` + `Submitted your app to Google Play Store!`.
- "Draft" = saved in Play, **not** reviewed, **not** rolled out. To go live later: Play
  Console → Production → the draft → review & roll out.

## Store screenshots from the emulator

Capture is via Genymotion (see `docs/android-testing.md` for boot: `gmtool admin start …`,
device serial `127.0.0.1:6555`, `adb connect`).

1. **Install the production build for accurate UI** — convert AAB → universal APK with
   bundletool (signed with the same keystore), no second Gradle build:
   ```bash
   java -jar bundletool.jar build-apks --bundle=pmp-exam-pro-prod.aab --output=/tmp/pmp.apks \
     --mode=universal --ks=release.keystore --ks-pass=pass:962911 \
     --ks-key-alias=pmp-release --key-pass=pass:962911
   java -jar bundletool.jar install-apks --apks=/tmp/pmp.apks --device-id=127.0.0.1:6555
   ```
   (bundletool 1.18.1 jar: github.com/google/bundletool/releases.)
2. **Find tap targets properly** — use `uiautomator dump` (per android-testing.md) to read
   exact element bounds. I guessed coordinates and mis-tapped repeatedly; dump-then-tap is
   faster and reliable.
3. **Capture full-res**: `adb -s 127.0.0.1:6555 exec-out screencap -p > shot.png` → 1440×2560.
4. **Crop emulator chrome** (status bar 84px top, nav bar 168px bottom on Nexus 6) for a clean
   store look — keeps the app's own bottom tab bar:
   ```bash
   magick shot.png -crop 1440x2308+0+84 +repage out.png
   ```
   Result 1440×2308 (ratio 1.6, within Play's ≤2:1). Get the nav bar height from
   `adb shell dumpsys window | grep -i navigation` (`bottom=168` here).
5. **Upload, replacing phone shots, preserving tablet** — seed the metadata dir from a live
   pull (`fastlane supply init --metadata_path <NEW path that does not exist yet>` — it
   refuses to write if the dir already exists), replace `phoneScreenshots/*`, then:
   ```bash
   fastlane supply --json_key pc-api-…json --package_name com.h2ai.pmpexampro \
     --metadata_path ./fastlane/metadata --track production --version_code 14 \
     --skip_upload_apk true --skip_upload_aab true \
     --skip_upload_metadata true --skip_upload_changelogs true \
     --sync_image_upload true
   ```
   `sync_image_upload` checks sha256 and skips unchanged images — copying the live tablet
   shots into the dir means they're left untouched, and only the new phone shots upload.

### ⚠️ Genymotion can't run the release build deep into lessons
The new-arch release build **ANRs** ("isn't responding") past the lesson-hook screen on the
Genymotion Nexus 6 x86 image — the JS thread stalls under the lesson-stage image load. It is a
device-performance limit, **not** an app bug (the AAB is fine). You can screenshot Home,
Lessons list, lesson story, and the learning-hook/Quick-Jump screen, but **not** an
interactive quiz/question screen. For deeper screens use a physical device or a faster AVD.

---

## Reading Play state via API (verification)

System Ruby lacks the Google gems; use fastlane's bundled gems with Homebrew Ruby:

```bash
export GEM_HOME=/opt/homebrew/Cellar/fastlane/<ver>/libexec
export GEM_PATH=/opt/homebrew/Cellar/fastlane/<ver>/libexec
/opt/homebrew/opt/ruby/bin/ruby verify_track.rb   # uses googleauth + androidpublisher_v3
```
`verify_track.rb`: insert a (read-only) edit, `get_edit_track(pkg, edit.id, 'production')`,
print `release.status` + `release.version_codes`, then `delete_edit` to discard. This session
confirmed: `v14 status=draft` (ours) alongside `v11 status=completed` (pre-existing live).
