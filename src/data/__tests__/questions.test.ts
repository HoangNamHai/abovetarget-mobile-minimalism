import {
  MONOGRAPH_QUIZ_1,
  ELITE_QUIZ_12,
  ELITE_BRUTALISM_QUIZ,
  ELITE_LUXURY_QUIZ,
  ALL_QUESTIONS,
  questionById,
  Question,
} from '../questions';

// ── Type shape ────────────────────────────────────────────────────────────────

test('Question type accepts lowercase brand values', () => {
  const q: Question = {
    id: 'test-q',
    brand: 'monograph',
    module: 'TEST',
    numberInfo: '01',
    questionText: 'Test?',
    options: [{ key: 'A', label: 'Yes' }],
    correctKey: 'A',
    explanation: 'Because.',
  };
  expect(q.brand).toBe('monograph');
});

// ── MONOGRAPH_QUIZ_1 ──────────────────────────────────────────────────────────

test('MONOGRAPH_QUIZ_1 has correct id and brand', () => {
  expect(MONOGRAPH_QUIZ_1.id).toBe('mono-q1');
  expect(MONOGRAPH_QUIZ_1.brand).toBe('monograph');
});

test('MONOGRAPH_QUIZ_1 has correct module and numberInfo', () => {
  expect(MONOGRAPH_QUIZ_1.module).toBe('SCENARIO 01 / 12');
  expect(MONOGRAPH_QUIZ_1.numberInfo).toBe('SCENARIO 01 / 12');
});

test('MONOGRAPH_QUIZ_1 questionText is verbatim', () => {
  expect(MONOGRAPH_QUIZ_1.questionText).toBe(
    'A local culinary institution maintains its reputation through a consistent Daily Food Service cycle, ensuring quality and efficiency in every dish delivered to its patrons throughout the fiscal year.'
  );
});

test('MONOGRAPH_QUIZ_1 has two options with icons', () => {
  expect(MONOGRAPH_QUIZ_1.options).toHaveLength(2);
  expect(MONOGRAPH_QUIZ_1.options[0]).toEqual({ key: 'project', label: 'Project', icon: 'architecture' });
  expect(MONOGRAPH_QUIZ_1.options[1]).toEqual({ key: 'operations', label: 'Operations', icon: 'settings_alert' });
});

test('MONOGRAPH_QUIZ_1 correctKey and explanation', () => {
  expect(MONOGRAPH_QUIZ_1.correctKey).toBe('operations');
  expect(MONOGRAPH_QUIZ_1.explanation).toBe(
    'Operations are ongoing and repetitive activities that sustain the business. A daily food service cycle has no defined end date and is executed continuously throughout the fiscal year, unlike a project which is temporary and unique.'
  );
});

// ── ELITE_QUIZ_12 ─────────────────────────────────────────────────────────────

test('ELITE_QUIZ_12 has correct id and brand', () => {
  expect(ELITE_QUIZ_12.id).toBe('elite-q12');
  expect(ELITE_QUIZ_12.brand).toBe('elite');
});

test('ELITE_QUIZ_12 has correct module and numberInfo', () => {
  expect(ELITE_QUIZ_12.module).toBe('MODULE 04: EXECUTION');
  expect(ELITE_QUIZ_12.numberInfo).toBe('QUESTION 12/20');
});

test('ELITE_QUIZ_12 has four options', () => {
  expect(ELITE_QUIZ_12.options).toHaveLength(4);
  expect(ELITE_QUIZ_12.options[0]).toEqual({ key: 'A', label: 'Execution' });
  expect(ELITE_QUIZ_12.options[1]).toEqual({ key: 'B', label: 'Initiation' });
  expect(ELITE_QUIZ_12.options[2]).toEqual({ key: 'C', label: 'Closing' });
  expect(ELITE_QUIZ_12.options[3]).toEqual({ key: 'D', label: 'Planning' });
});

test('ELITE_QUIZ_12 correctKey is B', () => {
  expect(ELITE_QUIZ_12.correctKey).toBe('B');
});

// ── ELITE_BRUTALISM_QUIZ ──────────────────────────────────────────────────────

test('ELITE_BRUTALISM_QUIZ has correct id and brand', () => {
  expect(ELITE_BRUTALISM_QUIZ.id).toBe('elite-brutalism-q7');
  expect(ELITE_BRUTALISM_QUIZ.brand).toBe('elite');
});

test('ELITE_BRUTALISM_QUIZ module and numberInfo', () => {
  expect(ELITE_BRUTALISM_QUIZ.module).toBe('Module 04 // Strategy');
  expect(ELITE_BRUTALISM_QUIZ.numberInfo).toBe('07/12');
});

test('ELITE_BRUTALISM_QUIZ correctKey is D', () => {
  expect(ELITE_BRUTALISM_QUIZ.correctKey).toBe('D');
});

// ── ELITE_LUXURY_QUIZ ─────────────────────────────────────────────────────────

test('ELITE_LUXURY_QUIZ has correct id and brand', () => {
  expect(ELITE_LUXURY_QUIZ.id).toBe('elite-luxury-q4');
  expect(ELITE_LUXURY_QUIZ.brand).toBe('elite');
});

test('ELITE_LUXURY_QUIZ module and numberInfo', () => {
  expect(ELITE_LUXURY_QUIZ.module).toBe('LEVEL 04 / 12');
  expect(ELITE_LUXURY_QUIZ.numberInfo).toBe('LEVEL 04 / 12');
});

test('ELITE_LUXURY_QUIZ has four options', () => {
  expect(ELITE_LUXURY_QUIZ.options).toHaveLength(4);
  expect(ELITE_LUXURY_QUIZ.options[0]).toEqual({ key: 'A', label: 'Execution' });
  expect(ELITE_LUXURY_QUIZ.options[1]).toEqual({ key: 'B', label: 'Initiation' });
  expect(ELITE_LUXURY_QUIZ.options[2]).toEqual({ key: 'C', label: 'Preservation' });
  expect(ELITE_LUXURY_QUIZ.options[3]).toEqual({ key: 'D', label: 'Obsolescence' });
});

// ── ALL_QUESTIONS ─────────────────────────────────────────────────────────────

test('ALL_QUESTIONS contains all four questions', () => {
  expect(ALL_QUESTIONS).toHaveLength(4);
  const ids = ALL_QUESTIONS.map((q) => q.id);
  expect(ids).toContain('mono-q1');
  expect(ids).toContain('elite-q12');
  expect(ids).toContain('elite-brutalism-q7');
  expect(ids).toContain('elite-luxury-q4');
});

// ── questionById ──────────────────────────────────────────────────────────────

test('questionById returns correct question', () => {
  expect(questionById('mono-q1')).toBe(MONOGRAPH_QUIZ_1);
  expect(questionById('elite-q12')).toBe(ELITE_QUIZ_12);
});

test('questionById returns undefined for unknown id', () => {
  expect(questionById('unknown')).toBeUndefined();
});
