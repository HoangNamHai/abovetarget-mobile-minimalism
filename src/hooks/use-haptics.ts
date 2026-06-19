import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { useSettingsOptional } from '../contexts/settings-context';

// Haptic feedback gated by the user's "Haptics" preference. Components should
// call this instead of expo-haptics directly so the Profile toggle takes effect.
export function useHaptics() {
  const { haptics } = useSettingsOptional();

  const impact = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (!haptics) return;
      Haptics.impactAsync(style);
    },
    [haptics],
  );

  return { enabled: haptics, impact };
}
