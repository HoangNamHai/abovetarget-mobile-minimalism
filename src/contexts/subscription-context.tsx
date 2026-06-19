import React, { createContext, useContext, useMemo, useEffect, useState, useCallback, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { REVENUECAT_DISABLED, REVENUECAT_API_KEYS, ENTITLEMENTS } from '../config/revenuecat';

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

function SubscriptionProviderInner({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    const listener = (info: Parameters<Parameters<typeof Purchases.addCustomerInfoUpdateListener>[0]>[0]) => {
      if (active) setIsPremium(!!info.entitlements.active[ENTITLEMENTS.PRO]);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    Purchases.getCustomerInfo()
      .then((info) => {
        if (!active) return;
        setIsPremium(!!info.entitlements.active[ENTITLEMENTS.PRO]);
      })
      .finally(() => {
        if (!active) return;
        setIsInitialized(true);
        setIsLoading(false);
      });
    return () => {
      active = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const purchasePackage = useCallback(async () => {
    /* real flow wired when paywall ships; offerings/packages added then */
  }, []);
  const restorePurchases = useCallback(async () => {
    await Purchases.restorePurchases();
  }, []);

  const value = useMemo<SubscriptionValue>(
    () => ({
      isPremium,
      isLoading,
      isInitialized,
      error: null,
      purchasePackage,
      restorePurchases,
      clearError: () => {},
    }),
    [isPremium, isLoading, isInitialized, purchasePackage, restorePurchases],
  );
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

// Phase 3 stub: real RevenueCat wiring lands in Phase 5.
// While REVENUECAT_DISABLED is true, all users are treated as premium.
function SubscriptionProviderDisabled({ children }: { children: ReactNode }) {
  const value = useMemo<SubscriptionValue>(
    () => ({
      isPremium: true,
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

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  if (REVENUECAT_DISABLED) {
    return <SubscriptionProviderDisabled>{children}</SubscriptionProviderDisabled>;
  }
  return <SubscriptionProviderInner>{children}</SubscriptionProviderInner>;
}

export function useSubscription(): SubscriptionValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
}
