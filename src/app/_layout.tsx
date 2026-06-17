import '../../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FontGate } from '../components/FontGate';
import { SessionProvider } from '../contexts/session-context';
import { BrandProvider } from '../theme/brand-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <BrandProvider>
            <SessionProvider>
              <FontGate>
                <Stack screenOptions={{ headerShown: false }} />
              </FontGate>
            </SessionProvider>
          </BrandProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
