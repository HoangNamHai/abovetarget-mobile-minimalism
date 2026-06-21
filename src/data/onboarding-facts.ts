export interface Fact {
  id: string;
  text: string;
  source?: string;
}

// Single source of truth for exam-detail copy. PMI updates the exam 2026-07-09
// (time rises toward ~240 min, PMBOK 8th ed.) — revisit `exam` and `content`.
export const FACTS = {
  exam: {
    id: 'exam',
    text: 'The PMP exam is 180 questions. You’ll have 230 minutes — and two optional breaks.',
  },
  social: {
    id: 'social',
    text: 'Over 1 million professionals hold the PMP. They report ~24% higher median salary.',
  },
  content: {
    id: 'content',
    text: 'Roughly half the exam is predictive — the other half agile or hybrid.',
  },
  study: {
    id: 'study',
    text: 'Most candidates study 60–200 hours. A daily habit beats weekend cramming.',
  },
} satisfies Record<string, Fact>;

export function getFact(id: keyof typeof FACTS): Fact {
  return FACTS[id];
}
