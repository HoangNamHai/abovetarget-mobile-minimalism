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

// Mock expo-haptics
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

import { render } from '@testing-library/react-native';
import { CorrectBody, IncorrectBody } from '../FeedbackSheet';

test('correct body shows explanation', async () => {
  const { getByText } = await render(
    <CorrectBody explanation="Because reasons" onDismiss={() => {}} brand="elite" />,
  );
  expect(getByText(/Because reasons/)).toBeTruthy();
});

test('correct body shows EXCELLENT WORK headline', async () => {
  const { getByText } = await render(
    <CorrectBody explanation="Some explanation" onDismiss={() => {}} brand="monograph" />,
  );
  expect(getByText(/EXCELLENT WORK/i)).toBeTruthy();
});

test('incorrect body shows explanation', async () => {
  const { getByText } = await render(
    <IncorrectBody explanation="The correct answer was B" onDismiss={() => {}} brand="elite" />,
  );
  expect(getByText(/The correct answer was B/)).toBeTruthy();
});

test('incorrect body shows NOT QUITE headline', async () => {
  const { getByText } = await render(
    <IncorrectBody explanation="Try again text" onDismiss={() => {}} brand="monograph" />,
  );
  expect(getByText(/NOT QUITE/i)).toBeTruthy();
});
