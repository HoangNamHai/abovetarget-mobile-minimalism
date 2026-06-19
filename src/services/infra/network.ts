export interface NetworkService {
  /** Returns an unsubscribe fn. Invokes cb with the current value soon after subscribe. */
  subscribe(cb: (connected: boolean) => void): () => void;
  fetchConnected(): Promise<boolean>;
}

type NetInfoModule = {
  addEventListener: (cb: (s: { isConnected: boolean | null }) => void) => () => void;
  fetch: () => Promise<{ isConnected: boolean | null }>;
};

export function createNativeNetworkService(): NetworkService {
  let NetInfo: NetInfoModule | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    NetInfo = require('@react-native-community/netinfo').default as NetInfoModule;
  } catch {
    NetInfo = null;
  }
  return {
    subscribe(cb) {
      if (!NetInfo) {
        cb(true);
        return () => {};
      }
      const unsub = NetInfo.addEventListener((s) => cb(s.isConnected ?? true));
      NetInfo.fetch().then((s) => cb(s.isConnected ?? true));
      return unsub;
    },
    async fetchConnected() {
      if (!NetInfo) return true;
      const s = await NetInfo.fetch();
      return s.isConnected ?? true;
    },
  };
}

export function createFakeNetworkService(initial = true) {
  let connected = initial;
  const listeners = new Set<(c: boolean) => void>();
  return {
    subscribe(cb: (c: boolean) => void) {
      listeners.add(cb);
      cb(connected);
      return () => listeners.delete(cb);
    },
    async fetchConnected() {
      return connected;
    },
    emit(value: boolean) {
      connected = value;
      listeners.forEach((l) => l(value));
    },
  };
}
