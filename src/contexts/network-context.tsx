import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createNativeNetworkService, type NetworkService } from '../services/infra/network';

interface NetworkValue {
  isConnected: boolean;
}

const NetworkContext = createContext<NetworkValue | null>(null);

export function NetworkProvider({
  children,
  service,
}: {
  children: ReactNode;
  service?: NetworkService;
}) {
  const svc = useMemo(() => service ?? createNativeNetworkService(), [service]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => svc.subscribe(setIsConnected), [svc]);

  const value = useMemo<NetworkValue>(() => ({ isConnected }), [isConnected]);
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within a NetworkProvider');
  return ctx;
}
