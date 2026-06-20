// ============================================
// Feature Flags
// ============================================

/**
 * Show Developer Options section on the Profile screen.
 *
 * Tied to `__DEV__`: visible only in development builds, automatically hidden in
 * release/store builds (where `__DEV__` is false), so reviewers never see debug
 * controls. Hard-set to `false` if you need to hide it inside a dev build too.
 *
 * Gives access to:
 *   - Onboarding reset
 *   - Progress reset
 *   - Daily limit reset
 *   - Reset all data (wipe + relaunch onboarding)
 */
export const SHOW_DEV_OPTIONS = __DEV__;
