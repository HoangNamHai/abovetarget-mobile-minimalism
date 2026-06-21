import type { Domain } from '../../types/progress';

export interface PlanInputs {
  examDate: number | null;
  experience: 'new' | 'informal' | 'experienced';
  confidence: { people: number; process: number; business: number };
  chosenDomain: Domain;
  totalLessons: number;
  now: number;
}

export interface Plan {
  recommendedDomain: Domain;
  focusDomain: Domain;
  intensity: 'foundational' | 'steady' | 'accelerated';
  dailyGoal: number;
  readyByDate: number | null;
  rationale: string;
}

const DAY = 24 * 60 * 60 * 1000;
const DOMAIN_LABEL: Record<Domain, string> = {
  people: 'People',
  process: 'Process',
  business: 'Business Environment',
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// Lowest confidence wins; tie-break in fixed people<process<business order.
function lowestConfidence(c: PlanInputs['confidence']): Domain {
  const order: Domain[] = ['people', 'process', 'business'];
  return order.reduce((best, d) => (c[d] < c[best] ? d : best), 'people' as Domain);
}

export function buildPlan(inputs: PlanInputs): Plan {
  const { examDate, experience, confidence, chosenDomain, totalLessons, now } = inputs;
  const recommendedDomain = lowestConfidence(confidence);

  let dailyGoal = 2;
  if (examDate != null && examDate > now) {
    const daysUntil = Math.max(1, Math.floor((examDate - now) / DAY));
    dailyGoal = clamp(Math.ceil(totalLessons / daysUntil), 1, 5);
  }

  const daysToFinish = Math.ceil(totalLessons / dailyGoal);
  let readyByDate: number | null = now + daysToFinish * DAY;
  if (examDate != null && readyByDate > examDate) readyByDate = examDate;

  let intensity: Plan['intensity'];
  if (dailyGoal >= 3) intensity = 'accelerated';
  else if (dailyGoal <= 1 && experience === 'new') intensity = 'foundational';
  else intensity = 'steady';

  const focusLabel = DOMAIN_LABEL[chosenDomain];
  const matchesRecommendation = chosenDomain === recommendedDomain;
  const timing =
    examDate != null
      ? `Your exam is coming up, so we’re building a ${dailyGoal}-a-day plan`
      : `We’re building a steady ${dailyGoal}-a-day plan`;
  const why = matchesRecommendation
    ? `starting in ${focusLabel} — the area you felt least confident in.`
    : `starting where you chose: ${focusLabel}.`;
  const rationale = `${timing}, ${why}`;

  return { recommendedDomain, focusDomain: chosenDomain, intensity, dailyGoal, readyByDate, rationale };
}
