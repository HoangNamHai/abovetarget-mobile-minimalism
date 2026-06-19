import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';
import GoalSelection from '../goal-selection';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn() }, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

test('goal selection renders the daily-goal options', async () => {
  const { getByText } = await render(<GoalSelection />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/lesson/i)).toBeTruthy());
});
