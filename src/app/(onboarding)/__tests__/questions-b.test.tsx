import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('../../../hooks/use-weekly-reminder', () => ({
  useWeeklyReminder: () => ({
    isAvailable: true,
    schedule: { weekdays: [2, 3, 4, 5, 6], hour: 20, minute: 0 },
    setSchedule: jest.fn(async () => true),
  }),
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
test('reminder renders the day/time scheduler', async () => {
  const { getByText, getByTestId } = await render(<Reminder />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/nudge you/i)).toBeTruthy());
  expect(getByTestId('day-2')).toBeTruthy();
});
test('commit renders the daily-minutes options', async () => {
  const { getByText } = await render(<Commit />, { wrapper: wrap });
  await waitFor(() => expect(getByText('20 min / day')).toBeTruthy());
  expect(getByText('10 min / day')).toBeTruthy();
  expect(getByText('30 min / day')).toBeTruthy();
});
