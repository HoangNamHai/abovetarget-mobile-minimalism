'use strict';
module.exports = {
  __esModule: true,
  makeShareableCloneRecursive: (val) => val,
  isSharedValue: () => false,
  createWorkletRuntime: () => ({}),
  runOnRuntime: (fn) => fn,
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
};
