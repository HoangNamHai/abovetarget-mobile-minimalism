import { buildPlan } from '../onboarding-plan';

const DAY = 24 * 60 * 60 * 1000;
const base = {
  experience: 'new' as const,
  confidence: { people: 4, process: 2, business: 5 },
  chosenDomain: 'people' as const,
  totalLessons: 50,
  now: 0,
  examDate: null as number | null,
  dailyMinutes: 20,
};

test('recommendedDomain is the lowest-confidence domain', () => {
  expect(buildPlan(base).recommendedDomain).toBe('process');
});

test('focusDomain follows the explicit choice, not the recommendation', () => {
  expect(buildPlan(base).focusDomain).toBe('people');
});

test('committed minutes set the daily pace (10→1, 20→2, 30→3 lessons)', () => {
  expect(buildPlan({ ...base, dailyMinutes: 10 }).dailyGoal).toBe(1);
  expect(buildPlan({ ...base, dailyMinutes: 20 }).dailyGoal).toBe(2);
  expect(buildPlan({ ...base, dailyMinutes: 30 }).dailyGoal).toBe(3);
});

test('30 minutes a day reads as an accelerated plan', () => {
  expect(buildPlan({ ...base, dailyMinutes: 30 }).intensity).toBe('accelerated');
});

test('readyByDate reflects the committed pace when there is no exam date', () => {
  expect(buildPlan({ ...base, dailyMinutes: 20 }).readyByDate).toBe(25 * DAY); // 50 / 2 per day
});

test('the projection is capped at the exam date', () => {
  const plan = buildPlan({ ...base, dailyMinutes: 10, examDate: 10 * DAY }); // 50 days needed, exam in 10
  expect(plan.readyByDate).toBeLessThanOrEqual(10 * DAY);
});

test('plan echoes the committed minutes', () => {
  expect(buildPlan({ ...base, dailyMinutes: 30 }).dailyMinutes).toBe(30);
});

test('rationale notes low confidence when the choice matches the recommendation', () => {
  expect(buildPlan({ ...base, chosenDomain: 'process' }).rationale).toMatch(/confiden/i);
});
