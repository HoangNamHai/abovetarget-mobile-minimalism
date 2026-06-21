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

// Mock expo-image
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: ({ testID }: any) => React.createElement(View, { testID }),
  };
});

// Control the premium flag per-test so we can render both free and premium views.
jest.mock('../../../contexts/subscription-context', () => {
  const actual = jest.requireActual('../../../contexts/subscription-context');
  return { ...actual, useSubscription: jest.fn() };
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { TestProviders } from '../../../test-utils';
import { useSubscription } from '../../../contexts/subscription-context';
import { DashboardScreen } from '../DashboardScreen';

const mockUseSubscription = useSubscription as jest.Mock;

beforeEach(() => {
  // Default: premium, so the upgrade block is hidden unless a test opts in.
  mockUseSubscription.mockReturnValue({ isPremium: true });
});

test('shows a browse-lessons control', async () => {
  await render(
    <TestProviders>
      <DashboardScreen onStartStudy={() => {}} />
    </TestProviders>,
  );
  expect(screen.getByText(/browse all lessons/i)).toBeTruthy();
});

test('free users see the upgrade CTA and tapping it triggers upgrade', async () => {
  mockUseSubscription.mockReturnValue({ isPremium: false });
  const onUpgrade = jest.fn();
  await render(
    <TestProviders>
      <DashboardScreen onStartStudy={() => {}} onUpgrade={onUpgrade} />
    </TestProviders>,
  );

  expect(screen.getByText(/pass the pmp faster/i)).toBeTruthy();

  fireEvent.press(screen.getByText(/go premium/i));
  expect(onUpgrade).toHaveBeenCalledTimes(1);
});

test('premium users do not see the upgrade CTA', async () => {
  mockUseSubscription.mockReturnValue({ isPremium: true });
  await render(
    <TestProviders>
      <DashboardScreen onStartStudy={() => {}} onUpgrade={() => {}} />
    </TestProviders>,
  );
  expect(screen.queryByText(/pass the pmp faster/i)).toBeNull();
});
