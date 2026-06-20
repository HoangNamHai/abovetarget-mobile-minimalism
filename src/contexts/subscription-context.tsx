import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type PurchasesPackage,
  type PurchasesOffering,
} from 'react-native-purchases';
import { REVENUECAT_DISABLED, REVENUECAT_API_KEYS, ENTITLEMENTS } from '../config/revenuecat';

export interface SubscriptionValue {
  isPremium: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  /** Packages from the current offering (empty until offerings load / while disabled). */
  packages: PurchasesPackage[];
  /** The current offering, or null when unavailable. */
  currentOffering: PurchasesOffering | null;
  /** Purchase a package; resolves once the entitlement state has been updated. */
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  clearError: () => void;
}

const SubscriptionContext = createContext<SubscriptionValue | null>(null);

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

/** Read the `pro` entitlement from a CustomerInfo-shaped object. */
function hasProEntitlement(info: { entitlements: { active: Record<string, unknown> } }): boolean {
  return !!info.entitlements.active[ENTITLEMENTS.PRO];
}

/**
 * Live RevenueCat-backed provider. Exported for direct testing; in the app it is
 * mounted by SubscriptionProvider only when RevenueCat is enabled.
 */
export function SubscriptionProviderLive({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });

    const listener = (
      info: Parameters<Parameters<typeof Purchases.addCustomerInfoUpdateListener>[0]>[0],
    ) => {
      if (mounted.current) setIsPremium(hasProEntitlement(info));
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    // Entitlement state + offerings load in parallel; neither blocks the other.
    Purchases.getCustomerInfo()
      .then((info) => {
        if (mounted.current) setIsPremium(hasProEntitlement(info));
      })
      .catch(() => {
        /* offline / not configured — treat as free until a listener update arrives */
      })
      .finally(() => {
        if (!mounted.current) return;
        setIsInitialized(true);
        setIsLoading(false);
      });

    Purchases.getOfferings()
      .then((offerings) => {
        if (!mounted.current) return;
        const current = offerings.current ?? null;
        setCurrentOffering(current);
        setPackages(current?.availablePackages ?? []);
      })
      .catch(() => {
        /* leave packages empty; paywall shows an unavailable state */
      });

    return () => {
      mounted.current = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    if (!pkg) return;
    setError(null);
    setIsLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (mounted.current) setIsPremium(hasProEntitlement(customerInfo));
    } catch (e) {
      // User-initiated cancellation is not an error worth surfacing.
      const err = e as { userCancelled?: boolean | null; message?: string };
      if (!err?.userCancelled && mounted.current) {
        setError(err?.message ?? DEFAULT_ERROR);
      }
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const info = await Purchases.restorePurchases();
      if (mounted.current) setIsPremium(hasProEntitlement(info));
    } catch (e) {
      const err = e as { message?: string };
      if (mounted.current) setError(err?.message ?? DEFAULT_ERROR);
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<SubscriptionValue>(
    () => ({
      isPremium,
      isLoading,
      isInitialized,
      error,
      packages,
      currentOffering,
      purchasePackage,
      restorePurchases,
      clearError,
    }),
    [
      isPremium,
      isLoading,
      isInitialized,
      error,
      packages,
      currentOffering,
      purchasePackage,
      restorePurchases,
      clearError,
    ],
  );
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

/**
 * Disabled provider: while RevenueCat is off (default), every user is treated as
 * premium — no SDK calls, no paywalls, no limits.
 */
function SubscriptionProviderDisabled({ children }: { children: ReactNode }) {
  const value = useMemo<SubscriptionValue>(
    () => ({
      isPremium: true,
      isLoading: false,
      isInitialized: true,
      error: null,
      packages: [],
      currentOffering: null,
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
  return <SubscriptionProviderLive>{children}</SubscriptionProviderLive>;
}

export function useSubscription(): SubscriptionValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
}
