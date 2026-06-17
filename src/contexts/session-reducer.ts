export type SessionResult = 'correct' | 'incorrect' | null;

export type SessionState = {
  streak: number;
  points: number;
  selected: Record<string, string>;
  result: SessionResult;
  activeQuestionId: string | null;
};

export const initialSessionState: SessionState = {
  streak: 0,
  points: 0,
  selected: {},
  result: null,
  activeQuestionId: null,
};

export type SessionAction =
  | { type: 'SELECT'; questionId: string; key: string }
  | { type: 'CHECK'; questionId: string; correctKey: string }
  | { type: 'DISMISS_RESULT' }
  | { type: 'RESET' };

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SELECT':
      return { ...state, selected: { ...state.selected, [action.questionId]: action.key } };
    case 'CHECK': {
      const isCorrect = state.selected[action.questionId] === action.correctKey;
      return {
        ...state,
        activeQuestionId: action.questionId,
        result: isCorrect ? 'correct' : 'incorrect',
        points: isCorrect ? state.points + 10 : state.points,
        streak: isCorrect ? state.streak + 1 : 0,
      };
    }
    case 'DISMISS_RESULT':
      return { ...state, result: null };
    case 'RESET':
      return initialSessionState;
    default:
      return state;
  }
}
