import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

const STAGGER = 80;

type Props = {
  /** Position in a list — used to stagger the entrance when `delay` is omitted. */
  index?: number;
  /** Explicit delay in ms; overrides the index-based stagger. */
  delay?: number;
  children: React.ReactNode;
};

// Lightweight entrance wrapper: a simple fade-in with a small upward slide on
// mount. Used to stagger objects as a screen appears (question options, hook
// sections, etc.). Kept intentionally plain — no spring/bounce.
export function Appear({ index = 0, delay, children }: Props) {
  const ms = delay ?? index * STAGGER;
  return (
    <Animated.View
      entering={FadeInDown.delay(ms)
        .duration(300)
        // Small, controlled slide (12px) instead of FadeInDown's larger default.
        .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] })}
    >
      {children}
    </Animated.View>
  );
}
