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

// Mock expo-image — just render a plain View (no native image decoding needed in tests)
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: ({ testID }: any) => React.createElement(View, { testID }),
  };
});

// Mock expo-linear-gradient — render children through a plain View
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style }: any) =>
      React.createElement(View, { style }, children),
  };
});

// Mock react-native-color-matrix-image-filters — Grayscale is a native filter that
// won't initialize under Jest. We replace it with a passthrough View so the test
// can still assert on visible screen text (the filter is purely visual).
jest.mock('react-native-color-matrix-image-filters', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Grayscale: ({ children }: any) => React.createElement(View, null, children),
  };
});

import { render, screen } from '@testing-library/react-native';
import { TestProviders } from '../../../test-utils';
import { IntroScreen } from '../IntroScreen';

test('renders the lesson title', async () => {
  await render(
    <TestProviders>
      <IntroScreen onContinue={() => {}} />
    </TestProviders>,
  );
  expect(screen.getByText(/What is Project Management/i)).toBeTruthy();
});
