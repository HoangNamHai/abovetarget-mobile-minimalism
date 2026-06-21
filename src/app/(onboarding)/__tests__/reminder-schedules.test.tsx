import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const mockSetReminderTime = jest.fn(async () => true);
jest.mock('../../../hooks/use-local-notifications', () => ({
  useLocalNotifications: () => ({
    isAvailable: true,
    reminderTime: 'disabled',
    setReminderTime: mockSetReminderTime,
  }),
}));

import Reminder from '../reminder';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

test('selecting a time and continuing schedules a daily reminder', async () => {
  const { getByText } = await render(<Reminder />, { wrapper: wrap });
  await waitFor(() => expect(getByText('Evening')).toBeTruthy());
  fireEvent.press(getByText('Evening'));
  await waitFor(() => {}); // let the selection state commit before pressing Continue
  fireEvent.press(getByText('Continue'));
  await waitFor(() => expect(mockSetReminderTime).toHaveBeenCalledWith('evening'));
});

test('the displayed times match what gets scheduled (9:00 / 12:00 / 8:00 PM)', async () => {
  const { getByText } = await render(<Reminder />, { wrapper: wrap });
  await waitFor(() => expect(getByText('9:00 AM', { exact: false })).toBeTruthy());
  expect(getByText('12:00 PM', { exact: false })).toBeTruthy();
  expect(getByText('8:00 PM', { exact: false })).toBeTruthy();
});
