import { FACTS, getFact } from '../onboarding-facts';

test('every fact has non-empty text', () => {
  for (const key of Object.keys(FACTS) as (keyof typeof FACTS)[]) {
    expect(getFact(key).text.length).toBeGreaterThan(0);
  }
});

test('exam fact mentions question count', () => {
  expect(FACTS.exam.text).toMatch(/180/);
});
