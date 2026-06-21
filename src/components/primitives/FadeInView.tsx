import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Fades (and gently lifts) its children in on mount. Built on React Native's
 * Animated so it has no navigation/runtime dependency and is safe to render in
 * unit tests.
 */
export function FadeInView({
  children,
  duration = 450,
  offset = 8,
  style,
}: {
  children: React.ReactNode;
  duration?: number;
  /** Initial downward offset (px) the content lifts up from as it fades in. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: 1, duration, useNativeDriver: true }).start();
  }, [progress, duration]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] });

  return (
    <Animated.View style={[{ opacity: progress, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}
