import type { LessonDomain } from '../types/lesson';
import type { Domain } from '../types/progress';
import { getAllLessons } from './lessons-data';

// PMP has three domains. Lesson content tags them Title-case (and uses the full
// "Business Environment" name); progress/home use lowercase keys.
export const DOMAIN_ORDER: Domain[] = ['people', 'process', 'business'];

export const DOMAIN_OF: Record<LessonDomain, Domain> = {
  People: 'people',
  Process: 'process',
  Business: 'business',
  'Business Environment': 'business',
};

export const DOMAIN_TITLE: Record<Domain, string> = {
  people: 'People',
  process: 'Process',
  business: 'Business Environment',
};

// Real number of lessons per domain, derived from the bundled content (not a
// hardcoded guess) so progress percentages reflect the actual curriculum.
export function domainLessonTotals(): Record<Domain, number> {
  const totals: Record<Domain, number> = { people: 0, process: 0, business: 0 };
  for (const lesson of getAllLessons()) totals[DOMAIN_OF[lesson.domain]] += 1;
  return totals;
}
