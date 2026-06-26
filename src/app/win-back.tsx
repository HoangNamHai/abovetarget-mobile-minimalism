import { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '../contexts/subscription-context';
import { ctaLabel, disclosure, freeTrial } from '../lib/paywall-pricing';
import { Button } from '../components/primitives/Button';
import { PressableFeedback } from '../components/primitives/PressableFeedback';
import { Txt } from '../components/primitives/Txt';
import { TOKENS } from '../theme/tokens';

export default function WinBack() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const insets = useSafeAreaInsets();
  const { packages, purchasePackage, isLoading, isPremium } = useSubscription();
  // Lead with the annual plan — the one with the strongest trial/value.
  const annual = packages.find((p) => p.packageType === 'ANNUAL') ?? packages[0] ?? null;
  const trial = annual ? freeTrial(annual) : null;

  const leave = () => {
    if (next) router.replace(next as never);
    else router.replace('/');
  };

  const accept = () => {
    if (annual) purchasePackage(annual);
  };

  // A successful purchase flips isPremium — leave the win-back screen. There is NO
  // global premium router, and (unlike Paywall) this screen has no onClose; without
  // this effect a successful buyer would be stranded here. Mirrors Paywall.tsx:70.
  useEffect(() => {
    if (isPremium) leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  return (
    <View style={[styles.c, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <PressableFeedback testID="winback-close" onPress={leave}>
          <Txt variant="label" style={styles.close}>✕</Txt>
        </PressableFeedback>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Txt variant="display" style={styles.title}>Wait — start free</Txt>
        <Txt variant="body" style={styles.sub}>
          {trial
            ? `Try everything free for ${trial.days} days. You won't be charged today.`
            : `Unlock every lesson and keep your study plan.`}
        </Txt>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 28) }]}>
        {annual ? (
          <Txt testID="winback-disclosure" variant="body" style={styles.disclosure}>
            {disclosure(annual)}
          </Txt>
        ) : null}
        <Button
          testID="winback-accept"
          label={ctaLabel(annual)}
          onPress={accept}
          loading={isLoading}
          disabled={!annual}
        />
        <PressableFeedback testID="winback-skip" onPress={leave}>
          <Txt variant="label" style={styles.skip}>No thanks, continue</Txt>
        </PressableFeedback>
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
});
