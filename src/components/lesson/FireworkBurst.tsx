import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

// Celebration burst that plays once when the success feedback appears. Uses
// React Native's core Animated API (not Reanimated) because the feedback sheet
// is a native Modal, and Reanimated animations don't reliably drive inside a
// Modal's separate view hierarchy. No native Lottie dependency required.

const COLORS = ['#FFFFFF', '#FACC15', '#FDE68A', '#BBF7D0', '#FCA5A5', '#93C5FD', '#F9A8D4'];
const COUNT = 34;
const DURATION = 1500;

const PARTICLES = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2 + (i % 2 ? 0.12 : 0);
  const distance = 110 + (i % 5) * 34;
  return {
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    color: COLORS[i % COLORS.length],
    size: 7 + (i % 3) * 4,
    delay: (i % 7) * 45,
  };
});

function Particle({ p }: { p: (typeof PARTICLES)[number] }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: DURATION,
      delay: p.delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [t, p.delay]);

  const opacity = t.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] });
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] });
  // gravity arc: drift down as the particle flies out
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy + 70] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1.3, 0.4] });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: p.size,
          height: p.size,
          borderRadius: p.size / 2,
          backgroundColor: p.color,
        },
        { opacity, transform: [{ translateX }, { translateY }, { scale }] },
      ]}
    />
  );
}

export function FireworkBurst() {
  return (
    <View pointerEvents="none" style={styles.fill}>
      <View style={styles.origin}>
        {PARTICLES.map((p, i) => (
          <Particle key={i} p={p} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, alignItems: 'center' },
  // burst from just above the top edge of the feedback sheet
  origin: { position: 'absolute', top: '52%' },
});
