import {
  initMonitoring,
  captureException,
  __setMonitoringClientForTests,
} from '../monitoring';

afterEach(() => __setMonitoringClientForTests(null));

test('initMonitoring does NOT init the client in dev/test', () => {
  const init = jest.fn();
  __setMonitoringClientForTests({ init, captureException: jest.fn(), wrap: (c) => c });
  initMonitoring();
  // sentryEnabled() is false under jest (__DEV__), so init must not be called.
  expect(init).not.toHaveBeenCalled();
});

test('captureException is a no-op when monitoring is disabled', () => {
  const captured = jest.fn();
  __setMonitoringClientForTests({ init: jest.fn(), captureException: captured, wrap: (c) => c });
  expect(() => captureException(new Error('boom'), { a: 1 })).not.toThrow();
  expect(captured).not.toHaveBeenCalled();
});
