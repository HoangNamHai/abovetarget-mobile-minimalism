import { useEffect } from 'react';
import { Linking, View, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '../contexts/subscription-context';
import { useAppAuth } from '../contexts/auth-context';
import { authRequired } from '../config/env';
import { LEGAL_URLS } from '../config/legal';
import { ctaLabel, disclosure, introOffer } from '../lib/paywall-pricing';
import { Button } from '../components/primitives/Button';
import { Hairline } from '../components/primitives/Hairline';
import { PressableFeedback } from '../components/primitives/PressableFeedback';
import { Txt } from '../components/primitives/Txt';
import { TOKENS } from '../theme/tokens';

export default function WinBack() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const insets = useSafeAreaInsets();
  // Use the dedicated `winback` offering (the discounted annual) — a genuinely
  // different offer than the main paywall (Apple 5.6), shown only here.
  const { winbackPackages, purchasePackage, restorePurchases, isLoading, isPremium } =
    useSubscription();
  const { isSignedIn } = useAppAuth();
  // No anonymous premium: buying/restoring needs an account when auth is configured.
  const mustSignIn = authRequired() && !isSignedIn;

  const annual = winbackPackages.find((p) => p.packageType === 'ANNUAL') ?? winbackPackages[0] ?? null;
  const intro = introOffer(annual);

  const leave = () => {
    if (next) router.replace(next as never);
    else router.replace('/');
  };

  const goSignIn = () => router.push('/(auth)/sign-in');

  const accept = () => {
    if (mustSignIn) return goSignIn();
    if (annual) purchasePackage(annual);
  };

  const handleRestore = () => {
    if (mustSignIn) return goSignIn();
    restorePurchases();
  };

  // A successful purchase/restore flips isPremium — leave the win-back screen. There
  // is NO global premium router, and (unlike Paywall) this screen has no onClose;
  // without this effect a successful buyer would be stranded here. Mirrors Paywall.
  useEffect(() => {
    if (isPremium) leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  const title = intro ? `Wait — your first year for ${intro.priceString}` : 'Wait — one more option';
  const sub = intro
    ? `Get a full year for ${intro.priceString}, then ${annual?.product.priceString}/year. Keep your study plan and unlock everything.`
    : 'Unlock every lesson and keep your study plan.';
  const label = mustSignIn
    ? 'Sign in to subscribe'
    : intro
      ? `Get 1 year — ${intro.priceString}`
      : ctaLabel(annual);

  return (
    <View style={[styles.c, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <PressableFeedback testID="winback-close" onPress={leave}>
          <Txt variant="label" style={styles.close}>✕</Txt>
        </PressableFeedback>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Txt variant="display" style={styles.title}>{title}</Txt>
        <Txt variant="body" style={styles.sub}>{sub}</Txt>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 28) }]}>
        {annual ? (
          <Txt testID="winback-disclosure" variant="body" style={styles.disclosure}>
            {disclosure(annual)}
          </Txt>
        ) : null}
        <Button
          testID="winback-accept"
          label={label}
          onPress={accept}
          loading={isLoading}
          disabled={!mustSignIn && !annual}
        />
        <PressableFeedback testID="winback-skip" onPress={leave}>
          <Txt variant="label" style={styles.skip}>No thanks, continue</Txt>
        </PressableFeedback>
        <Hairline />
        <PressableFeedback testID="winback-restore" onPress={handleRestore}>
          <Txt variant="label" style={styles.restore}>Restore Purchases</Txt>
        </PressableFeedback>
        <View style={styles.legalRow}>
          <PressableFeedback testID="winback-terms" onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
            <Txt variant="label" style={styles.legalLink}>Terms</Txt>
          </PressableFeedback>
          <Txt variant="label" style={styles.legalDot}>·</Txt>
          <PressableFeedback testID="winback-privacy" onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
            <Txt variant="label" style={styles.legalLink}>Privacy</Txt>
          </PressableFeedback>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: TOKENS.background },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16 },
  close: { fontSize: 22, color: TOKENS['on-background'], paddingHorizontal: 8, paddingVertical: 4 },
  body: { paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 34, color: TOKENS['on-background'], marginTop: 8 },
  sub: { fontSize: 16, color: TOKENS.outline, marginTop: 12, lineHeight: 24 },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  disclosure: { fontSize: 16, color: TOKENS.outline, textAlign: 'center', lineHeight: 22 },
  skip: { fontSize: 14, color: TOKENS.outline, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2 },
  restore: { fontSize: 14, color: TOKENS.outline, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  legalLink: { fontSize: 13, color: TOKENS.outline, textDecorationLine: 'underline' },
  legalDot: { fontSize: 13, color: TOKENS.outline },
});
