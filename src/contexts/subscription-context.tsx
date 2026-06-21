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
import { authRequired } from '../config/env';
import { isPremiumGranted } from '../lib/subscription/entitlement';
import {
  resolvePlanStatus,
  type ActiveEntitlementSnapshot,
  type PlanStatus,
} from '../lib/subscription/plan-status';
import { useAppAuth } from './auth-context';

export interface SubscriptionValue {
  isPremium: boolean;
  /** Resolved label/detail for the Profile "Plan" row (free vs the active tier). */
  planStatus: PlanStatus;
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

/**
 * Read the `pro` entitlement from a CustomerInfo-shaped object: both whether it's
 * active and the snapshot the Profile "Plan" row needs to name the tier.
 */
function readPro(info: { entitlements: { active: Record<string, any> } }): {
  isPremium: boolean;
  entitlement: ActiveEntitlementSnapshot | null;
} {
  const e = info.entitlements.active[ENTITLEMENTS.PRO];
  if (!e) return { isPremium: false, entitlement: null };
  return {
    isPremium: true,
    entitlement: {
      productIdentifier: e.productIdentifier ?? '',
      periodType: e.periodType ?? 'NORMAL',
      willRenew: e.willRenew ?? true,
      expirationDate: e.expirationDate ?? null,
    },
  };
}

/**
 * Live RevenueCat-backed provider. Exported for direct testing; in the app it is
 * mounted by SubscriptionProvider only when RevenueCat is enabled.
 */
export function SubscriptionProviderLive({ children }: { children: ReactNode }) {
  // Raw RevenueCat state: whether the `pro` entitlement is active for the current
  // customer. This is NOT the same as "has premium access" — see `isPremium` below,
  // which additionally requires being signed in (no anonymous premium).
  const [entitlementActive, setEntitlementActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [activeEntitlement, setActiveEntitlement] = useState<ActiveEntitlementSnapshot | null>(null);
  const mounted = useRef(true);
  const { isSignedIn, isLoading: authLoading, user } = useAppAuth();

  // Apply a CustomerInfo update to both the premium flag and the entitlement
  // snapshot in one place, so every code path (listener, fetch, purchase,
  // restore, login/logout) stays consistent. No-ops once unmounted.
  const applyInfo = useCallback(
    (info: { entitlements: { active: Record<string, any> } }) => {
      if (!mounted.current) return;
      const pro = readPro(info);
      setEntitlementActive(pro.isPremium);
      setActiveEntitlement(pro.entitlement);
    },
    [],
  );

  useEffect(() => {
    mounted.current = true;
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android;
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });

    const listener = (
      info: Parameters<Parameters<typeof Purchases.addCustomerInfoUpdateListener>[0]>[0],
    ) => {
      applyInfo(info);
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    // Entitlement state + offerings load in parallel; neither blocks the other.
    Purchases.getCustomerInfo()
      .then((info) => {
        applyInfo(info);
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
  }, [applyInfo]);

  // Tie the RevenueCat identity to the auth session so entitlements follow the
  // ACCOUNT, not the device. Without this, a Test Store/store purchase lands on a
  // device-anonymous RevenueCat user that survives Clerk sign-out — leaving the
  // signed-out user still "premium". Runs after configure() (the effect above).
  useEffect(() => {
    if (authLoading) return; // wait until Clerk has resolved the session
    let cancelled = false;
    (async () => {
      try {
        let info;
        if (isSignedIn && user?.id) {
          // Identify RevenueCat with the Clerk user id (aliases any prior
          // anonymous purchase to this account).
          info = (await Purchases.logIn(user.id)).customerInfo;
        } else if (!(await Purchases.isAnonymous())) {
          // Signed out while identified → revert to a fresh anonymous user, which
          // has no entitlement (until a Restore). Guarded so we never call logOut
          // on an already-anonymous user (the SDK rejects that).
          info = await Purchases.logOut();
        } else {
          // Already anonymous (signed out with an anonymous purchase, or never
          // signed in): no identity change to make, but still re-fetch so the Plan
          // reflects the current customer on every auth transition. We never force
          // "free" here — a restorable device purchase legitimately stays.
          info = await Purchases.getCustomerInfo();
        }
        if (!cancelled) applyInfo(info);
      } catch {
        /* logIn/logOut/getCustomerInfo can fail offline; the listener reconciles later */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isSignedIn, user?.id, applyInfo]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    if (!pkg) return;
    setError(null);
    setIsLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      applyInfo(customerInfo);
    } catch (e) {
      // User-initiated cancellation is not an error worth surfacing.
      const err = e as { userCancelled?: boolean | null; message?: string };
      if (!err?.userCancelled && mounted.current) {
        setError(err?.message ?? DEFAULT_ERROR);
      }
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [applyInfo]);

  const restorePurchases = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const info = await Purchases.restorePurchases();
      applyInfo(info);
    } catch (e) {
      const err = e as { message?: string };
      if (mounted.current) setError(err?.message ?? DEFAULT_ERROR);
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [applyInfo]);

  const clearError = useCallback(() => setError(null), []);

  // Effective premium access: an active entitlement only counts while signed in
  // (no anonymous premium). When auth isn't configured, the entitlement alone
  // grants access. This is the single source of truth every consumer reads.
  const isPremium = isPremiumGranted({
    entitlementActive,
    isSignedIn,
    authRequired: authRequired(),
  });

  const planStatus = useMemo(
    () =>
      resolvePlanStatus({
        disabled: false,
        isPremium,
        entitlement: isPremium ? activeEntitlement : null,
      }),
    [isPremium, activeEntitlement],
  );

  const value = useMemo<SubscriptionValue>(
    () => ({
      isPremium,
      planStatus,
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
      planStatus,
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
      planStatus: resolvePlanStatus({ disabled: true, isPremium: true, entitlement: null }),
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
