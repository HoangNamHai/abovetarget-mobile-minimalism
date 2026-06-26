import React, { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '../primitives/Txt';
import { Appear } from '../primitives/Appear';
import { PressableFeedback } from '../primitives/PressableFeedback';
import { TOKENS } from '../../theme/tokens';
import { ACCENTS } from '../../theme/accents';

type Props = {
  title: string;
  subtitle?: string;
  /** Form-level error message shown above the form body. */
  error?: string | null;
  children: ReactNode;
  /** Footer links area (sign-up / sign-in / forgot). */
  footer?: ReactNode;
  /**
   * When set, renders a ✕ dismiss control in the header so the user can leave the
   * auth flow and keep using the app anonymously. Auth is always optional.
   */
  onDismiss?: () => void;
};

// Shared layout for every (auth) screen: safe-area padding, keyboard avoidance,
// an Anton display title, optional subtitle, an inline error slot, the form body,
// and a footer link area — all entering with the standard Appear motion.
export function AuthScreenShell({ title, subtitle, error, children, footer, onDismiss }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: TOKENS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + (onDismiss != null ? 8 : 32),
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {onDismiss != null && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
            <PressableFeedback testID="auth-dismiss" onPress={onDismiss}>
              <Txt
                variant="label"
                style={{ fontSize: 22, color: TOKENS['on-background'], paddingHorizontal: 8, paddingVertical: 4 }}
              >
                ✕
              </Txt>
            </PressableFeedback>
          </View>
        )}

        <Appear index={0}>
          <Txt variant="display" style={{ fontSize: 34, lineHeight: 40, color: TOKENS['on-background'] }}>
            {title}
          </Txt>
          {subtitle != null && (
            <Txt
              variant="body"
              style={{ fontSize: 16, lineHeight: 24, color: TOKENS.outline, marginTop: 8 }}
            >
              {subtitle}
            </Txt>
          )}
        </Appear>

        <View style={{ height: 28 }} />

        {error != null && (
          <Txt
            variant="body"
            style={{ fontSize: 14, lineHeight: 20, color: ACCENTS.error, marginBottom: 16 }}
          >
            {error}
          </Txt>
        )}

        <Appear index={1}>{children}</Appear>

        {footer != null && (
          <Appear index={2}>
            <View style={{ marginTop: 24, alignItems: 'center', gap: 12 }}>{footer}</View>
          </Appear>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
