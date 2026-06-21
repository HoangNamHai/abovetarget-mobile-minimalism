jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn(), navigate: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), navigate: jest.fn() }),
}));

import React, { type ReactNode } from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { SettingsProvider } from '../../../contexts/settings-context';
import { SubscriptionProvider } from '../../../contexts/subscription-context';
import { AuthProvider } from '../../../contexts/auth-context';
import { ProgressProvider } from '../../../contexts/progress-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';
import Profile from '../profile';

// Mirror the app's provider nesting. The DEV OPTIONS section renders in tests
// (jest runs with __DEV__ true), so Onboarding/Progress providers are required.
const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}>
    <SubscriptionProvider>
      <AuthProvider>
        <SettingsProvider>
          <ProgressProvider>
            <OnboardingProvider>{children}</OnboardingProvider>
          </ProgressProvider>
        </SettingsProvider>
      </AuthProvider>
    </SubscriptionProvider>
  </PersistenceProvider>
);

test('profile shows a settings control', async () => {
  const { getAllByText } = await render(<Profile />, { wrapper: wrap });
  await waitFor(() => expect(getAllByText(/haptics|sounds|notifications/i).length).toBeGreaterThan(0));
});

test('Reset Onboarding navigates into the onboarding flow (not a silent no-op)', async () => {
  const { router } = require('expo-router');
  (router.replace as jest.Mock).mockClear();
  const { getByText } = await render(<Profile />, { wrapper: wrap });
  fireEvent.press(getByText('Reset Onboarding'));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith('/(onboarding)/splash'),
  );
});
