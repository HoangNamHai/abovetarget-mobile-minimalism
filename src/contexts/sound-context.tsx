/**
 * Sound Effects Context
 * Manages global sound configuration state and playback
 */

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SoundEffectsState, SoundName } from '../types/sound';
import { initializeSoundConfig, isSoundAvailable } from '../utils/sound-loader';

interface SoundContextValue {
  soundState: SoundEffectsState | null;
  isLoading: boolean;
  error: string | null;
  isSoundAvailable: (soundName: SoundName) => boolean;
}

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

interface SoundProviderProps {
  children: ReactNode;
}

/**
 * Sound Provider Component
 * Initialize and provide sound configuration to the entire app
 */
export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const [soundState, setSoundState] = useState<SoundEffectsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize sounds on mount
  useEffect(() => {
    const initializeSounds = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const state = await initializeSoundConfig();
        setSoundState(state);

        console.log('[SoundProvider] Sounds initialized successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize sounds';
        setError(errorMessage);
        console.error('[SoundProvider] Error initializing sounds:', err);

        // Set empty state to allow app to continue without sounds
        setSoundState({
          isEnabled: false,
          sounds: {},
          availableSounds: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeSounds();
  }, []);

  const checkSoundAvailable = (soundName: SoundName): boolean => {
    if (!soundState) return false;
    return isSoundAvailable(soundState, soundName);
  };

  const value: SoundContextValue = {
    soundState,
    isLoading,
    error,
    isSoundAvailable: checkSoundAvailable,
  };

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

/**
 * Hook to use the Sound Context
 */
export const useSoundContext = (): SoundContextValue => {
  const context = useContext(SoundContext);

  if (context === undefined) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }

  return context;
};
