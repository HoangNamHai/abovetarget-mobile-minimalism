import type {
  LessonData,
  ModalType,
  ModalData,
  DragChip,
  ScreenType,
} from '../../types/lesson';

// ============================================
// Constants
// ============================================

export const MAX_ATTEMPTS = 3;
export const POINT_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 0.7,
  3: 0.5,
};

// ============================================
// State Types
// ============================================

export type LessonState = {
  // Lesson data
  lessonData: LessonData | null;
  loading: boolean;
  error: string | null;

  // Navigation
  screenIndex: number;

  // Question state
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> optionId
  multiSelectAnswers: Record<string, string[]>; // questionId -> optionIds[]
  dropZoneAnswers: Record<string, Record<string, DragChip | DragChip[]>>; // questionId -> zoneId -> chip(s)
  textAnswers: Record<string, string>; // questionId -> text

  // Retry flow state
  attempts: Record<string, number>; // questionId -> attempt count
  disabledChoices: Record<string, string[]>; // questionId -> disabled optionIds
  questionScores: Record<string, number>; // questionId -> earned points
  completedQuestions: string[]; // questionIds that are done

  // Modal state
  modalVisible: boolean;
  modalType: ModalType;
  modalData: ModalData | null;

  // Timer (for practice screen)
  elapsedTime: number;
  timerRunning: boolean;

  // Overall progress
  totalScore: number;
  lessonComplete: boolean;
};

// ============================================
// Actions
// ============================================

export type LessonAction =
  | { type: 'LOAD_LESSON_START' }
  | { type: 'LOAD_LESSON_SUCCESS'; payload: LessonData }
  | { type: 'LOAD_LESSON_ERROR'; payload: string }
  | { type: 'NEXT_SCREEN' }
  | { type: 'PREVIOUS_SCREEN' }
  | { type: 'GO_TO_SCREEN'; payload: number }
  | { type: 'GO_TO_STAGE'; payload: ScreenType }
  | { type: 'SET_CURRENT_QUESTION_INDEX'; payload: number }
  | { type: 'SELECT_ANSWER'; payload: { questionId: string; optionId: string } }
  | { type: 'TOGGLE_MULTI_SELECT'; payload: { questionId: string; optionId: string; maxSelections?: number } }
  | { type: 'SET_DROP_ZONE_ANSWER'; payload: { questionId: string; zoneId: string; chip: DragChip | DragChip[] | null } }
  | { type: 'CLEAR_DROP_ZONE_ANSWERS'; payload: { questionId: string } }
  | { type: 'SET_TEXT_ANSWER'; payload: { questionId: string; text: string } }
  | { type: 'INCREMENT_ATTEMPT'; payload: string }
  | { type: 'ADD_DISABLED_CHOICE'; payload: { questionId: string; optionId: string } }
  | { type: 'RECORD_QUESTION_SCORE'; payload: { questionId: string; points: number } }
  | { type: 'MARK_QUESTION_COMPLETED'; payload: string }
  | { type: 'SHOW_MODAL'; payload: { type: ModalType; data: ModalData } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'START_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'TICK_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'COMPLETE_LESSON' }
  | { type: 'RESTART_LESSON' }
  | { type: 'EXIT_LESSON' }
  | { type: 'RESET_QUESTION_STATE' };

// ============================================
// Initial State
// ============================================

export const initialState: LessonState = {
  lessonData: null,
  loading: false,
  error: null,
  screenIndex: 0,
  currentQuestionIndex: 0,
  answers: {},
  multiSelectAnswers: {},
  dropZoneAnswers: {},
  textAnswers: {},
  attempts: {},
  disabledChoices: {},
  questionScores: {},
  completedQuestions: [],
  modalVisible: false,
  modalType: null,
  modalData: null,
  elapsedTime: 0,
  timerRunning: false,
  totalScore: 0,
  lessonComplete: false,
};

// ============================================
// Reducer
// ============================================

export function lessonReducer(state: LessonState, action: LessonAction): LessonState {
  switch (action.type) {
    case 'LOAD_LESSON_START':
      return { ...initialState, loading: true };

    case 'LOAD_LESSON_SUCCESS':
      return {
        ...initialState,
        lessonData: action.payload,
        loading: false,
      };

    case 'LOAD_LESSON_ERROR':
      return { ...state, loading: false, error: action.payload };

    case 'NEXT_SCREEN':
      if (!state.lessonData) return state;
      const nextIndex = Math.min(
        state.screenIndex + 1,
        state.lessonData.screens.length - 1
      );
      return {
        ...state,
        screenIndex: nextIndex,
        currentQuestionIndex: 0,
      };

    case 'PREVIOUS_SCREEN':
      return {
        ...state,
        screenIndex: Math.max(state.screenIndex - 1, 0),
        currentQuestionIndex: 0,
      };

    case 'GO_TO_SCREEN':
      return {
        ...state,
        screenIndex: action.payload,
        currentQuestionIndex: 0,
      };

    case 'GO_TO_STAGE': {
      if (!state.lessonData) return state;
      const targetScreenType = action.payload;
      const targetIndex = state.lessonData.screens.findIndex(
        (screen) => screen.screen_type === targetScreenType
      );
      if (targetIndex === -1) return state;
      return {
        ...state,
        screenIndex: targetIndex,
        currentQuestionIndex: 0,
      };
    }

    case 'SET_CURRENT_QUESTION_INDEX':
      return { ...state, currentQuestionIndex: action.payload };

    case 'SELECT_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.optionId,
        },
      };

    case 'TOGGLE_MULTI_SELECT': {
      const { questionId, optionId, maxSelections = 999 } = action.payload;
      const currentSelections = state.multiSelectAnswers[questionId] || [];
      const index = currentSelections.indexOf(optionId);

      let newSelections: string[];
      if (index > -1) {
        newSelections = currentSelections.filter((id) => id !== optionId);
      } else if (currentSelections.length < maxSelections) {
        newSelections = [...currentSelections, optionId];
      } else {
        newSelections = currentSelections;
      }

      return {
        ...state,
        multiSelectAnswers: {
          ...state.multiSelectAnswers,
          [questionId]: newSelections,
        },
      };
    }

    case 'SET_DROP_ZONE_ANSWER': {
      const { questionId, zoneId, chip } = action.payload;
      const questionAnswers = state.dropZoneAnswers[questionId] || {};

      if (chip === null) {
        const { [zoneId]: _, ...rest } = questionAnswers;
        return {
          ...state,
          dropZoneAnswers: {
            ...state.dropZoneAnswers,
            [questionId]: rest,
          },
        };
      }

      return {
        ...state,
        dropZoneAnswers: {
          ...state.dropZoneAnswers,
          [questionId]: {
            ...questionAnswers,
            [zoneId]: chip,
          },
        },
      };
    }

    case 'CLEAR_DROP_ZONE_ANSWERS':
      return {
        ...state,
        dropZoneAnswers: {
          ...state.dropZoneAnswers,
          [action.payload.questionId]: {},
        },
      };

    case 'SET_TEXT_ANSWER':
      return {
        ...state,
        textAnswers: {
          ...state.textAnswers,
          [action.payload.questionId]: action.payload.text,
        },
      };

    case 'INCREMENT_ATTEMPT':
      return {
        ...state,
        attempts: {
          ...state.attempts,
          [action.payload]: (state.attempts[action.payload] || 0) + 1,
        },
      };

    case 'ADD_DISABLED_CHOICE': {
      const { questionId, optionId } = action.payload;
      const currentDisabled = state.disabledChoices[questionId] || [];
      if (currentDisabled.includes(optionId)) return state;
      return {
        ...state,
        disabledChoices: {
          ...state.disabledChoices,
          [questionId]: [...currentDisabled, optionId],
        },
      };
    }

    case 'RECORD_QUESTION_SCORE': {
      const { questionId, points } = action.payload;
      const newScores = { ...state.questionScores, [questionId]: points };
      const newTotalScore = Object.values(newScores).reduce((a, b) => a + b, 0);
      return {
        ...state,
        questionScores: newScores,
        totalScore: newTotalScore,
      };
    }

    case 'MARK_QUESTION_COMPLETED':
      if (state.completedQuestions.includes(action.payload)) return state;
      return {
        ...state,
        completedQuestions: [...state.completedQuestions, action.payload],
      };

    case 'SHOW_MODAL':
      return {
        ...state,
        modalVisible: true,
        modalType: action.payload.type,
        modalData: action.payload.data,
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modalVisible: false,
        modalType: null,
        modalData: null,
      };

    case 'START_TIMER':
      return { ...state, timerRunning: true };

    case 'STOP_TIMER':
      return { ...state, timerRunning: false };

    case 'TICK_TIMER':
      return { ...state, elapsedTime: state.elapsedTime + 1 };

    case 'RESET_TIMER':
      return { ...state, elapsedTime: 0, timerRunning: false };

    case 'COMPLETE_LESSON':
      return { ...state, lessonComplete: true, timerRunning: false };

    case 'RESTART_LESSON':
      return {
        ...state,
        screenIndex: 0,
        currentQuestionIndex: 0,
        answers: {},
        multiSelectAnswers: {},
        dropZoneAnswers: {},
        textAnswers: {},
        attempts: {},
        disabledChoices: {},
        questionScores: {},
        completedQuestions: [],
        elapsedTime: 0,
        timerRunning: false,
        totalScore: 0,
        lessonComplete: false,
      };

    case 'EXIT_LESSON':
      return initialState;

    case 'RESET_QUESTION_STATE':
      return {
        ...state,
        currentQuestionIndex: 0,
        answers: {},
        multiSelectAnswers: {},
        dropZoneAnswers: {},
        textAnswers: {},
      };

    default:
      return state;
  }
}

// ============================================
// Helper Functions (Pure)
// ============================================

/**
 * Calculate points based on attempt number
 */
export function calculatePoints(basePoints: number, attemptNumber: number): number {
  if (attemptNumber > MAX_ATTEMPTS) return 0;
  const multiplier = POINT_MULTIPLIERS[attemptNumber] || 0.3;
  return Math.round(basePoints * multiplier);
}

/**
 * Format seconds as MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Alias for consumers that expect the canonical export name from the brief
export const initialLessonState = initialState;
