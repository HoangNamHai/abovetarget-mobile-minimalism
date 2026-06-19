import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { ProgressProvider } from '../../../contexts/progress-context';
import { SubscriptionProvider } from '../../../contexts/subscription-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';
import { MonographDashboard } from '../MonographDashboard';

const wrap = (p = createInMemoryPersistence()) =>
  ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={p}>
      <SubscriptionProvider>
        <OnboardingProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </OnboardingProvider>
      </SubscriptionProvider>
    </PersistenceProvider>
  );

test('dashboard renders domain progress derived from useProgress', async () => {
  const { getByText } = await render(<MonographDashboard onStartStudy={() => {}} />, {
    wrapper: wrap(),
  });
  await waitFor(() => expect(getByText(/people/i)).toBeTruthy());
});
