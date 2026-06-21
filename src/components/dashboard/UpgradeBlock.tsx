import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { RADIUS } from '../../theme/tokens';
import { Button } from '../primitives/Button';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';

// The app is otherwise strictly monochrome (see theme/tokens.ts). This is the
// single colored surface in the product — the premium accent. Kept local so the
// global palette stays ink-only; promote to a token only if color spreads.
const PREMIUM_GRADIENT = ['#0A0A0A', '#B98A2E'] as const;
const ON_PREMIUM = '#ffffff';
const ON_PREMIUM_MUTED = 'rgba(255,255,255,0.7)';

type Props = {
  /** Open the paywall. Fired by both the card surface and the button. */
  onPress: () => void;
};

/**
 * Free-tier upgrade call-to-action shown on the Home dashboard. Presentational
 * only — the caller decides whether to render it (free users) and where it goes.
 */
export function UpgradeBlock({ onPress }: Props) {
  return (
    <PressableFeedback onPress={onPress}>
      <LinearGradient
        colors={PREMIUM_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: RADIUS.card, overflow: 'hidden', padding: 28 }}
      >
        <Txt
          variant="label"
          style={{ fontSize: 11, letterSpacing: 3, color: ON_PREMIUM_MUTED, marginBottom: 10 }}
        >
          UNLOCK PMP EXAM PRO
        </Txt>
        <Txt
          variant="display"
          style={{ fontSize: 24, lineHeight: 30, color: ON_PREMIUM, marginBottom: 20 }}
        >
          Pass the PMP faster with unlimited practice.
        </Txt>
        <Button label="Go Premium →" onPress={onPress} variant="secondary" />
      </LinearGradient>
    </PressableFeedback>
  );
}
