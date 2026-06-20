import appJson from '../../../app.json';
import easJson from '../../../eas.json';

// Guards the shipping identity so it cannot silently regress to the showcase shell.
// These values are locked in docs/superpowers/specs/2026-06-19-pmp-merge-design.md.
test('app.json carries the PMP Exam Pro store identity', () => {
  const { expo } = appJson;
  expect(expo.name).toBe('PMP Exam Pro');
  expect(expo.slug).toBe('pmp-exam-pro');
  expect(expo.owner).toBe('hoangnamhai');
  expect(expo.scheme).toBe('pmp-exam-pro');
  expect(expo.ios.bundleIdentifier).toBe('com.h2ai.pmpexampro');
  expect(expo.android.package).toBe('com.h2ai.pmpexampro');
  expect(expo.extra.eas.projectId).toBe('d31b8c5a-d243-401a-af76-35f0b42342bc');
});

test('app.json registers the infra config plugins exactly once', () => {
  // JSON infers plugin tuples as (string | object)[]; the name is always the first/only entry.
  const names = appJson.expo.plugins.map((p) => String(Array.isArray(p) ? p[0] : p));
  expect(names).toContain('expo-notifications');
  expect(names).toContain('@sentry/react-native/expo');
  expect(names).toContain('expo-build-properties');
  // No bare/duplicate Sentry entry (the /expo config-plugin form is the only one).
  expect(names.filter((n) => n.startsWith('@sentry/react-native'))).toEqual([
    '@sentry/react-native/expo',
  ]);
});

test('eas.json defines the four build profiles and a production submit target', () => {
  expect(Object.keys(easJson.build)).toEqual([
    'development',
    'development-device',
    'preview',
    'production',
  ]);
  expect(easJson.build.production.distribution).toBe('store');
  expect(easJson.build.production.android.buildType).toBe('app-bundle');
  expect(easJson.build.production.android.credentialsSource).toBe('local');
  expect(easJson.submit.production.android.track).toBe('production');
  expect(easJson.submit.production.android.releaseStatus).toBe('draft');
});
