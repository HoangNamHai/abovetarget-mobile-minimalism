import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const mockSetSchedule = jest.fn(async () => true);
jest.mock('../../../hooks/use-weekly-reminder', () => ({
  useWeeklyReminder: () => ({
    isAvailable: true,
    schedule: { weekdays: [2, 3, 4, 5, 6], hour: 20, minute: 0 },
    setSchedule: mockSetSchedule,
  }),
}));

import Reminder from '../reminder';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

test('renders the day picker and the default 8:00 PM time', async () => {
  const { getByTestId, getByText } = await render(<Reminder />, { wrapper: wrap });
  await waitFor(() => expect(getByTestId('day-2')).toBeTruthy());
  expect(getByText('8:00 PM')).toBeTruthy();
});

test('continuing saves the schedule via the weekly-reminder hook', async () => {
  const { getByText } = await render(<Reminder />, { wrapper: wrap });
  fireEvent.press(getByText('Continue'));
  await waitFor(() =>
    expect(mockSetSchedule).toHaveBeenCalledWith({ weekdays: [2, 3, 4, 5, 6], hour: 20, minute: 0 }),
  );
});
