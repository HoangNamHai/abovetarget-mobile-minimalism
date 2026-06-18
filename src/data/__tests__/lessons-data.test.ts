import {
  lessonsIndex,
  getAllLessons,
  findLesson,
  getLessonData,
} from '../lessons-data';

test('lessonsIndex covers the four learning paths', () => {
  const paths = new Set(lessonsIndex.map((m) => m.path));
  expect(Array.from(paths).sort()).toEqual(['A', 'B', 'C', 'D']);
});

test('getAllLessons returns the full bundled lesson set', () => {
  const all = getAllLessons();
  expect(all.length).toBeGreaterThan(40);
});

test('every indexed lesson has resolvable lesson data', () => {
  for (const lesson of getAllLessons()) {
    expect(getLessonData(lesson.id)).not.toBeNull();
  }
});

test('findLesson resolves a known lesson by id', () => {
  const lesson = findLesson('A1L1');
  expect(lesson).toBeDefined();
  expect(lesson?.title).toBe('What is Project Management?');
});

test('getLessonData returns full content with screens for A1L1', () => {
  const data = getLessonData('A1L1');
  expect(data?.lessonId).toBe('A1L1');
  expect(Array.isArray(data?.screens)).toBe(true);
  expect((data?.screens.length ?? 0)).toBeGreaterThan(0);
});

test('getLessonData returns null for an unknown id', () => {
  expect(getLessonData('NOPE-DOES-NOT-EXIST')).toBeNull();
});
