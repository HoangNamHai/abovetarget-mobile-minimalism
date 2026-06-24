import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// Simulate Clerk that has NOT finished loading: ClerkLoaded renders nothing,
// useAuth reports not-loaded. This mirrors an offline / slow cold start.
jest.mock('@clerk/clerk-expo', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  ClerkLoaded: () => null, // gate would hide the app if still used
  useAuth: () => ({ isLoaded: false, isSignedIn: false, signOut: async () => {} }),
  useUser: () => ({ user: null }),
}));

// Force the "Clerk configured" branch of ClerkGate.
jest.mock('../../config/env', () => ({
  __esModule: true,
  hasClerkKey: () => true,
  CLERK_PUBLISHABLE_KEY: 'pk_test_offline',
}));

jest.mock('../../services/infra/clerk-token-cache', () => ({ tokenCache: {} }));

import { ClerkGate } from '../auth-context';

test('ClerkGate renders the app even while Clerk has not loaded (offline cold start)', async () => {
  const tree = await render(
    <ClerkGate>
      <Text>app-ready</Text>
    </ClerkGate>,
  );
  expect(tree.getByText('app-ready')).toBeTruthy();
});
