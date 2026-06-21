export const ONBOARDING_ORDER: string[] = [
  'splash', 'story-concept', 'story-cast',
  'exam-date', 'fact-exam', 'why-certified', 'fact-social',
  'experience', 'fact-content', 'confidence', 'fact-study',
  'belief', 'reminder', 'commit', 'domain',
];

// Screens that show no progress bar: the opening value screens and the domain
// picker (which has no Continue — tapping a card finishes onboarding).
const NO_BAR = new Set(['splash', 'story-concept', 'story-cast', 'domain']);

// The progress bar spans from the first question (`exam-date`) to `domain`,
// pre-filled to BASE so step one already feels underway (endowed progress).
const BASE = 0.15;
const FIRST = 'exam-date';
const LAST = 'domain';

export function progressFor(slug: string): number | null {
  if (NO_BAR.has(slug)) return null;
  const start = ONBOARDING_ORDER.indexOf(FIRST);
  const end = ONBOARDING_ORDER.indexOf(LAST);
  const i = ONBOARDING_ORDER.indexOf(slug);
  if (i < 0) return null;
  const t = (i - start) / (end - start); // 0..1 across the question span
  return BASE + (1 - BASE) * Math.max(0, Math.min(1, t));
}
