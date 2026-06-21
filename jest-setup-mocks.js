jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// react-native-safe-area-context ships its jest mock only as untransformed .tsx,
// so provide a minimal inline equivalent: zero insets + passthrough components.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    SafeAreaInsetsContext: React.createContext(inset),
    SafeAreaFrameContext: React.createContext(frame),
    initialWindowMetrics: { insets: inset, frame },
  };
});

jest.mock('expo-secure-store', () => {
  const mem = new Map();
  return {
    getItemAsync: jest.fn(async (k) => (mem.has(k) ? mem.get(k) : null)),
    setItemAsync: jest.fn(async (k, v) => { mem.set(k, v); }),
    deleteItemAsync: jest.fn(async (k) => { mem.delete(k); }),
  };
});

jest.mock('expo-sqlite', () => {
  // Minimal in-memory executor: tracks applied DDL + a single attempts table.
  function makeDb() {
    const tables = new Set();
    const rows = [];
    const meta = new Map();
    return {
      execAsync: jest.fn(async (sql) => {
        if (/create table.*schema_version/i.test(sql)) tables.add('schema_version');
        if (/create table.*attempts/i.test(sql)) tables.add('attempts');
      }),
      runAsync: jest.fn(async (sql, params = []) => {
        if (/insert into schema_version/i.test(sql)) meta.set('version', params[0]);
        else if (/insert or replace into attempts/i.test(sql)) {
          const [id, lessonId, lessonTitle, questionCount, score, completedAt, domain] = params;
          const i = rows.findIndex((r) => r.id === id);
          const row = { id, lessonId, lessonTitle, questionCount, score, completedAt, domain };
          if (i >= 0) rows[i] = row; else rows.push(row);
        } else if (/delete from attempts/i.test(sql)) rows.length = 0;
      }),
      getAllAsync: jest.fn(async (sql, params = []) => {
        if (/from attempts/i.test(sql)) {
          const sorted = [...rows].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
          const m = sql.match(/limit\s+\?/i);
          if (m && params.length > 0) {
            return sorted.slice(0, params[0]);
          }
          const literalMatch = sql.match(/limit\s+(\d+)/i);
          return literalMatch ? sorted.slice(0, Number(literalMatch[1])) : sorted;
        }
        return [];
      }),
      getFirstAsync: jest.fn(async (sql) => {
        if (/count\(\*\).*attempts/i.test(sql)) return { c: rows.length };
        if (/from schema_version/i.test(sql)) {
          return meta.has('version') ? { version: meta.get('version') } : null;
        }
        return null;
      }),
    };
  }
  return { openDatabaseAsync: jest.fn(async () => makeDb()) };
});

// --- Phase 5 infra: mock native SDKs so the JS suite never touches native code ---

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (c) => c,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    logIn: jest.fn(async () => ({ customerInfo: { entitlements: { active: {} } }, created: false })),
    logOut: jest.fn(async () => ({ entitlements: { active: {} } })),
    isAnonymous: jest.fn(async () => true),
    getAppUserID: jest.fn(async () => '$RCAnonymousID:test'),
    getCustomerInfo: jest.fn(async () => ({ entitlements: { active: {} } })),
    getOfferings: jest.fn(async () => ({ current: null })),
    purchasePackage: jest.fn(async () => ({ customerInfo: { entitlements: { active: {} } } })),
    restorePurchases: jest.fn(async () => ({ entitlements: { active: {} } })),
    // Real SDK: addCustomerInfoUpdateListener returns void; cleanup via removeCustomerInfoUpdateListener.
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG' },
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(async () => ({ isConnected: true })),
  },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => {}),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => 'notif-id'),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

jest.mock('@clerk/clerk-expo', () => ({
  ClerkProvider: ({ children }) => children,
  ClerkLoaded: ({ children }) => children,
  useAuth: () => ({ isLoaded: true, isSignedIn: false, signOut: jest.fn(async () => {}) }),
  useUser: () => ({ isLoaded: true, user: null }),
}));
