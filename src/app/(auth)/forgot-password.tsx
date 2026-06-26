import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AuthScreenShell } from '../../components/auth/AuthScreenShell';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { AuthLink } from '../../components/auth/AuthLink';
import { Button } from '../../components/primitives/Button';
import { useEmailAuth } from '../../hooks/use-email-auth';
import { authDismissAction } from '../../lib/auth-dismiss';

const MIN_PASSWORD = 8;

export default function ForgotPassword() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error, requestPasswordReset, confirmPasswordReset } = useEmailAuth();

  const handleRequest = async () => {
    if (email.length === 0 || loading) return;
    const ok = await requestPasswordReset(email);
    if (ok) setStep('reset');
  };

  const canReset = code.trim().length > 0 && password.length >= MIN_PASSWORD && !loading;

  const handleReset = async () => {
    if (!canReset) return;
    const ok = await confirmPasswordReset(code, password);
    if (ok) router.replace('/');
  };

  const handleDismiss = () => {
    const action = authDismissAction({ canGoBack: router.canGoBack() });
    if (action.type === 'back') router.back();
    else router.replace(action.href);
  };

  if (step === 'request') {
    return (
      <AuthScreenShell
        title="RESET PASSWORD"
        subtitle="Enter your email and we'll send a reset code."
        error={error}
        onDismiss={handleDismiss}
        footer={<AuthLink action="Back to sign in" onPress={() => router.replace('/(auth)/sign-in')} />}
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
          returnKeyType="go"
          onSubmitEditing={handleRequest}
        />
        <View style={{ marginTop: 8 }}>
          <Button
            label="Send Reset Code"
            onPress={handleRequest}
            loading={loading}
            disabled={email.length === 0 || loading}
          />
        </View>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      title="ENTER NEW PASSWORD"
      subtitle="Use the code from your email and choose a new password."
      error={error}
      onDismiss={handleDismiss}
      footer={<AuthLink action="Back to sign in" onPress={() => router.replace('/(auth)/sign-in')} />}
    >
      <AuthTextField
        label="Reset code"
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        editable={!loading}
      />
      <AuthTextField
        label={`New password (min ${MIN_PASSWORD} characters)`}
        value={password}
        onChangeText={setPassword}
        placeholder="New password"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!loading}
        returnKeyType="go"
        onSubmitEditing={handleReset}
      />
      <View style={{ marginTop: 8 }}>
        <Button label="Reset Password" onPress={handleReset} loading={loading} disabled={!canReset} />
      </View>
    </AuthScreenShell>
  );
}
