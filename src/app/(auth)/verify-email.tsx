import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AuthScreenShell } from '../../components/auth/AuthScreenShell';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { AuthLink } from '../../components/auth/AuthLink';
import { Button } from '../../components/primitives/Button';
import { useEmailAuth } from '../../hooks/use-email-auth';
import { authDismissAction } from '../../lib/auth-dismiss';

export default function VerifyEmail() {
  const [code, setCode] = useState('');
  const { loading, error, verifyEmailCode, resendEmailCode } = useEmailAuth();

  const canSubmit = code.trim().length > 0 && !loading;

  const handleVerify = async () => {
    if (!canSubmit) return;
    const ok = await verifyEmailCode(code);
    if (ok) router.replace('/');
  };

  const handleDismiss = () => {
    const action = authDismissAction({ canGoBack: router.canGoBack() });
    if (action.type === 'back') router.back();
    else router.replace(action.href);
  };

  return (
    <AuthScreenShell
      title="CHECK YOUR EMAIL"
      subtitle="Enter the 6-digit code we sent to verify your address."
      error={error}
      onDismiss={handleDismiss}
      footer={<AuthLink action="Resend code" onPress={() => resendEmailCode()} />}
    >
      <AuthTextField
        label="Verification code"
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        editable={!loading}
        returnKeyType="go"
        onSubmitEditing={handleVerify}
      />
      <View style={{ marginTop: 8 }}>
        <Button label="Verify" onPress={handleVerify} loading={loading} disabled={!canSubmit} />
      </View>
    </AuthScreenShell>
  );
}
