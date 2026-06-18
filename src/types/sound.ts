/**
 * Sound Effect Types and Configurations
 */

export type SoundCategory = 'ui' | 'feedback' | 'transitions' | 'milestones' | 'ambient';

export type SoundName =
  | 'ui-tap'
  | 'option-select'
  | 'toggle'
  | 'success'
  | 'error'
  | 'correct-answer'
  | 'screen-change'
  | 'load-content'
  | 'lesson-complete'
  | 'achievement-unlock'
  | 'victory-fanfare'
  | 'study-mode';

export interface SoundConfig {
  name: SoundName;
  fileName: string;
  folder: SoundCategory;
  volume: number; // 0.0 - 1.0
  duration?: number; // milliseconds
  isLoopable?: boolean; // for ambient sounds
}

export interface LoadedSound {
  config: SoundConfig;
  isAvailable: boolean; // whether the file exists and is ready to play
  error?: string; // error message if file loading failed
}

export interface SoundEffectsState {
  isEnabled: boolean;
  sounds: Record<SoundName, LoadedSound>;
  availableSounds: SoundName[]; // list of sounds that are available to play
}
