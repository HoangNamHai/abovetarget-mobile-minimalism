export interface Question {
  id: string;
  brand: 'monograph' | 'elite';
  module: string;
  numberInfo: string;
  questionText: string;
  options: {
    key: string;
    label: string;
    icon?: string;
  }[];
  correctKey: string;
  explanation: string;
}

export const MONOGRAPH_QUIZ_1: Question = {
  id: 'mono-q1',
  brand: 'monograph',
  module: 'SCENARIO 01 / 12',
  numberInfo: 'SCENARIO 01 / 12',
  questionText:
    'A local culinary institution maintains its reputation through a consistent Daily Food Service cycle, ensuring quality and efficiency in every dish delivered to its patrons throughout the fiscal year.',
  options: [
    { key: 'project', label: 'Project', icon: 'architecture' },
    { key: 'operations', label: 'Operations', icon: 'settings_alert' },
  ],
  correctKey: 'operations',
  explanation:
    'Operations are ongoing and repetitive activities that sustain the business. A daily food service cycle has no defined end date and is executed continuously throughout the fiscal year, unlike a project which is temporary and unique.',
};

export const ELITE_QUIZ_12: Question = {
  id: 'elite-q12',
  brand: 'elite',
  module: 'MODULE 04: EXECUTION',
  numberInfo: 'QUESTION 12/20',
  questionText: "Which phase involves defining the project's scope and objectives?",
  options: [
    { key: 'A', label: 'Execution' },
    { key: 'B', label: 'Initiation' },
    { key: 'C', label: 'Closing' },
    { key: 'D', label: 'Planning' },
  ],
  correctKey: 'B',
  explanation:
    'The Initiation phase is where the project is formally authorized, high-level objectives are established, and the project scope is defined at a macro level before committing extensive resources.',
};

export const ELITE_BRUTALISM_QUIZ: Question = {
  id: 'elite-brutalism-q7',
  brand: 'elite',
  module: 'Module 04 // Strategy',
  numberInfo: '07/12',
  questionText:
    'In the context of structural brutalism, which phase determines the final visual rhythm of a monolithic silhouette?',
  options: [
    { key: 'A', label: 'Conceptualization' },
    { key: 'B', label: 'Materiality' },
    { key: 'C', label: 'Execution' },
    { key: 'D', label: 'Planning' },
  ],
  correctKey: 'D',
  explanation:
    'Planning determines the structured geometry, the structural rhythmic sequence, and load-bearing parameters which govern the spatial and visual silhouette of a brutalist monolith.',
};

export const ELITE_LUXURY_QUIZ: Question = {
  id: 'elite-luxury-q4',
  brand: 'elite',
  module: 'LEVEL 04 / 12',
  numberInfo: 'LEVEL 04 / 12',
  questionText: 'Which stage marks the beginning of the luxury life cycle?',
  options: [
    { key: 'A', label: 'Execution' },
    { key: 'B', label: 'Initiation' },
    { key: 'C', label: 'Preservation' },
    { key: 'D', label: 'Obsolescence' },
  ],
  correctKey: 'B',
  explanation:
    'The Initiation phase involves the conceptualization of exclusive motifs and artisanal sourcing, which precedes the execution stage of technical production.',
};

export const ALL_QUESTIONS: Question[] = [
  MONOGRAPH_QUIZ_1,
  ELITE_QUIZ_12,
  ELITE_BRUTALISM_QUIZ,
  ELITE_LUXURY_QUIZ,
];

export function questionById(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}
