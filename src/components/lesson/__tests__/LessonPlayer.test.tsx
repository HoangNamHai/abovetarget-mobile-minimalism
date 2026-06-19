// Mock bottom-sheet to avoid native Worklets/Reanimated initialization.
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

// Mock @expo/vector-icons (Icon primitive may be referenced)
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

// Mock expo-router so router.back() doesn't crash in tests
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({ id: '' })),
  useRouter: () => ({
    back: jest.fn(),
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { ProgressProvider } from '../../../contexts/progress-context';
import { SubscriptionProvider } from '../../../contexts/subscription-context';
import { LessonProvider } from '../../../contexts/lesson-context';
import { LessonPlayer } from '../LessonPlayer';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}>
    <SubscriptionProvider><ProgressProvider><LessonProvider>{children}</LessonProvider></ProgressProvider></SubscriptionProvider>
  </PersistenceProvider>
);

test('LessonPlayer loads a lesson and renders its first (hook) screen', async () => {
  const { queryByText } = await render(<LessonPlayer lessonId="A1L1" />, { wrapper: wrap });
  // A1L1 screen 1 is a hook; assert some hook headline text renders (non-empty screen).
  await waitFor(() => expect(queryByText(/continue/i)).toBeTruthy());
});
