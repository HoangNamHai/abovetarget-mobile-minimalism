import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AuthScreenShell } from '../../components/auth/AuthScreenShell';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { AuthLink } from '../../components/auth/AuthLink';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { Button } from '../../components/primitives/Button';
import { useEmailAuth } from '../../hooks/use-email-auth';
import { authDismissAction } from '../../lib/auth-dismiss';

const MIN_PASSWORD = 8;

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error, startSignUp } = useEmailAuth();

  const canSubmit = email.length > 0 && password.length >= MIN_PASSWORD && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const ok = await startSignUp(email, password);
    if (ok) router.push('/(auth)/verify-email');
  };

  const handleDismiss = () => {
    const action = authDismissAction({ canGoBack: router.canGoBack() });
    if (action.type === 'back') router.back();
    else router.replace(action.href);
  };

  return (
    <AuthScreenShell
      title="CREATE ACCOUNT"
      subtitle="Start your PMP prep in minutes."
      error={error}
      onDismiss={handleDismiss}
      footer={
        <AuthLink
          prefix="Have an account? "
          action="Sign in"
          onPress={() => router.replace('/(auth)/sign-in')}
        />
      }
    >
      <AuthTextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        editable={!loading}
      />
      <AuthTextField
        label={`Password (min ${MIN_PASSWORD} characters)`}
        value={password}
        onChangeText={setPassword}
        placeholder="Create a password"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!loading}
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />
      <View style={{ marginTop: 8 }}>
        <Button label="Create Account" onPress={handleSubmit} loading={loading} disabled={!canSubmit} />
      </View>

      <SocialAuthButtons disabled={loading} />
    </AuthScreenShell>
  );
}
