import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { REVENUECAT_DISABLED } from '../../config/revenuecat';
import { LEGAL_LINKS } from '../../config/links';
import { SHOW_DEV_OPTIONS } from '../../config/feature-flags';
import { useAppAuth } from '../../contexts/auth-context';
import { useOnboarding } from '../../contexts/onboarding-context';
import { useProgress } from '../../contexts/progress-context';
import { useSettings } from '../../contexts/settings-context';
import { useSubscription } from '../../contexts/subscription-context';
import { useLessonLimit } from '../../hooks/use-lesson-limit';
import { useLocalNotifications } from '../../hooks/use-local-notifications';
import { Hairline } from '../../components/primitives/Hairline';
import { PressableFeedback } from '../../components/primitives/PressableFeedback';
import { Txt } from '../../components/primitives/Txt';
import { Button } from '../../components/primitives/Button';
import { TOKENS, RADIUS } from '../../theme/tokens';

// ─── Dev options section ──────────────────────────────────────────────────────

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

// ─── Rows ─────────────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Txt variant="body" style={styles.rowLabel}>{label}</Txt>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableFeedback onPress={onPress}>
      <View style={styles.row}>
        <Txt variant="body" style={styles.rowLabel}>{label}</Txt>
        <Txt variant="label" style={styles.chevron}>›</Txt>
      </View>
    </PressableFeedback>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Txt variant="body" style={styles.rowLabel}>{label}</Txt>
      <Txt variant="label" style={styles.infoValue}>{value}</Txt>
    </View>
  );
}

// ─── Profile screen ───────────────────────────────────────────────────────────

export default function Profile() {
  const { settings, setHaptics, setSounds, setNotifications } = useSettings();
  const { isPremium, restorePurchases } = useSubscription();
  const { isSignedIn, user, signOut } = useAppAuth();
  const { reminderTime, setReminderTime, isAvailable: notificationsAvailable } =
    useLocalNotifications();
  const [restoring, setRestoring] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? '—';

  // Notifications: persist the preference AND actually schedule / cancel the
  // OS-level daily reminder. The stored flag only stays on if permission was
  // granted and a reminder was scheduled.
  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      const time = reminderTime !== 'disabled' ? reminderTime : 'morning';
      const scheduled = await setReminderTime(time);
      await setNotifications(scheduled);
      if (!scheduled) {
        Alert.alert(
          'Notifications unavailable',
          notificationsAvailable
            ? 'Enable notifications for this app in your device settings to get daily reminders.'
            : 'Reminders require a development/production build (not Expo Go).',
        );
      }
    } else {
      await setReminderTime('disabled');
      await setNotifications(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restorePurchases();
      Alert.alert('Restore complete', 'Your purchases have been restored.');
    } catch {
      Alert.alert('Restore failed', 'We could not restore your purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  // Web links open in an in-app browser (Safari View Controller / Custom Tab);
  // mail/other schemes hand off to the OS (mail composer).
  const openLink = async (url: string) => {
    try {
      if (/^https?:/i.test(url)) {
        await WebBrowser.openBrowserAsync(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert('Could not open link');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Account */}
      <View style={styles.section}>
        <Txt variant="label" style={styles.sectionHeader}>ACCOUNT</Txt>
        <View style={styles.card}>
          {isSignedIn && user?.email ? (
            <>
              <InfoRow label="Email" value={user.email} />
              <Hairline />
            </>
          ) : null}
          <View style={styles.row}>
            <Txt variant="body" style={styles.rowLabel}>Status</Txt>
            <Txt variant="label" style={[styles.statusBadge, isPremium ? styles.premium : styles.free]}>
              {isPremium ? 'PREMIUM' : 'FREE'}
            </Txt>
          </View>
          {/* Restore Purchases — only meaningful when RevenueCat is live */}
          {!REVENUECAT_DISABLED && (
            <>
              <Hairline />
              <LinkRow
                label={restoring ? 'Restoring…' : 'Restore Purchases'}
                onPress={restoring ? () => {} : handleRestore}
              />
            </>
          )}
          {/* Sign Out — only when authenticated (Clerk active) */}
          {isSignedIn && (
            <>
              <Hairline />
              <LinkRow label="Sign Out" onPress={handleSignOut} />
            </>
          )}
        </View>
      </View>

      <Hairline />

      {/* Preferences */}
      <View style={styles.section}>
        <Txt variant="label" style={styles.sectionHeader}>PREFERENCES</Txt>
        <View style={styles.card}>
          <ToggleRow label="Haptics" value={settings.haptics} onValueChange={(v) => setHaptics(v)} />
          <Hairline />
          <ToggleRow label="Sounds" value={settings.sounds} onValueChange={(v) => setSounds(v)} />
          <Hairline />
          <ToggleRow
            label="Notifications"
            value={settings.notifications}
            onValueChange={handleNotificationsToggle}
          />
        </View>
      </View>

      <Hairline />

      {/* About */}
      <View style={styles.section}>
        <Txt variant="label" style={styles.sectionHeader}>ABOUT</Txt>
        <View style={styles.card}>
          <LinkRow label="Terms of Service" onPress={() => openLink(LEGAL_LINKS.termsOfService)} />
          <Hairline />
          <LinkRow label="Privacy Policy" onPress={() => openLink(LEGAL_LINKS.privacyPolicy)} />
          <Hairline />
          <LinkRow label="Contact Support" onPress={() => openLink(LEGAL_LINKS.support)} />
          <Hairline />
          <InfoRow label="Version" value={appVersion} />
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
    borderRadius: RADIUS.card,
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
  chevron: {
    fontSize: 22,
    color: TOKENS.outline,
  },
  infoValue: {
    fontSize: 14,
    color: TOKENS.outline,
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
