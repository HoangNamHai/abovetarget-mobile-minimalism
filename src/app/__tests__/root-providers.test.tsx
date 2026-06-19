import React, { type ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { createInMemoryPersistence } from '../../services/persistence';
import { PersistenceProvider } from '../../contexts/persistence-context';
import { SettingsProvider } from '../../contexts/settings-context';
import { SoundProvider } from '../../contexts/sound-context';
import { AuthProvider } from '../../contexts/auth-context';
import { ProgressProvider } from '../../contexts/progress-context';
import { OnboardingProvider } from '../../contexts/onboarding-context';
import { SubscriptionProvider } from '../../contexts/subscription-context';
import { LessonProvider } from '../../contexts/lesson-context';

jest.mock('expo-linking', () => ({
  parse: () => ({ queryParams: {} }),
  getInitialURL: async () => null,
  addEventListener: () => ({ remove: () => {} }),
}));

test('the full domain provider stack mounts children', async () => {
  const { getByText } = await render(
    <PersistenceProvider value={createInMemoryPersistence()}>
      <SettingsProvider>
        <SoundProvider>
          <AuthProvider>
            <ProgressProvider>
              <OnboardingProvider>
                <SubscriptionProvider>
                  <LessonProvider>
                    <Text>app</Text>
                  </LessonProvider>
                </SubscriptionProvider>
              </OnboardingProvider>
            </ProgressProvider>
          </AuthProvider>
        </SoundProvider>
      </SettingsProvider>
    </PersistenceProvider>,
  );
  expect(getByText('app')).toBeTruthy();
});
