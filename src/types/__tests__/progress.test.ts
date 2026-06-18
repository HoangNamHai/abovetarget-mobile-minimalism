import { DOMAINS, isDomain } from '../progress';

test('DOMAINS lists the three PMP domains', () => {
  expect(DOMAINS).toEqual(['people', 'process', 'business']);
});

test('isDomain accepts valid domains and rejects others', () => {
  expect(isDomain('people')).toBe(true);
  expect(isDomain('process')).toBe(true);
  expect(isDomain('business')).toBe(true);
  expect(isDomain('marketing')).toBe(false);
  expect(isDomain(null)).toBe(false);
});
