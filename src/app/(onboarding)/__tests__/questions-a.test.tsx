import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

import ExamDate from '../exam-date';
import WhyCertified from '../why-certified';
import Experience from '../experience';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

test('exam-date offers a not-booked option', async () => {
  const { getByText } = await render(<ExamDate />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/Not booked yet/i)).toBeTruthy());
});
test('why-certified renders reasons', async () => {
  const { getByText } = await render(<WhyCertified />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/promotion/i)).toBeTruthy());
});
test('experience renders PM experience options', async () => {
  const { getByText } = await render(<Experience />, { wrapper: wrap });
  await waitFor(() => expect(getByText(/New to project management/i)).toBeTruthy());
});
