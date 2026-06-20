import { useCallback, useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { mapClerkError } from '../lib/auth/clerk-errors';

/**
 * Email/password flows on top of Clerk's headless `useSignIn`/`useSignUp`.
 *
 * Each action returns a boolean (true = move forward) and, on failure, sets a
 * friendly `error`. Clerk keeps the in-progress sign-up/sign-in resource alive
 * across screens, so `verifyEmailCode` / reset steps pick up where the prior
 * screen left off without threading params.
 *
 * Guards check the resources/functions directly (not the `isLoaded` flag): the
 * hooks return a discriminated union, so the resource is `undefined` until
 * loaded, and checking it narrows the type for the calls below.
 */
export function useEmailAuth() {
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<boolean>): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      return await fn();
    } catch (err) {
      setError(mapClerkError(err));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithPassword = useCallback(
    (email: string, password: string) =>
      run(async () => {
        if (!signIn || !setSignInActive) return false;
        const res = await signIn.create({ identifier: email.trim(), password });
        if (res.status === 'complete') {
          await setSignInActive({ session: res.createdSessionId });
          return true;
        }
        setError('Additional verification is required to sign in.');
        return false;
      }),
    [run, signIn, setSignInActive],
  );

  const startSignUp = useCallback(
    (email: string, password: string) =>
      run(async () => {
        if (!signUp) return false;
        await signUp.create({ emailAddress: email.trim(), password });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        return true;
      }),
    [run, signUp],
  );

  const verifyEmailCode = useCallback(
    (code: string) =>
      run(async () => {
        if (!signUp || !setSignUpActive) return false;
        const res = await signUp.attemptEmailAddressVerification({ code: code.trim() });
        if (res.status === 'complete') {
          await setSignUpActive({ session: res.createdSessionId });
          return true;
        }
        setError('That code is incorrect. Please try again.');
        return false;
      }),
    [run, signUp, setSignUpActive],
  );

  const resendEmailCode = useCallback(
    () =>
      run(async () => {
        if (!signUp) return false;
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        return true;
      }),
    [run, signUp],
  );

  const requestPasswordReset = useCallback(
    (email: string) =>
      run(async () => {
        if (!signIn) return false;
        await signIn.create({ strategy: 'reset_password_email_code', identifier: email.trim() });
        return true;
      }),
    [run, signIn],
  );

  const confirmPasswordReset = useCallback(
    (code: string, password: string) =>
      run(async () => {
        if (!signIn || !setSignInActive) return false;
        const res = await signIn.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code: code.trim(),
          password,
        });
        if (res.status === 'complete') {
          await setSignInActive({ session: res.createdSessionId });
          return true;
        }
        setError('Could not reset your password. Please try again.');
        return false;
      }),
    [run, signIn, setSignInActive],
  );

  return {
    loading,
    error,
    setError,
    signInWithPassword,
    startSignUp,
    verifyEmailCode,
    resendEmailCode,
    requestPasswordReset,
    confirmPasswordReset,
  };
}
