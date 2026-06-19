import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePersistence } from './persistence-context';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemePreference;
  notifications: boolean;
  haptics: boolean;
  sounds: boolean;
}

interface SettingsContextValue {
  settings: AppSettings;
  isLoading: boolean;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setNotifications: (enabled: boolean) => Promise<void>;
  setHaptics: (enabled: boolean) => Promise<void>;
  setSounds: (enabled: boolean) => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const KEYS = {
  THEME: '@app/theme',
  NOTIFICATIONS: '@app/notifications',
  HAPTICS: '@app/haptics',
  SOUNDS: '@app/sounds',
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  notifications: true,
  haptics: true,
  sounds: true,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { kv } = usePersistence();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [theme, notifications, haptics, sounds] = await Promise.all([
          kv.getString(KEYS.THEME),
          kv.getJSON<boolean>(KEYS.NOTIFICATIONS),
          kv.getJSON<boolean>(KEYS.HAPTICS),
          kv.getJSON<boolean>(KEYS.SOUNDS),
        ]);
        if (!mounted) return;
        setSettings({
          theme: (theme as ThemePreference) || DEFAULT_SETTINGS.theme,
          notifications: notifications ?? DEFAULT_SETTINGS.notifications,
          haptics: haptics ?? DEFAULT_SETTINGS.haptics,
          sounds: sounds ?? DEFAULT_SETTINGS.sounds,
        });
      } catch (error) {
        console.warn('[SettingsProvider] Failed to load settings:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [kv]);

  const setTheme = useCallback(
    async (theme: ThemePreference) => {
      await kv.setString(KEYS.THEME, theme);
      setSettings((prev) => ({ ...prev, theme }));
    },
    [kv],
  );
  const setNotifications = useCallback(
    async (enabled: boolean) => {
      await kv.setJSON(KEYS.NOTIFICATIONS, enabled);
      setSettings((prev) => ({ ...prev, notifications: enabled }));
    },
    [kv],
  );
  const setHaptics = useCallback(
    async (enabled: boolean) => {
      await kv.setJSON(KEYS.HAPTICS, enabled);
      setSettings((prev) => ({ ...prev, haptics: enabled }));
    },
    [kv],
  );
  const setSounds = useCallback(
    async (enabled: boolean) => {
      await kv.setJSON(KEYS.SOUNDS, enabled);
      setSettings((prev) => ({ ...prev, sounds: enabled }));
    },
    [kv],
  );

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const ops: Promise<void>[] = [];
      if (updates.theme !== undefined) ops.push(kv.setString(KEYS.THEME, updates.theme));
      if (updates.notifications !== undefined)
        ops.push(kv.setJSON(KEYS.NOTIFICATIONS, updates.notifications));
      if (updates.haptics !== undefined) ops.push(kv.setJSON(KEYS.HAPTICS, updates.haptics));
      if (updates.sounds !== undefined) ops.push(kv.setJSON(KEYS.SOUNDS, updates.sounds));
      await Promise.all(ops);
      setSettings((prev) => ({ ...prev, ...updates }));
    },
    [kv],
  );

  const resetSettings = useCallback(async () => {
    await Promise.all([
      kv.remove(KEYS.THEME),
      kv.remove(KEYS.NOTIFICATIONS),
      kv.remove(KEYS.HAPTICS),
      kv.remove(KEYS.SOUNDS),
    ]);
    setSettings(DEFAULT_SETTINGS);
  }, [kv]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isLoading,
      setTheme,
      setNotifications,
      setHaptics,
      setSounds,
      updateSettings,
      resetSettings,
    }),
    [settings, isLoading, setTheme, setNotifications, setHaptics, setSounds, updateSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
