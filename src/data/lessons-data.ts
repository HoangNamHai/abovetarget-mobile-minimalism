import type { Lesson, LessonsIndex, LessonData } from '../types/lesson';

// Import the lessons index data
import lessonsIndexJson from '../../assets/data/lessons-index.json';

// Import all lesson data files statically
import A1L1 from '../../assets/data/A1L1.json';
import A1L2 from '../../assets/data/A1L2.json';
import A1L3 from '../../assets/data/A1L3.json';
import A1L4 from '../../assets/data/A1L4.json';
import A1L5 from '../../assets/data/A1L5.json';
import A1L6 from '../../assets/data/A1L6.json';
import A1L7 from '../../assets/data/A1L7.json';
import A1L8 from '../../assets/data/A1L8.json';
import B1L1 from '../../assets/data/B1L1.json';
import B1L2 from '../../assets/data/B1L2.json';
import B1L3 from '../../assets/data/B1L3.json';
import B1L4 from '../../assets/data/B1L4.json';
import B1L5 from '../../assets/data/B1L5.json';
import B1L6 from '../../assets/data/B1L6.json';
import B2L1 from '../../assets/data/B2L1.json';
import B2L2 from '../../assets/data/B2L2.json';
import B2L3 from '../../assets/data/B2L3.json';
import B2L4 from '../../assets/data/B2L4.json';
import B2L5 from '../../assets/data/B2L5.json';
import C1L1 from '../../assets/data/C1L1.json';
import C1L2 from '../../assets/data/C1L2.json';
import C1L3 from '../../assets/data/C1L3.json';
import C1L4 from '../../assets/data/C1L4.json';
import C1L5 from '../../assets/data/C1L5.json';
import C1L6 from '../../assets/data/C1L6.json';
import C1L7 from '../../assets/data/C1L7.json';
import C1L8 from '../../assets/data/C1L8.json';
import C2L1 from '../../assets/data/C2L1.json';
import C2L2 from '../../assets/data/C2L2.json';
import C2L3 from '../../assets/data/C2L3.json';
import C2L4 from '../../assets/data/C2L4.json';
import C3L1 from '../../assets/data/C3L1.json';
import C3L2 from '../../assets/data/C3L2.json';
import C3L3 from '../../assets/data/C3L3.json';
import C3L4 from '../../assets/data/C3L4.json';
import C3L5 from '../../assets/data/C3L5.json';
import C3L6 from '../../assets/data/C3L6.json';
import D1L1 from '../../assets/data/D1L1.json';
import D1L2 from '../../assets/data/D1L2.json';
import D1L3 from '../../assets/data/D1L3.json';
import D1L4 from '../../assets/data/D1L4.json';
import D1L5 from '../../assets/data/D1L5.json';
import D1L6 from '../../assets/data/D1L6.json';
import D1L7 from '../../assets/data/D1L7.json';
import D1L8 from '../../assets/data/D1L8.json';
import D2L1 from '../../assets/data/D2L1.json';
import D2L2 from '../../assets/data/D2L2.json';
import D2L3 from '../../assets/data/D2L3.json';
import D2L4 from '../../assets/data/D2L4.json';
import D2L5 from '../../assets/data/D2L5.json';
import D2L6 from '../../assets/data/D2L6.json';

export const lessonsIndex: LessonsIndex[] = lessonsIndexJson as LessonsIndex[];

// Map of lesson IDs to lesson data
const lessonDataMap: Record<string, LessonData> = {
  A1L1: A1L1 as unknown as LessonData,
  A1L2: A1L2 as unknown as LessonData,
  A1L3: A1L3 as unknown as LessonData,
  A1L4: A1L4 as unknown as LessonData,
  A1L5: A1L5 as unknown as LessonData,
  A1L6: A1L6 as unknown as LessonData,
  A1L7: A1L7 as unknown as LessonData,
  A1L8: A1L8 as unknown as LessonData,
  B1L1: B1L1 as unknown as LessonData,
  B1L2: B1L2 as unknown as LessonData,
  B1L3: B1L3 as unknown as LessonData,
  B1L4: B1L4 as unknown as LessonData,
  B1L5: B1L5 as unknown as LessonData,
  B1L6: B1L6 as unknown as LessonData,
  B2L1: B2L1 as unknown as LessonData,
  B2L2: B2L2 as unknown as LessonData,
  B2L3: B2L3 as unknown as LessonData,
  B2L4: B2L4 as unknown as LessonData,
  B2L5: B2L5 as unknown as LessonData,
  C1L1: C1L1 as unknown as LessonData,
  C1L2: C1L2 as unknown as LessonData,
  C1L3: C1L3 as unknown as LessonData,
  C1L4: C1L4 as unknown as LessonData,
  C1L5: C1L5 as unknown as LessonData,
  C1L6: C1L6 as unknown as LessonData,
  C1L7: C1L7 as unknown as LessonData,
  C1L8: C1L8 as unknown as LessonData,
  C2L1: C2L1 as unknown as LessonData,
  C2L2: C2L2 as unknown as LessonData,
  C2L3: C2L3 as unknown as LessonData,
  C2L4: C2L4 as unknown as LessonData,
  C3L1: C3L1 as unknown as LessonData,
  C3L2: C3L2 as unknown as LessonData,
  C3L3: C3L3 as unknown as LessonData,
  C3L4: C3L4 as unknown as LessonData,
  C3L5: C3L5 as unknown as LessonData,
  C3L6: C3L6 as unknown as LessonData,
  D1L1: D1L1 as unknown as LessonData,
  D1L2: D1L2 as unknown as LessonData,
  D1L3: D1L3 as unknown as LessonData,
  D1L4: D1L4 as unknown as LessonData,
  D1L5: D1L5 as unknown as LessonData,
  D1L6: D1L6 as unknown as LessonData,
  D1L7: D1L7 as unknown as LessonData,
  D1L8: D1L8 as unknown as LessonData,
  D2L1: D2L1 as unknown as LessonData,
  D2L2: D2L2 as unknown as LessonData,
  D2L3: D2L3 as unknown as LessonData,
  D2L4: D2L4 as unknown as LessonData,
  D2L5: D2L5 as unknown as LessonData,
  D2L6: D2L6 as unknown as LessonData,
};

/**
 * Get all lessons from all modules as a flat array
 */
export function getAllLessons(): Lesson[] {
  return lessonsIndex.flatMap(m => m.lessons);
}

/**
 * Find a lesson by ID across all modules
 */
export function findLesson(lessonId: string): Lesson | undefined {
  return getAllLessons().find(l => l.id === lessonId);
}

/**
 * Get lesson data by ID
 */
export function getLessonData(lessonId: string): LessonData | null {
  return lessonDataMap[lessonId] || null;
}
