import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { REVENUECAT_DISABLED } from '../config/revenuecat';

export interface SubscriptionValue {
  isPremium: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: null;
  purchasePackage: () => Promise<void>;
  restorePurchases: () => Promise<void>;
  clearError: () => void;
}

const SubscriptionContext = createContext<SubscriptionValue | null>(null);

// Phase 3 stub: real RevenueCat wiring lands in Phase 5.
// While REVENUECAT_DISABLED is true, all users are treated as premium.
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const value = useMemo<SubscriptionValue>(
    () => ({
      isPremium: REVENUECAT_DISABLED ? true : false,
      isLoading: false,
      isInitialized: true,
      error: null,
      purchasePackage: async () => {},
      restorePurchases: async () => {},
      clearError: () => {},
    }),
    [],
  );
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
}
