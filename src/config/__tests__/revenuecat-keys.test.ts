// Task 8: RevenueCat keys are selected by build profile so a Test-Store key never
// ships in a production build (which would crash the SDK), while dev/preview keep
// exercising the Test Store.

describe('RevenueCat key selection by build profile', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('production builds use the live store keys (appl_/goog_)', () => {
    process.env.EXPO_PUBLIC_ENV = 'production';
    const { REVENUECAT_API_KEYS } = require('../revenuecat');
    expect(REVENUECAT_API_KEYS.ios).toMatch(/^appl_/);
    expect(REVENUECAT_API_KEYS.android).toMatch(/^goog_/);
  });

  test('dev / preview builds use the Test Store key', () => {
    process.env.EXPO_PUBLIC_ENV = 'development';
    const { REVENUECAT_API_KEYS } = require('../revenuecat');
    expect(REVENUECAT_API_KEYS.ios).toMatch(/^test_/);
    expect(REVENUECAT_API_KEYS.android).toMatch(/^test_/);
  });

  test('REVENUECAT_DISABLED is false once the enabled flag is true', () => {
    process.env.EXPO_PUBLIC_REVENUECAT_ENABLED = 'true';
    const { REVENUECAT_DISABLED } = require('../revenuecat');
    expect(REVENUECAT_DISABLED).toBe(false);
  });

  test('REVENUECAT_DISABLED is true when the flag is unset', () => {
    delete process.env.EXPO_PUBLIC_REVENUECAT_ENABLED;
    const { REVENUECAT_DISABLED } = require('../revenuecat');
    expect(REVENUECAT_DISABLED).toBe(true);
  });
});
