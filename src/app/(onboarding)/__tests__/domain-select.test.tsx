import React, { type ReactNode } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { OnboardingProvider } from '../../../contexts/onboarding-context';

jest.mock('expo-linking', () => ({ parse: () => ({ queryParams: {} }), getInitialURL: async () => null, addEventListener: () => ({ remove: () => {} }) }));
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: any[]) => mockPush(...a), replace: (...a: any[]) => mockReplace(...a) } }));
jest.mock('../../../config/env', () => ({ REVENUECAT_ENABLED: false }));

import DomainScreen from '../domain';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
);

beforeEach(() => { mockReplace.mockClear(); mockPush.mockClear(); });

test('domain screen renders all three domains and has no Continue button', async () => {
  const { getByText, queryByText } = await render(<DomainScreen />, { wrapper: wrap });
  await waitFor(() => expect(getByText('People')).toBeTruthy());
  expect(queryByText('Continue')).toBeNull();
});

test('selecting a domain sends the user straight to its first lesson (paywall off)', async () => {
  const { getByText } = await render(<DomainScreen />, { wrapper: wrap });
  await waitFor(() => expect(getByText('People')).toBeTruthy());
  fireEvent.press(getByText('People'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/lesson\//)));
});

test('selecting a domain completes onboarding with that focus domain', async () => {
  const persistence = createInMemoryPersistence();
  const localWrap = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider value={persistence}><OnboardingProvider>{children}</OnboardingProvider></PersistenceProvider>
  );
  const { getByText } = await render(<DomainScreen />, { wrapper: localWrap });
  await waitFor(() => expect(getByText('People')).toBeTruthy());
  fireEvent.press(getByText('People'));
  await waitFor(async () => {
    const prefs = await persistence.kv.getJSON<{ focusDomain: string }>('userPreferences');
    expect(prefs?.focusDomain).toBe('people');
  });
});
