import {
  getLessonThumbnail,
  getLessonImage,
  hasLessonImage,
  lessonImages,
} from '../lesson-images';

test('lessonImages map is populated', () => {
  expect(Object.keys(lessonImages).length).toBeGreaterThan(300);
});

test('hasLessonImage is true for a known path and false for an unknown one', () => {
  expect(hasLessonImage('/images/A1L1_comic_menu.webp')).toBe(true);
  expect(hasLessonImage('/images/does_not_exist.webp')).toBe(false);
});

test('getLessonImage returns a resolved asset for a known path', () => {
  expect(getLessonImage('/images/A1L1_comic_menu.webp')).toBeTruthy();
});

test('getLessonThumbnail falls back to the default for an unknown path', () => {
  expect(getLessonThumbnail('/images/missing.webp')).toBeTruthy();
});
