import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: (...a: any[]) => mockReplace(...a) } }));
jest.mock('../../../config/env', () => ({ REVENUECAT_ENABLED: false }));

import DomainScreen from '../domain';
import Reveal from '../reveal';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

test('domain screen renders all three domains', async () => {
  const { getByText } = await render(<DomainScreen />, { wrapper: wrap });
  await waitFor(() => expect(getByText('People')).toBeTruthy());
});

test('reveal completes onboarding and lands in the app when paywall is off', async () => {
  jest.useFakeTimers();
  const { getByText } = await render(<Reveal />, { wrapper: wrap });
  await act(async () => { jest.advanceTimersByTime(2500); });
  await waitFor(() => expect(getByText(/Unlock my plan/i)).toBeTruthy());
  fireEvent.press(getByText(/Unlock my plan/i));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  jest.useRealTimers();
});
