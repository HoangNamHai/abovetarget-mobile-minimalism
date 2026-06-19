import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createPersistence,
  type Persistence,
} from '../services/persistence';

const PersistenceContext = createContext<Persistence | null>(null);

export function PersistenceProvider({
  children,
  value,
}: {
  children: ReactNode;
  value?: Persistence;
}) {
  const [persistence, setPersistence] = useState<Persistence | null>(value ?? null);

  useEffect(() => {
    if (value) return; // injected (tests) — nothing to create
    let mounted = true;
    createPersistence().then((p) => {
      if (mounted) setPersistence(p);
    });
    return () => {
      mounted = false;
    };
  }, [value]);

  if (!persistence) return null;
  return (
    <PersistenceContext.Provider value={persistence}>{children}</PersistenceContext.Provider>
  );
}

export function usePersistence(): Persistence {
  const ctx = useContext(PersistenceContext);
  if (!ctx) throw new Error('usePersistence must be used within a PersistenceProvider');
  return ctx;
}
