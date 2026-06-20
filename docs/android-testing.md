# Testing PMP Exam Pro on Android (CLI / Automated)

How to boot an Android emulator, install & launch the app, and drive it
automatically — all from the terminal, no GUI clicking required.

This repo folder is `monograph-elite-native`, but the app is **PMP Exam Pro**:

| Property        | Value                          |
| --------------- | ------------------------------ |
| Expo SDK        | `~56.0.x` (managed, no `android/` dir) |
| App name / slug | `PMP Exam Pro` / `pmp-exam-pro` |
| Android package | `com.h2ai.pmpexampro`          |
| New Architecture| Yes (Reanimated 4)             |

---

## 0. Tooling on this machine

| Tool        | Path                                                        |
| ----------- | ---------------------------------------------------------- |
| `gmtool`    | `/Applications/Genymotion.app/Contents/MacOS/gmtool`       |
| `genyshell` | `/Applications/Genymotion.app/Contents/MacOS/genyshell`    |
| `adb`       | `/opt/homebrew/bin/adb` (also `~/Library/Android/sdk/platform-tools/adb`) |
| Android SDK | `~/Library/Android/sdk`                                    |

Convenience alias (optional, add to `~/.zshrc`):

```bash
alias gmtool="/Applications/Genymotion.app/Contents/MacOS/gmtool"
```

The emulator in use is the Genymotion **Google Nexus 6** (Android 13 / API 33).
Its ADB serial is `127.0.0.1:6554` when **Off** but shifts to `127.0.0.1:6555`
once **On** — use the *On* serial. Both **Expo Go** and the app
(`com.h2ai.pmpexampro`) are already installed on this device.

> ⚠️ Apple Silicon: Genymotion runs the device under `qemu`, and adb does **not**
> auto-register it. After starting, you must `adb connect 127.0.0.1:6555`.

---

## 1. Boot the emulator from the CLI

```bash
GM="/Applications/Genymotion.app/Contents/MacOS/gmtool"

# List available virtual devices + their state
"$GM" admin list

# Start the device. NOTE: on Apple Silicon this stays attached running the
# qemu/player process — run it in the background (&) or its own terminal.
"$GM" admin start "Google Nexus 6" &

# Confirm it flipped to "On" and note the live serial (6555):
"$GM" admin list

# Connect adb explicitly (required on Apple Silicon), then wait for boot:
adb connect 127.0.0.1:6555
adb wait-for-device
until [ "$(adb -s 127.0.0.1:6555 shell getprop sys.boot_completed | tr -d '\r')" = "1" ]; do sleep 2; done
adb devices                            # should show 127.0.0.1:6555  device
```

> Boot + adb-connect takes ~30–60s. `gmtool admin start` does not return on its
> own (it owns the player process) — background it.

Stop it again when done:

```bash
"$GM" admin stop "Google Nexus 6"      # or: "$GM" admin stopall
```

---

## 2. Get the app onto the emulator

This is a **managed** Expo app (no `android/` directory), so the dev workflow
runs the JS bundle inside a host app. Two paths:

### Path A — Expo Go (fastest for JS/UI testing) ✅ recommended

Expo Go is **already installed** on this device (`host.exp.exponent`). Genymotion
ships without Google Play, so if you ever need to (re)install it on a fresh
device:

```bash
# Verify it's there:
adb -s 127.0.0.1:6555 shell pm list packages | grep host.exp.exponent
# If missing, download the SDK 56 Expo Go APK (match the emulator ABI) and:
adb -s 127.0.0.1:6555 install -r /path/to/expo-go.apk
```

Then start the dev server and open the app on the emulator:

```bash
# from repo root
npx expo start --android
# or, if the server is already running, just press "a" in its terminal
```

`--android` builds the JS bundle and launches it in Expo Go via a deep link.
If Expo Go isn't installed, the CLI prompts to install it.

> Caveat: Expo Go only includes the native modules bundled with the SDK. This
> app's libs (Clerk, Sentry, FlashList, bottom-sheet, Reanimated 4, NetInfo)
> are all Expo-Go-compatible, but Sentry runs in a degraded/no-op mode there.
> If anything native misbehaves, use Path B.

### Path B — Dev client / native build (full fidelity)

Produces a real APK with all native modules. Needs the Android build toolchain
(JDK 17, Android SDK — already present here).

```bash
npx expo prebuild --platform android   # generates the android/ project
npx expo run:android                   # builds + installs + launches on the emulator
```

Or build a dev-client APK once and reuse it:

```bash
eas build --profile development --platform android --local
adb install -r <output>.apk
npx expo start --dev-client --android
```

### Launch the installed app directly

```bash
# Expo Go host:
adb shell monkey -p host.exp.exponent -c android.intent.category.LAUNCHER 1
# Dev/standalone build:
adb shell monkey -p com.h2ai.pmpexampro -c android.intent.category.LAUNCHER 1
```

---

## 3. Drive the app automatically (adb UI automation)

Everything a tester does by hand has an `adb` equivalent. These work against
whatever is on screen.

### Screenshots

```bash
adb exec-out screencap -p > /tmp/screen.png      # capture straight to host
```

Capture in a loop while you script taps to build a visual walkthrough.

### Screen recording

```bash
adb shell screenrecord /sdcard/run.mp4           # Ctrl-C to stop
adb pull /sdcard/run.mp4 ./run.mp4
```

### Tap, swipe, type, navigate

```bash
adb shell input tap <x> <y>                      # tap at pixel coords
adb shell input swipe <x1> <y1> <x2> <y2> 300    # swipe (last arg = ms)
adb shell input text "hello%saworld"             # type (%s = space)
adb shell input keyevent KEYCODE_BACK            # back button
adb shell input keyevent KEYCODE_ENTER
```

> The Nexus 6 is 1440×2560, density 560. Coordinates are physical pixels.

### Find element coordinates (so taps aren't guesswork)

```bash
# Dump the current UI hierarchy with bounds, pull it, and read it
adb shell uiautomator dump /sdcard/ui.xml
adb pull /sdcard/ui.xml /tmp/ui.xml
# Each node has bounds="[left,top][right,bottom]"; tap the center.
```

### Logs (watch for JS errors / crashes)

```bash
adb logcat -c                                    # clear first
adb logcat '*:E' ReactNative:V ReactNativeJS:V   # errors + RN/JS logs
```

---

## 4. One-shot smoke script

```bash
#!/usr/bin/env bash
set -euo pipefail
GM="/Applications/Genymotion.app/Contents/MacOS/gmtool"
DEVICE="Google Nexus 6"

"$GM" admin start "$DEVICE"
adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
  sleep 2
done
echo "Device booted."

# Start Expo dev server in the background and open on Android
npx expo start --android &

# Give it time to bundle, then screenshot the result
sleep 45
adb exec-out screencap -p > /tmp/pmp-launch.png
echo "Saved /tmp/pmp-launch.png — open it and verify the app rendered."
```

---

## 5. Fully automated UX walkthrough

For an end-to-end automated audit (boot → install → walk onboarding & lesson
flows → screenshot each step → produce a findings report), use the
**`pmp-app-ux-audit`** skill — it's built specifically for this app on an
Android emulator and orchestrates the steps above. Just ask:
*"audit the app on the emulator"*.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `adb devices` empty after start | `"$GM" admin start` may still be booting — wait, then re-check; ensure no other `adb` server conflict (`adb kill-server && adb start-server`). |
| Expo Go "missing module" / native crash | Use Path B (dev client / `expo run:android`). |
| `expo start --android` can't find device | Confirm `adb devices` shows `127.0.0.1:6554 device` first. |
| White/blank screen | Check `adb logcat ReactNativeJS:V` for the JS error. |
| Metro stale bundle | Restart with `npx expo start -c` (clears cache). |
