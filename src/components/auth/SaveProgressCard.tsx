import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAppAuth } from '../../contexts/auth-context';
import { Txt } from '../primitives/Txt';
import { Button } from '../primitives/Button';
import { AuthLink } from './AuthLink';
import { TOKENS, RADIUS } from '../../theme/tokens';

// Shown to anonymous users after they complete a unit: a soft nudge to create an
// account so their progress isn't lost. Honest copy — until backend sync ships,
// progress lives only on this device, so "don't lose it" is the real value.
// Renders nothing once signed in. Mount only when auth is configured
// (`authRequired()`), so it stays inert in key-less/dev/CI runs.
export function SaveProgressCard() {
  const { isSignedIn } = useAppAuth();
  if (isSignedIn) return null;

  return (
    <View
      style={{
        marginBottom: 24,
        borderWidth: 1,
        borderColor: TOKENS.primary,
        backgroundColor: TOKENS['surface-container-lowest'],
        borderRadius: RADIUS.card,
        padding: 20,
      }}
    >
      <Txt
        variant="label"
        style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: TOKENS.outline, marginBottom: 8 }}
      >
        Don't lose your progress
      </Txt>
      <Txt variant="body" style={{ fontSize: 16, lineHeight: 22, color: TOKENS['on-background'], marginBottom: 16 }}>
        Create a free account to keep your streak and history safe. Right now it
        only lives on this device.
      </Txt>
      <Button label="Create Account" onPress={() => router.push('/(auth)/sign-up')} />
      <View style={{ height: 12 }} />
      <AuthLink
        prefix="Already have one? "
        action="Sign in"
        onPress={() => router.push('/(auth)/sign-in')}
      />
    </View>
  );
}
