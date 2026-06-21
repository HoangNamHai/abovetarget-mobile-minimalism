# E2E test suite — RevenueCat + Clerk (Maestro)

Cross-platform Maestro flows verifying the RevenueCat subscription stack and Clerk auth.

## Prerequisites
- App built as a dev/preview build (RevenueCat is a native module — not Expo Go) with
  `EXPO_PUBLIC_REVENUECAT_ENABLED=true` so the RevenueCat Test Store is live.
- Metro running; an iOS Simulator and/or Android emulator with the app installed.

## Flows
| File | What it verifies |
|------|------------------|
| `01-revenuecat-paywall.yaml` | Paywall renders; the 3 Test Store packages (Monthly/Yearly/Lifetime) load with prices. Requires FREE state. |
| `02-revenuecat-purchase.yaml` | Buy a package via the Test Store dialog ("valid purchase") → `pro` entitlement → Status PREMIUM. Requires FREE state. |
| `03-revenuecat-restore.yaml` | "Restore Purchases" invokes the SDK and reports a result. |
| `04-clerk-session.yaml` | App boots past the auth gate with an active session (profile shows the signed-in email). Requires SIGNED-IN state. |
| `05-clerk-signup.yaml` | Full email sign-up + code verification (Clerk test email + code 424242) → active session. Requires SIGNED-OUT state. |

## Run
```
# iOS
maestro --device <ios-sim-udid> test .maestro/01-revenuecat-paywall.yaml
# Android
maestro --device <adb-serial> test .maestro/01-revenuecat-paywall.yaml
```

## Notes
- The purchase flow (02) flips the RevenueCat user to PREMIUM (Test Store). Re-running the
  FREE-state flows (01, 02) needs a reset: reinstall the app (new anonymous RC user) or reset
  the customer in the RevenueCat dashboard.
- Prices differ by locale (iOS `US$9,99`, Android `$9.99`) — selectors match the `$`.
- Test Store dialog button text differs by OS (iOS "Test valid purchase", Android
  "TEST VALID PURCHASE") — flow 02 matches case-insensitively.
