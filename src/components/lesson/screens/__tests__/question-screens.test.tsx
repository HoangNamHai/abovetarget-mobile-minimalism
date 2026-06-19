// Mock bottom-sheet to avoid native Worklets/Reanimated initialization
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => React.createElement(View, null, children),
    BottomSheetModal: React.forwardRef(({ children }: any, _ref: any) =>
      React.createElement(View, null, children),
    ),
    BottomSheetView: ({ children }: any) => React.createElement(View, null, children),
    BottomSheetModalProvider: ({ children }: any) => React.createElement(View, null, children),
  };
});

// Mock expo-haptics (Button triggers haptics on press)
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { LessonProvider, useLesson } from '../../../../contexts/lesson-context';
import { ChallengeScreen } from '../ChallengeScreen';

function Harness({ lessonId }: { lessonId: string }) {
  const { loadLesson, state } = useLesson();
  React.useEffect(() => { loadLesson(lessonId); }, [loadLesson, lessonId]);
  if (!state.lessonData) return null;
  const challenge = state.lessonData.screens.find((s) => s.screen_type === 'challenge')!;
  return <ChallengeScreen screen={challenge} />;
}

test('challenge screen renders the first question of a real lesson', async () => {
  // B1L5's first challenge question is single_select — guarantees "Check Answer" button renders
  const { getByText } = await render(<Harness lessonId="B1L5" />, {
    wrapper: ({ children }: { children: ReactNode }) => <LessonProvider>{children}</LessonProvider>,
  });
  await waitFor(() => expect(getByText(/check/i)).toBeTruthy());
});
