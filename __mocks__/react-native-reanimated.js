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
  withDelay: (_delay, val) => val,
  withSequence: (...vals) => vals[vals.length - 1],
  withRepeat: (val) => val,
  useAnimatedGestureHandler: () => ({}),
  useAnimatedScrollHandler: () => ({}),
  useAnimatedRef: () => ({ current: null }),
  useAnimatedReaction: () => {},
  useDerivedValue: (fn) => ({ value: fn() }),
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  cancelAnimation: () => {},
  Easing: {
    linear: (t) => t,
    ease: (t) => t,
    quad: (t) => t,
    cubic: (t) => t,
    exp: (t) => t,
    bezier: () => ({ factory: () => (t) => t }),
    in: (fn) => fn,
    out: (fn) => fn,
    inOut: (fn) => fn,
  },
  interpolate: (value, inputRange, outputRange) => outputRange[0],
  Extrapolation: { CLAMP: 'clamp' },
};

// Chainable entering/exiting layout-animation builders. Real Reanimated exposes
// these as fluent objects (`FadeInDown.delay(80).duration(300).springify()`);
// the mock just needs every method to return the same chainable so constructing
// an animation never throws during a test render.
function makeChainable() {
  const chain = {};
  const methods = [
    'delay',
    'duration',
    'springify',
    'damping',
    'mass',
    'stiffness',
    'easing',
    'withInitialValues',
    'build',
    'randomDelay',
    'reduceMotion',
    'withCallback',
    'rotate',
  ];
  for (const m of methods) chain[m] = () => chain;
  return chain;
}

for (const name of [
  'FadeIn',
  'FadeInDown',
  'FadeInUp',
  'FadeInLeft',
  'FadeInRight',
  'FadeOut',
  'FadeOutDown',
  'FadeOutUp',
  'SlideInDown',
  'SlideInUp',
  'SlideOutDown',
  'SlideOutUp',
  'ZoomIn',
  'ZoomOut',
  'LinearTransition',
]) {
  module.exports[name] = makeChainable();
}
