import { SOUND_CONFIGS } from '../data/sound-config';
import type { SoundEffectsState, SoundName, LoadedSound } from '../types/sound';

/**
 * Phase 3: build sound *state* from config without loading audio.
 * Real playback (expo-audio) is deferred to Phase 5, so every sound is
 * reported as not-yet-available and the engine is disabled.
 */
export async function initializeSoundConfig(): Promise<SoundEffectsState> {
  const sounds = {} as Record<SoundName, LoadedSound>;
  for (const config of SOUND_CONFIGS) {
    sounds[config.name] = { config, isAvailable: false };
  }
  return { isEnabled: false, sounds, availableSounds: [] };
}

export function getSound(state: SoundEffectsState, name: SoundName): LoadedSound | undefined {
  return state.sounds[name];
}

export function isSoundAvailable(state: SoundEffectsState, name: SoundName): boolean {
  return state.sounds[name]?.isAvailable ?? false;
}
