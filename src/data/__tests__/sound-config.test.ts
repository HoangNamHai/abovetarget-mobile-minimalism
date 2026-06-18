import { SOUND_CONFIGS } from '../sound-config';

test('there are twelve sound configs', () => {
  expect(SOUND_CONFIGS).toHaveLength(12);
});

test('every sound name is unique', () => {
  const names = SOUND_CONFIGS.map((c) => c.name);
  expect(new Set(names).size).toBe(names.length);
});

test('every config has a filename, a known folder, and a valid volume', () => {
  const folders = ['ui', 'feedback', 'transitions', 'milestones', 'ambient'];
  for (const c of SOUND_CONFIGS) {
    expect(c.fileName.length).toBeGreaterThan(0);
    expect(folders).toContain(c.folder);
    expect(c.volume).toBeGreaterThan(0);
    expect(c.volume).toBeLessThanOrEqual(1);
  }
});

test('includes the loopable ambient study-mode track', () => {
  const studyMode = SOUND_CONFIGS.find((c) => c.name === 'study-mode');
  expect(studyMode?.isLoopable).toBe(true);
  expect(studyMode?.folder).toBe('ambient');
});
