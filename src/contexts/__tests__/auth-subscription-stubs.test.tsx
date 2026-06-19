import React, { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react-native';
import { AuthProvider, useAppAuth } from '../auth-context';
import { SubscriptionProvider, useSubscription } from '../subscription-context';

test('auth stub reports signed-out and not loading', async () => {
  const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
  const { result } = await renderHook(() => useAppAuth(), { wrapper });
  expect(result.current.isSignedIn).toBe(false);
  expect(result.current.isLoading).toBe(false);
  expect(result.current.user).toBeNull();
});

test('subscription stub reports premium (RevenueCat disabled)', async () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SubscriptionProvider>{children}</SubscriptionProvider>
  );
  const { result } = await renderHook(() => useSubscription(), { wrapper });
  expect(result.current.isPremium).toBe(true);
  expect(result.current.isInitialized).toBe(true);
});
