import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('../../../hooks/use-local-notifications', () => ({
  useLocalNotifications: () => ({ isAvailable: true, reminderTime: 'disabled', setReminderTime: jest.fn(async () => true) }),
}));

import Confidence from '../confidence';
import Reminder from '../reminder';
import Commit from '../commit';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

test('confidence renders the three domains', async () => {
  const { getByText } = await render(<Confidence />, { wrapper: wrap });
  await waitFor(() => expect(getByText('Process')).toBeTruthy());
});
test('reminder renders reminder options', async () => {
  const { getByText } = await render(<Reminder />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/Morning/i)).toBeTruthy());
});
test('commit renders the pledge CTA', async () => {
  const { getByText } = await render(<Commit />, { wrapper: wrap });
  await waitFor(() => expect(getByText('Commit to passing.')).toBeTruthy());
});
