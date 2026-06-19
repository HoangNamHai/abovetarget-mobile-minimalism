import { lessonReducer, initialLessonState } from '../lesson-reducer';
import { getLessonData } from '../../../data/lessons-data';

// Build the initial state via the reducer's own LOAD flow against real content.
function freshLoaded() {
  const data = getLessonData('A1L1');
  // LOAD_LESSON_SUCCESS hydrates lessonData and resets navigation.
  return lessonReducer(
    lessonReducer(initialLessonState, { type: 'LOAD_LESSON_START' }),
    { type: 'LOAD_LESSON_SUCCESS', payload: data! },
  );
}

test('LOAD_LESSON_SUCCESS hydrates lesson data and clears loading', () => {
  const s = freshLoaded();
  expect(s.lessonData?.lessonId).toBe('A1L1');
  expect(s.loading).toBe(false);
});

test('SELECT_ANSWER records the chosen option for a question', () => {
  const s = lessonReducer(freshLoaded(), {
    type: 'SELECT_ANSWER',
    payload: { questionId: 'q1', optionId: 'opt-a' },
  });
  expect(s.answers.q1).toBe('opt-a');
});

test('NEXT_SCREEN advances the screen index', () => {
  const s0 = freshLoaded();
  const s1 = lessonReducer(s0, { type: 'NEXT_SCREEN' });
  expect(s1.screenIndex).toBe(s0.screenIndex + 1);
});

test('RECORD_QUESTION_SCORE accumulates earned points', () => {
  const s = lessonReducer(freshLoaded(), {
    type: 'RECORD_QUESTION_SCORE',
    payload: { questionId: 'q1', points: 100 },
  });
  expect(s.questionScores.q1).toBe(100);
});
