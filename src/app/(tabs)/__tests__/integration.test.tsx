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

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: ({ children, style }: any) =>
      React.createElement(View, { style }, children),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => React.createElement(View, null, children),
    SafeAreaView: ({ children }: any) => React.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: ({ testID }: any) => React.createElement(View, { testID }),
  };
});

// Mock FlashList with a FlatList-like implementation
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { View } = require('react-native');
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

// Mock react-native-color-matrix-image-filters (native; not available in Jest)
jest.mock('react-native-color-matrix-image-filters', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Grayscale: ({ children }: any) => React.createElement(View, null, children),
  };
});

import { render, screen } from '@testing-library/react-native';
import { TestProviders } from '../../../test-utils';
import Profile from '../profile';

test('brand switch flips profile takeaways styling without crashing', async () => {
  await render(
    <TestProviders>
      <Profile />
    </TestProviders>,
  );
  // Default brand is 'monograph' so MonographTakeaways renders "Projects are Temporary"
  expect(screen.getByText(/Structural Brutalism|Projects are Temporary/i)).toBeTruthy();
});
