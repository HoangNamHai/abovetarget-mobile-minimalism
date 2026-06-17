/**
 * TestProviders — wraps children in all providers required for rendering screens in tests.
 * Usage:
 *   render(<TestProviders><QuizScreen question={...} /></TestProviders>)
 */
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from './contexts/session-context';
import { BrandProvider } from './theme/brand-context';

type Props = {
  children: React.ReactNode;
};

export function TestProviders({ children }: Props) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <BrandProvider>
            <SessionProvider>{children}</SessionProvider>
          </BrandProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
