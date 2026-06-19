import React, { createContext, useContext, useMemo, type ReactNode } from 'react';

export interface AppAuthValue {
  isSignedIn: boolean;
  isLoading: boolean;
  user: null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AppAuthValue | null>(null);

// Phase 3 stub: real Clerk wiring lands in Phase 5.
export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AppAuthValue>(
    () => ({ isSignedIn: false, isLoading: false, user: null, signOut: async () => {} }),
    [],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAppAuth(): AppAuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAppAuth must be used within an AuthProvider');
  return ctx;
}
