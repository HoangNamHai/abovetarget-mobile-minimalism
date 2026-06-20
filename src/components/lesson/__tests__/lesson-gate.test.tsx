// Verifies the free-tier gate in LessonPlayer: a non-premium user who has hit
// the daily limit is redirected to the paywall instead of into the lesson.

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { MaterialIcons: ({ name }: { name: string }) => React.createElement(Text, null, name) };
});

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), push: jest.fn(), navigate: jest.fn(), canGoBack: () => true },
}));

// Keep the lesson engine inert — the gate decision happens before any screen.
jest.mock('../../../contexts/lesson-context', () => ({
  useLesson: () => ({
    loadLesson: jest.fn(),
    exitLesson: jest.fn(),
    // null screen → LessonPlayer shows its neutral "Loading…" view; these tests
    // only assert the gate's redirect, not lesson content.
    state: { loading: false },
    currentScreen: null,
    progress: 0,
  }),
}));

let mockIsPremium = false;
let mockLimitReached = true;
let mockLimitLoading = false;
jest.mock('../../../contexts/subscription-context', () => ({
  useSubscription: () => ({ isPremium: mockIsPremium }),
}));
jest.mock('../../../hooks/use-lesson-limit', () => ({
  useLessonLimit: () => ({ limitReached: mockLimitReached, isLoading: mockLimitLoading }),
}));

import { render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { LessonPlayer } from '../LessonPlayer';

beforeEach(() => {
  jest.clearAllMocks();
  mockIsPremium = false;
  mockLimitReached = true;
  mockLimitLoading = false;
});

test('non-premium user at the daily limit is sent to the paywall', async () => {
  await render(<LessonPlayer lessonId="A1L1" />);
  await waitFor(() => expect(router.replace as jest.Mock).toHaveBeenCalledWith('/paywall'));
});

test('premium user is not gated', async () => {
  mockIsPremium = true;
  await render(<LessonPlayer lessonId="A1L1" />);
  await waitFor(() => expect(router.replace as jest.Mock).not.toHaveBeenCalled());
});

test('non-premium user under the limit is not gated', async () => {
  mockLimitReached = false;
  await render(<LessonPlayer lessonId="A1L1" />);
  await waitFor(() => expect(router.replace as jest.Mock).not.toHaveBeenCalled());
});

test('does not gate while the limit is still loading', async () => {
  mockLimitLoading = true;
  await render(<LessonPlayer lessonId="A1L1" />);
  await waitFor(() => expect(router.replace as jest.Mock).not.toHaveBeenCalled());
});
