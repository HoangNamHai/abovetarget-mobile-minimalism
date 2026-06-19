import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type FC,
  type ReactNode,
} from 'react';
import type {
  LessonScreen,
  ModalData,
  DragChip,
  QuickNavTarget,
} from '../types/lesson';
import { getLessonData } from '../data/lessons-data';
import {
  lessonReducer,
  initialState,
  MAX_ATTEMPTS,
  calculatePoints,
  formatTime,
  type LessonState,
} from './reducers/lesson-reducer';

// Map QuickNavTarget to ScreenType
const QUICK_NAV_TO_SCREEN_TYPE = {
  challenge: 'challenge',
  theory: 'reason',
  transfer: 'transfer',
  practice: 'practice',
} as const;

// ============================================
// Context
// ============================================

type LessonContextValue = {
  state: LessonState;
  // Computed values
  currentScreen: LessonScreen | null;
  screenType: string | null;
  totalScreens: number;
  progress: number;
  isFirstScreen: boolean;
  isLastScreen: boolean;
  // Actions
  loadLesson: (lessonId: string) => Promise<void>;
  nextScreen: () => void;
  previousScreen: () => void;
  goToScreen: (index: number) => void;
  goToStage: (target: QuickNavTarget) => void;
  setCurrentQuestionIndex: (index: number) => void;
  selectAnswer: (questionId: string, optionId: string) => void;
  toggleMultiSelect: (questionId: string, optionId: string, maxSelections?: number) => void;
  setDropZoneAnswer: (questionId: string, zoneId: string, chip: DragChip | DragChip[] | null) => void;
  clearDropZoneAnswers: (questionId: string) => void;
  setTextAnswer: (questionId: string, text: string) => void;
  incrementAttempt: (questionId: string) => number;
  addDisabledChoice: (questionId: string, optionId: string) => void;
  recordQuestionScore: (questionId: string, points: number) => void;
  markQuestionCompleted: (questionId: string) => void;
  showSuccessModal: (data: Omit<ModalData, 'title'>) => void;
  showRetryModal: (data: Omit<ModalData, 'title'>) => void;
  showRevealModal: (data: Omit<ModalData, 'title'>) => void;
  closeModal: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;
  resetTimer: () => void;
  completeLesson: () => void;
  restartLesson: () => void;
  exitLesson: () => void;
  // Helpers
  getAttemptCount: (questionId: string) => number;
  isChoiceDisabled: (questionId: string, optionId: string) => boolean;
  isQuestionCompleted: (questionId: string) => boolean;
  calculatePoints: (basePoints: number, attemptNumber: number) => number;
  formatTime: (seconds: number) => string;
};

const LessonContext = createContext<LessonContextValue | null>(null);

// ============================================
// Provider
// ============================================

type LessonProviderProps = {
  children: ReactNode;
};

export const LessonProvider: FC<LessonProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(lessonReducer, initialState);

  // Computed values
  const currentScreen = useMemo(() => {
    if (!state.lessonData) return null;
    return state.lessonData.screens[state.screenIndex] || null;
  }, [state.lessonData, state.screenIndex]);

  const screenType = currentScreen?.screen_type || null;
  const totalScreens = state.lessonData?.screens.length || 0;
  // Show 100% progress on wrap screen (completion screen)
  const progress = screenType === 'wrap' ? 100 : (totalScreens > 0 ? ((state.screenIndex + 1) / totalScreens) * 100 : 0);
  const isFirstScreen = state.screenIndex === 0;
  const isLastScreen = state.screenIndex >= totalScreens - 1;

  // Actions
  const loadLesson = useCallback(async (lessonId: string) => {
    dispatch({ type: 'LOAD_LESSON_START' });
    try {
      const lessonData = getLessonData(lessonId);
      if (lessonData) {
        dispatch({ type: 'LOAD_LESSON_SUCCESS', payload: lessonData });
      } else {
        dispatch({
          type: 'LOAD_LESSON_ERROR',
          payload: `Lesson not found: ${lessonId}`,
        });
      }
    } catch (err) {
      dispatch({
        type: 'LOAD_LESSON_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to load lesson',
      });
    }
  }, []);

  const nextScreen = useCallback(() => dispatch({ type: 'NEXT_SCREEN' }), []);
  const previousScreen = useCallback(() => dispatch({ type: 'PREVIOUS_SCREEN' }), []);
  const goToScreen = useCallback((index: number) => dispatch({ type: 'GO_TO_SCREEN', payload: index }), []);
  const goToStage = useCallback((target: QuickNavTarget) => {
    const screenType = QUICK_NAV_TO_SCREEN_TYPE[target];
    dispatch({ type: 'GO_TO_STAGE', payload: screenType });
  }, []);
  const setCurrentQuestionIndex = useCallback((index: number) => dispatch({ type: 'SET_CURRENT_QUESTION_INDEX', payload: index }), []);

  const selectAnswer = useCallback((questionId: string, optionId: string) => {
    dispatch({ type: 'SELECT_ANSWER', payload: { questionId, optionId } });
  }, []);

  const toggleMultiSelect = useCallback((questionId: string, optionId: string, maxSelections?: number) => {
    dispatch({ type: 'TOGGLE_MULTI_SELECT', payload: { questionId, optionId, maxSelections } });
  }, []);

  const setDropZoneAnswer = useCallback((questionId: string, zoneId: string, chip: DragChip | DragChip[] | null) => {
    dispatch({ type: 'SET_DROP_ZONE_ANSWER', payload: { questionId, zoneId, chip } });
  }, []);

  const clearDropZoneAnswers = useCallback((questionId: string) => {
    dispatch({ type: 'CLEAR_DROP_ZONE_ANSWERS', payload: { questionId } });
  }, []);

  const setTextAnswer = useCallback((questionId: string, text: string) => {
    dispatch({ type: 'SET_TEXT_ANSWER', payload: { questionId, text } });
  }, []);

  const incrementAttempt = useCallback((questionId: string): number => {
    dispatch({ type: 'INCREMENT_ATTEMPT', payload: questionId });
    return (state.attempts[questionId] || 0) + 1;
  }, [state.attempts]);

  const addDisabledChoice = useCallback((questionId: string, optionId: string) => {
    dispatch({ type: 'ADD_DISABLED_CHOICE', payload: { questionId, optionId } });
  }, []);

  const recordQuestionScore = useCallback((questionId: string, points: number) => {
    dispatch({ type: 'RECORD_QUESTION_SCORE', payload: { questionId, points } });
  }, []);

  const markQuestionCompleted = useCallback((questionId: string) => {
    dispatch({ type: 'MARK_QUESTION_COMPLETED', payload: questionId });
  }, []);

  const showSuccessModal = useCallback((data: Omit<ModalData, 'title'>) => {
    dispatch({ type: 'SHOW_MODAL', payload: { type: 'success', data: { title: 'Correct!', ...data } } });
  }, []);

  const showRetryModal = useCallback((data: Omit<ModalData, 'title'>) => {
    dispatch({ type: 'SHOW_MODAL', payload: { type: 'retry', data: { title: 'Not Quite', ...data } } });
  }, []);

  const showRevealModal = useCallback((data: Omit<ModalData, 'title'>) => {
    dispatch({ type: 'SHOW_MODAL', payload: { type: 'reveal', data: { title: "Here's the Answer", ...data } } });
  }, []);

  const closeModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), []);

  const startTimer = useCallback(() => dispatch({ type: 'START_TIMER' }), []);
  const stopTimer = useCallback(() => dispatch({ type: 'STOP_TIMER' }), []);
  const tickTimer = useCallback(() => dispatch({ type: 'TICK_TIMER' }), []);
  const resetTimer = useCallback(() => dispatch({ type: 'RESET_TIMER' }), []);

  const completeLesson = useCallback(() => dispatch({ type: 'COMPLETE_LESSON' }), []);
  const restartLesson = useCallback(() => dispatch({ type: 'RESTART_LESSON' }), []);
  const exitLesson = useCallback(() => dispatch({ type: 'EXIT_LESSON' }), []);

  // Helpers
  const getAttemptCount = useCallback((questionId: string) => state.attempts[questionId] || 0, [state.attempts]);

  const isChoiceDisabled = useCallback(
    (questionId: string, optionId: string) =>
      state.disabledChoices[questionId]?.includes(optionId) || false,
    [state.disabledChoices]
  );

  const isQuestionCompleted = useCallback(
    (questionId: string) => state.completedQuestions.includes(questionId),
    [state.completedQuestions]
  );

  const value: LessonContextValue = useMemo(
    () => ({
      state,
      currentScreen,
      screenType,
      totalScreens,
      progress,
      isFirstScreen,
      isLastScreen,
      loadLesson,
      nextScreen,
      previousScreen,
      goToScreen,
      goToStage,
      setCurrentQuestionIndex,
      selectAnswer,
      toggleMultiSelect,
      setDropZoneAnswer,
      clearDropZoneAnswers,
      setTextAnswer,
      incrementAttempt,
      addDisabledChoice,
      recordQuestionScore,
      markQuestionCompleted,
      showSuccessModal,
      showRetryModal,
      showRevealModal,
      closeModal,
      startTimer,
      stopTimer,
      tickTimer,
      resetTimer,
      completeLesson,
      restartLesson,
      exitLesson,
      getAttemptCount,
      isChoiceDisabled,
      isQuestionCompleted,
      calculatePoints,
      formatTime,
    }),
    [
      state,
      currentScreen,
      screenType,
      totalScreens,
      progress,
      isFirstScreen,
      isLastScreen,
      loadLesson,
      nextScreen,
      previousScreen,
      goToScreen,
      goToStage,
      setCurrentQuestionIndex,
      selectAnswer,
      toggleMultiSelect,
      setDropZoneAnswer,
      clearDropZoneAnswers,
      setTextAnswer,
      incrementAttempt,
      addDisabledChoice,
      recordQuestionScore,
      markQuestionCompleted,
      showSuccessModal,
      showRetryModal,
      showRevealModal,
      closeModal,
      startTimer,
      stopTimer,
      tickTimer,
      resetTimer,
      completeLesson,
      restartLesson,
      exitLesson,
      getAttemptCount,
      isChoiceDisabled,
      isQuestionCompleted,
    ]
  );

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
};

// ============================================
// Hook
// ============================================

export function useLesson(): LessonContextValue {
  const context = useContext(LessonContext);
  if (!context) {
    throw new Error('useLesson must be used within a LessonProvider');
  }
  return context;
}

export { MAX_ATTEMPTS };
