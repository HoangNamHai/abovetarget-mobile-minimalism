import React, { type ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { createInMemoryPersistence } from '../../../services/persistence';
import { PersistenceProvider } from '../../../contexts/persistence-context';
import { SettingsProvider } from '../../../contexts/settings-context';
import { SubscriptionProvider } from '../../../contexts/subscription-context';
import { AuthProvider } from '../../../contexts/auth-context';
import Profile from '../profile';

const wrap = ({ children }: { children: ReactNode }) => (
  <PersistenceProvider value={createInMemoryPersistence()}><SubscriptionProvider><AuthProvider><SettingsProvider>{children}</SettingsProvider></AuthProvider></SubscriptionProvider></PersistenceProvider>
);

test('profile shows a settings control', async () => {
  const { getAllByText } = await render(<Profile />, { wrapper: wrap });
  await waitFor(() => expect(getAllByText(/haptics|sounds|notifications/i).length).toBeGreaterThan(0));
});
