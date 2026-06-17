import React, { createContext, useContext, useReducer } from 'react';
import { initialSessionState, sessionReducer, SessionState, SessionAction } from './session-reducer';

const SessionContext = createContext<{ state: SessionState; dispatch: React.Dispatch<SessionAction> } | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  return <SessionContext.Provider value={{ state, dispatch }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
