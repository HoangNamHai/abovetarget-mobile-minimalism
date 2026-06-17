import { sessionReducer, initialSessionState, SessionState } from '../session-reducer';

test('select records answer for a question', () => {
  const s = sessionReducer(initialSessionState, { type: 'SELECT', questionId: 'q1', key: 'B' });
  expect(s.selected.q1).toBe('B');
});

test('correct check adds points and increments streak', () => {
  let s: SessionState = { ...initialSessionState, streak: 2, points: 50, selected: { q1: 'B' } };
  s = sessionReducer(s, { type: 'CHECK', questionId: 'q1', correctKey: 'B' });
  expect(s.result).toBe('correct');
  expect(s.points).toBe(60);
  expect(s.streak).toBe(3);
});

test('incorrect check resets streak and keeps points', () => {
  let s: SessionState = { ...initialSessionState, streak: 5, points: 50, selected: { q1: 'A' } };
  s = sessionReducer(s, { type: 'CHECK', questionId: 'q1', correctKey: 'B' });
  expect(s.result).toBe('incorrect');
  expect(s.points).toBe(50);
  expect(s.streak).toBe(0);
});

test('dismiss clears result only', () => {
  let s: SessionState = { ...initialSessionState, result: 'correct' };
  s = sessionReducer(s, { type: 'DISMISS_RESULT' });
  expect(s.result).toBeNull();
});
