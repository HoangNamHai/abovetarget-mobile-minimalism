import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AuthScreenShell } from '../../components/auth/AuthScreenShell';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { AuthLink } from '../../components/auth/AuthLink';
import { SocialAuthButtons } from '../../components/auth/SocialAuthButtons';
import { Button } from '../../components/primitives/Button';
import { useEmailAuth } from '../../hooks/use-email-auth';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error, signInWithPassword } = useEmailAuth();

  const canSubmit = email.length > 0 && password.length > 0 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const ok = await signInWithPassword(email, password);
    if (ok) router.replace('/');
  };

  return (
    <AuthScreenShell
      title="WELCOME BACK"
      subtitle="Sign in to continue your prep."
      error={error}
      footer={
        <>
          <AuthLink action="Forgot password?" onPress={() => router.push('/(auth)/forgot-password')} />
          <AuthLink
            prefix="No account? "
            action="Sign up"
            onPress={() => router.replace('/(auth)/sign-up')}
          />
        </>
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
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        editable={!loading}
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />
      <View style={{ marginTop: 8 }}>
        <Button label="Sign In" onPress={handleSubmit} loading={loading} disabled={!canSubmit} />
      </View>

      <SocialAuthButtons disabled={loading} />
    </AuthScreenShell>
  );
}
