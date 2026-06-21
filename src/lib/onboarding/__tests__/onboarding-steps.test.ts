import { ONBOARDING_ORDER, progressFor } from '../onboarding-steps';

test('order starts at splash and ends at the domain picker', () => {
  expect(ONBOARDING_ORDER[0]).toBe('splash');
  expect(ONBOARDING_ORDER[ONBOARDING_ORDER.length - 1]).toBe('domain');
});

test('value screens and the domain picker have no progress bar', () => {
  expect(progressFor('splash')).toBeNull();
  expect(progressFor('story-concept')).toBeNull();
  expect(progressFor('domain')).toBeNull();
});

test('first question is pre-filled (~15%) and progress increases monotonically', () => {
  const examDate = progressFor('exam-date')!;
  const commit = progressFor('commit')!;
  expect(examDate).toBeGreaterThanOrEqual(0.1);
  expect(examDate).toBeLessThan(0.25);
  expect(commit).toBeGreaterThan(examDate);
  expect(commit).toBeLessThanOrEqual(1);
});
