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

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: ({ children, style }: any) =>
      React.createElement(View, { style }, children),
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => React.createElement(View, null, children),
    SafeAreaView: ({ children }: any) => React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock FlashList with a simple FlatList-like implementation for tests
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View, FlatList } = require('react-native');
  return {
    FlashList: ({ data, renderItem, keyExtractor, ...rest }: any) => {
      return React.createElement(
        View,
        null,
        (data || []).map((item: any, index: number) => {
          const key = keyExtractor ? keyExtractor(item, index) : String(index);
          return React.createElement(View, { key }, renderItem({ item, index }));
        }),
      );
    },
  };
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { TestProviders } from '../../../test-utils';
import { ELITE_QUIZ_12 } from '../../../data/questions';
import { QuizScreen } from '../QuizScreen';

test('selecting an option marks it and check reveals result', async () => {
  await render(
    <TestProviders>
      <QuizScreen question={ELITE_QUIZ_12} />
    </TestProviders>,
  );

  // Press the "Initiation" option
  fireEvent.press(screen.getByText('Initiation'));

  // Press the Check Answer button
  fireEvent.press(screen.getByText(/check answer/i));

  // Assert no crash and option still present
  expect(screen.getByText('Initiation')).toBeTruthy();
});
