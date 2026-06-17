'use strict';
const React = require('react');
const { View, Animated: RNAnimated } = require('react-native');

const Animated = {
  View: View,
  Text: require('react-native').Text,
  Image: require('react-native').Image,
  createAnimatedComponent: (component) => component,
};

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue: (init) => ({ value: init }),
  useAnimatedStyle: (fn) => ({}),
  withTiming: (val) => val,
  withSpring: (val) => val,
  withDecay: (val) => val,
  useAnimatedGestureHandler: () => ({}),
  useAnimatedScrollHandler: () => ({}),
  useAnimatedRef: () => ({ current: null }),
  useAnimatedReaction: () => {},
  useDerivedValue: (fn) => ({ value: fn() }),
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  cancelAnimation: () => {},
  Easing: { linear: (t) => t, ease: (t) => t, bezier: () => ({ factory: () => (t) => t }) },
  interpolate: (value, inputRange, outputRange) => outputRange[0],
  Extrapolation: { CLAMP: 'clamp' },
  FadeIn: { duration: () => ({}) },
  FadeOut: { duration: () => ({}) },
  SlideInDown: { duration: () => ({}) },
  SlideOutDown: { duration: () => ({}) },
  ZoomIn: {},
  ZoomOut: {},
};
