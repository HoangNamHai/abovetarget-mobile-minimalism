import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { authRequired } from '../../config/env';
import { useAppAuth } from '../../contexts/auth-context';
import { useSubscription } from '../../contexts/subscription-context';
import { Button } from '../primitives/Button';
import { Hairline } from '../primitives/Hairline';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { Txt } from '../primitives/Txt';
import { TOKENS, RADIUS } from '../../theme/tokens';

const BENEFITS = [
  'Unlimited lessons every day',
  'Full access to every question bank',
  'Track your progress across all topics',
];

/** Human-friendly period label for a package. */
function periodLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case 'ANNUAL':
      return 'Yearly';
    case 'MONTHLY':
      return 'Monthly';
    case 'WEEKLY':
      return 'Weekly';
    case 'LIFETIME':
      return 'Lifetime';
    default:
      return pkg.product.title || 'Premium';
  }
}

/** Prefer the annual package (best value) as the default selection. */
function defaultPackageId(packages: PurchasesPackage[]): string | null {
  if (packages.length === 0) return null;
  const annual = packages.find((p) => p.packageType === 'ANNUAL');
  return (annual ?? packages[0]).identifier;
}

export function Paywall({ onClose }: { onClose: () => void }) {
  const { packages, isPremium, isLoading, error, purchasePackage, restorePurchases, clearError } =
    useSubscription();
  const { isSignedIn } = useAppAuth();
  const insets = useSafeAreaInsets();
  // No anonymous premium: a purchase only grants access once signed in, so both
  // buying and restoring first require an account when auth is configured.
  const mustSignIn = authRequired() && !isSignedIn;
  const [selectedId, setSelectedId] = useState<string | null>(() => defaultPackageId(packages));
  // Mirror the selection in a ref so handleContinue always reads the latest
  // choice even if a re-render hasn't committed yet (a single tap → buy).
  const selectedRef = useRef<string | null>(selectedId);

  const select = (id: string | null) => {
    selectedRef.current = id;
    setSelectedId(id);
  };

  // Keep a valid selection as offerings load in.
  useEffect(() => {
    if (!selectedRef.current || !packages.some((p) => p.identifier === selectedRef.current)) {
      select(defaultPackageId(packages));
    }
  }, [packages]);

  // A successful purchase/restore flips isPremium — leave the paywall.
  useEffect(() => {
    if (isPremium) onClose();
  }, [isPremium, onClose]);

  const goSignIn = () => router.push('/(auth)/sign-in');

  const handleContinue = () => {
    if (mustSignIn) {
      goSignIn();
      return;
    }
    const pkg = packages.find((p) => p.identifier === selectedRef.current);
    if (pkg) purchasePackage(pkg);
  };

  const handleRestore = () => {
    if (mustSignIn) {
      goSignIn();
      return;
    }
    restorePurchases();
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <PressableFeedback testID="paywall-close" onPress={handleClose}>
          <Txt variant="label" style={styles.close}>✕</Txt>
        </PressableFeedback>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Txt variant="display" style={styles.title}>Unlock Premium</Txt>
        <Txt variant="body" style={styles.subtitle}>
          Pass the exam faster with unlimited practice.
        </Txt>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefitRow}>
              <Txt variant="label" style={styles.check}>✓</Txt>
              <Txt variant="body" style={styles.benefitText}>{b}</Txt>
            </View>
          ))}
        </View>

        {packages.length === 0 ? (
          <View testID="paywall-unavailable" style={styles.unavailable}>
            <Txt variant="body" style={styles.unavailableText}>
              Plans are unavailable right now. Please check your connection and try again later.
            </Txt>
          </View>
        ) : (
          <View style={styles.plans}>
            {packages.map((pkg) => {
              const isSelected = pkg.identifier === selectedId;
              return (
                <PressableFeedback
                  key={pkg.identifier}
                  testID={`pkg-${pkg.identifier}`}
                  onPress={() => select(pkg.identifier)}
                >
                  <View style={[styles.plan, isSelected && styles.planSelected]}>
                    <View>
                      <Txt variant="label" style={styles.planPeriod}>{periodLabel(pkg)}</Txt>
                      <Txt variant="body" style={styles.planProduct}>{pkg.product.title}</Txt>
                    </View>
                    <Txt variant="label" style={styles.planPrice}>{pkg.product.priceString}</Txt>
                  </View>
                </PressableFeedback>
              );
            })}
          </View>
        )}

        {error ? (
          <Txt testID="paywall-error" variant="body" style={styles.error}>{error}</Txt>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 28) }]}>
        {packages.length > 0 ? (
          <Button
            testID="paywall-continue"
            label={mustSignIn ? 'Sign in to subscribe' : 'Continue'}
            onPress={handleContinue}
            loading={isLoading}
            disabled={!mustSignIn && !selectedId}
          />
        ) : null}
        <Hairline />
        <PressableFeedback testID="paywall-restore" onPress={handleRestore}>
          <Txt variant="label" style={styles.restore}>Restore Purchases</Txt>
        </PressableFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  close: {
    fontSize: 22,
    color: TOKENS['on-background'],
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 34,
    color: TOKENS['on-background'],
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: TOKENS.outline,
    marginTop: 8,
    marginBottom: 24,
  },
  benefits: {
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  check: {
    fontSize: 16,
    color: TOKENS.primary,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: TOKENS['on-background'],
    flexShrink: 1,
  },
  plans: {
    gap: 12,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: TOKENS['outline-variant'],
    backgroundColor: TOKENS['surface-container-lowest'],
    borderRadius: RADIUS.media,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  planSelected: {
    borderColor: TOKENS.primary,
    borderWidth: 2,
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS['on-background'],
  },
  planProduct: {
    fontSize: 13,
    color: TOKENS.outline,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS['on-background'],
  },
  unavailable: {
    borderWidth: 1,
    borderColor: TOKENS['outline-variant'],
    borderRadius: RADIUS.media,
    padding: 20,
  },
  unavailableText: {
    fontSize: 15,
    color: TOKENS.outline,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: '#b3261e',
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 16,
  },
  restore: {
    fontSize: 14,
    color: TOKENS.outline,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
