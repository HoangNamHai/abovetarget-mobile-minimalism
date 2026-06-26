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
