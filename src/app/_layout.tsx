import '../../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FontGate } from '../components/FontGate';
import { AuthProvider } from '../contexts/auth-context';
import { LessonProvider } from '../contexts/lesson-context';
import { OnboardingProvider } from '../contexts/onboarding-context';
import { PersistenceProvider } from '../contexts/persistence-context';
import { ProgressProvider } from '../contexts/progress-context';
import { SettingsProvider } from '../contexts/settings-context';
import { SoundProvider } from '../contexts/sound-context';
import { SubscriptionProvider } from '../contexts/subscription-context';
import { BrandProvider } from '../theme/brand-context';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <BrandProvider>
            <PersistenceProvider>
              <SettingsProvider>
                <SoundProvider>
                  <AuthProvider>
                    <ProgressProvider>
                      <OnboardingProvider>
                        <SubscriptionProvider>
                          <LessonProvider>
                            <FontGate>
                              <Stack screenOptions={{ headerShown: false }} />
                            </FontGate>
                          </LessonProvider>
                        </SubscriptionProvider>
                      </OnboardingProvider>
                    </ProgressProvider>
                  </AuthProvider>
                </SoundProvider>
              </SettingsProvider>
            </PersistenceProvider>
          </BrandProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
