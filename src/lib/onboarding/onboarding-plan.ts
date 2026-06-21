import type { Domain } from '../../types/progress';

export interface PlanInputs {
  examDate: number | null;
  experience: 'new' | 'informal' | 'experienced';
  confidence: { people: number; process: number; business: number };
  chosenDomain: Domain;
  totalLessons: number;
  now: number;
  dailyMinutes: number; // the minutes/day the user committed to (10 / 20 / 30)
}

export interface Plan {
  recommendedDomain: Domain;
  focusDomain: Domain;
  intensity: 'foundational' | 'steady' | 'accelerated';
  dailyMinutes: number;
  dailyGoal: number; // lessons/day, derived from dailyMinutes
  readyByDate: number | null; // epoch ms, capped at examDate
  rationale: string;
}

const DAY = 24 * 60 * 60 * 1000;
// A lesson runs ~10 minutes, so the committed minutes map to lessons/day.
const MINUTES_PER_LESSON = 10;
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
  const { examDate, experience, confidence, chosenDomain, totalLessons, now, dailyMinutes } = inputs;
  const recommendedDomain = lowestConfidence(confidence);

  const dailyGoal = clamp(Math.round(dailyMinutes / MINUTES_PER_LESSON), 1, 5);

  const daysToFinish = Math.ceil(totalLessons / dailyGoal);
  let readyByDate: number | null = now + daysToFinish * DAY;
  if (examDate != null && readyByDate > examDate) readyByDate = examDate;

  let intensity: Plan['intensity'];
  if (dailyGoal >= 3) intensity = 'accelerated';
  else if (dailyGoal <= 1 && experience === 'new') intensity = 'foundational';
  else intensity = 'steady';

  const focusLabel = DOMAIN_LABEL[chosenDomain];
  const matchesRecommendation = chosenDomain === recommendedDomain;
  const why = matchesRecommendation
    ? `starting in ${focusLabel} — the area you felt least confident in.`
    : `starting where you chose: ${focusLabel}.`;
  const rationale = `${dailyMinutes} minutes a day, ${why}`;

  return { recommendedDomain, focusDomain: chosenDomain, intensity, dailyMinutes, dailyGoal, readyByDate, rationale };
}
