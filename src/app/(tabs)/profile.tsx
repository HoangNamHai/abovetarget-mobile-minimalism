import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SHOW_DEV_OPTIONS } from '../../config/feature-flags';
import { useOnboarding } from '../../contexts/onboarding-context';
import { useProgress } from '../../contexts/progress-context';
import { useSettings } from '../../contexts/settings-context';
import { useSubscription } from '../../contexts/subscription-context';
import { useLessonLimit } from '../../hooks/use-lesson-limit';
import { Hairline } from '../../components/primitives/Hairline';
import { Txt } from '../../components/primitives/Txt';
import { Button } from '../../components/primitives/Button';
import { TOKENS } from '../../theme/tokens';

// ─── Dev options section ──────────────────────────────────────────────────────
// Isolated so its hooks (useOnboarding, useProgress, useLessonLimit) only run
// when SHOW_DEV_OPTIONS=true causes this component to mount.

function DevOptionsSection() {
  const { resetOnboarding } = useOnboarding();
  const { resetProgress } = useProgress();
  const { resetDailyLimit } = useLessonLimit();

  return (
    <View style={styles.section}>
      <Txt variant="label" style={styles.sectionHeader}>DEV OPTIONS</Txt>
      <View style={styles.card}>
        <View style={styles.devItem}>
          <Button label="Reset Onboarding" onPress={() => resetOnboarding()} />
        </View>
        <View style={styles.devItem}>
          <Button label="Reset Progress" onPress={() => resetProgress()} />
        </View>
        <View style={styles.devItem}>
          <Button label="Reset Daily Limit" onPress={() => resetDailyLimit()} />
        </View>
      </View>
    </View>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function Row({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Txt variant="body" style={styles.rowLabel}>{label}</Txt>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

// ─── Profile screen ───────────────────────────────────────────────────────────

export default function Profile() {
  const { settings, setHaptics, setSounds, setNotifications } = useSettings();
  const { isPremium } = useSubscription();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Subscription status */}
      <View style={styles.section}>
        <Txt variant="label" style={styles.sectionHeader}>ACCOUNT</Txt>
        <View style={styles.card}>
          <View style={styles.row}>
            <Txt variant="body" style={styles.rowLabel}>Status</Txt>
            <Txt variant="label" style={[styles.statusBadge, isPremium ? styles.premium : styles.free]}>
              {isPremium ? 'PREMIUM' : 'FREE'}
            </Txt>
          </View>
        </View>
      </View>

      <Hairline />

      {/* Settings toggles */}
      <View style={styles.section}>
        <Txt variant="label" style={styles.sectionHeader}>PREFERENCES</Txt>
        <View style={styles.card}>
          <Row label="Haptics" value={settings.haptics} onValueChange={(v) => setHaptics(v)} />
          <Hairline />
          <Row label="Sounds" value={settings.sounds} onValueChange={(v) => setSounds(v)} />
          <Hairline />
          <Row label="Notifications" value={settings.notifications} onValueChange={(v) => setNotifications(v)} />
        </View>
      </View>

      {/* Dev options — only mounted when feature flag is enabled */}
      {SHOW_DEV_OPTIONS && (
        <>
          <Hairline />
          <DevOptionsSection />
        </>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TOKENS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    color: TOKENS.outline,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: TOKENS['outline-variant'],
    backgroundColor: TOKENS['surface-container-lowest'],
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 16,
    color: TOKENS['on-background'],
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  premium: {
    color: TOKENS.primary,
  },
  free: {
    color: TOKENS.outline,
  },
  devItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
