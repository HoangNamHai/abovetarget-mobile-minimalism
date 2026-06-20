import React from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

type Props = {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  testID?: string;
};

export function PressableFeedback({ onPress, children, className, disabled = false, testID }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPressIn={() => {
        if (disabled) return;
        scale.value = withTiming(0.96, { duration: 80 });
      }}
      onPressOut={() => {
        if (disabled) return;
        scale.value = withTiming(1, { duration: 120 });
      }}
      onPress={onPress}
    >
      <Animated.View className={className} style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
