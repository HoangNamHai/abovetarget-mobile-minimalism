import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import { CLERK_PUBLISHABLE_KEY, hasClerkKey } from '../config/env';
import { tokenCache } from '../services/infra/clerk-token-cache';

export interface AppAuthValue {
  isSignedIn: boolean;
  isLoading: boolean;
  user: { id: string; email: string | null } | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AppAuthValue | null>(null);

/** Mounts ClerkProvider only when a publishable key is configured; else passthrough.
 *  Renders children immediately — Clerk hydrates in the background so the app (and
 *  onboarding) is never blocked on a network round-trip (offline = no longer blank). */
export function ClerkGate({ children }: { children: ReactNode }) {
  if (!hasClerkKey()) return <>{children}</>;
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  );
}

function StubAuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AppAuthValue>(
    () => ({ isSignedIn: false, isLoading: false, user: null, signOut: async () => {} }),
    [],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const value = useMemo<AppAuthValue>(
    () => ({
      isSignedIn: !!isSignedIn,
      isLoading: !isLoaded,
      user: user ? { id: user.id, email: user.primaryEmailAddress?.emailAddress ?? null } : null,
      signOut: async () => {
        await signOut();
      },
    }),
    [isLoaded, isSignedIn, user, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (hasClerkKey()) return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  return <StubAuthProvider>{children}</StubAuthProvider>;
}

export function useAppAuth(): AppAuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAppAuth must be used within an AuthProvider');
  return ctx;
}
