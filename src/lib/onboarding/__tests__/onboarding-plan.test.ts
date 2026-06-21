import { buildPlan } from '../onboarding-plan';

const DAY = 24 * 60 * 60 * 1000;
const base = {
  experience: 'new' as const,
  confidence: { people: 4, process: 2, business: 5 },
  chosenDomain: 'people' as const,
  totalLessons: 50,
  now: 0,
};

test('recommendedDomain is the lowest-confidence domain', () => {
  expect(buildPlan({ ...base, examDate: null }).recommendedDomain).toBe('process');
});

test('focusDomain follows the explicit choice, not the recommendation', () => {
  expect(buildPlan({ ...base, examDate: null }).focusDomain).toBe('people');
});

test('no exam date defaults to a steady 2/day plan', () => {
  const plan = buildPlan({ ...base, examDate: null });
  expect(plan.dailyGoal).toBe(2);
  expect(plan.readyByDate).toBe(25 * DAY); // 50 lessons / 2 per day
});

test('a near exam date forces an accelerated pace, capped at the exam date', () => {
  const plan = buildPlan({ ...base, examDate: 20 * DAY }); // 50 lessons in 20 days -> 3/day
  expect(plan.dailyGoal).toBeGreaterThanOrEqual(3);
  expect(plan.intensity).toBe('accelerated');
  expect(plan.readyByDate).toBeLessThanOrEqual(20 * DAY);
});

test('pace is clamped to a 1..5 range', () => {
  const tight = buildPlan({ ...base, examDate: 2 * DAY }); // would need 25/day
  expect(tight.dailyGoal).toBe(5);
  const loose = buildPlan({ ...base, examDate: 500 * DAY });
  expect(loose.dailyGoal).toBeGreaterThanOrEqual(1);
});

test('rationale notes low confidence when the choice matches the recommendation', () => {
  const plan = buildPlan({ ...base, chosenDomain: 'process', examDate: null });
  expect(plan.rationale).toMatch(/confiden/i);
});
