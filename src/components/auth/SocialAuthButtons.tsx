import React from 'react';
import { Platform, View } from 'react-native';
import { Button } from '../primitives/Button';
import { Txt } from '../primitives/Txt';
import { Hairline } from '../primitives/Hairline';
import { TOKENS } from '../../theme/tokens';
import { ACCENTS } from '../../theme/accents';
import { useSocialAuth } from '../../hooks/use-social-auth';

type Props = {
  /** Disable while another (e.g. email) flow is in flight. */
  disabled?: boolean;
};

// Apple + Google sign-in buttons. Apple is iOS-only (App Store convention);
// Google shows on every platform. Both route through Clerk SSO.
export function SocialAuthButtons({ disabled = false }: Props) {
  const { authenticate, pending, error } = useSocialAuth();
  const busy = disabled || pending !== null;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
        <View style={{ flex: 1 }}>
          <Hairline />
        </View>
        <Txt
          variant="label"
          style={{ fontSize: 11, letterSpacing: 2, color: TOKENS.outline, marginHorizontal: 12 }}
        >
          OR
        </Txt>
        <View style={{ flex: 1 }}>
          <Hairline />
        </View>
      </View>

      <View style={{ gap: 12 }}>
        {Platform.OS === 'ios' && (
          <Button
            label="Continue with Apple"
            variant="secondary"
            onPress={() => authenticate('oauth_apple')}
            loading={pending === 'oauth_apple'}
            disabled={busy}
          />
        )}
        <Button
          label="Continue with Google"
          variant="secondary"
          onPress={() => authenticate('oauth_google')}
          loading={pending === 'oauth_google'}
          disabled={busy}
        />
      </View>

      {error != null && (
        <Txt
          variant="body"
          style={{ fontSize: 14, lineHeight: 20, color: ACCENTS.error, marginTop: 12, textAlign: 'center' }}
        >
          {error}
        </Txt>
      )}
    </View>
  );
}
