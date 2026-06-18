/**
 * Sound Effects Configuration
 * Defines all sound effects used in the app with their properties
 */

import type { SoundConfig } from '../types/sound';

export const SOUND_CONFIGS: SoundConfig[] = [
  // UI Interaction Sounds
  {
    name: 'ui-tap',
    fileName: 'button-tap.mp3',
    folder: 'ui',
    volume: 0.55,
    duration: 150,
  },
  {
    name: 'option-select',
    fileName: 'option-select.mp3',
    folder: 'ui',
    volume: 0.55,
    duration: 200,
  },
  {
    name: 'toggle',
    fileName: 'toggle.mp3',
    folder: 'ui',
    volume: 0.55,
    duration: 125,
  },

  // Feedback Sounds
  {
    name: 'success',
    fileName: 'success.mp3', // ✓ File exists
    folder: 'feedback',
    volume: 0.75,
    duration: 500,
  },
  {
    name: 'error',
    fileName: 'error.mp3',
    folder: 'feedback',
    volume: 0.65,
    duration: 250,
  },
  {
    name: 'correct-answer',
    fileName: 'success.mp3', // ✓ Reuse success.mp3 for correct answer
    folder: 'feedback',
    volume: 0.75,
    duration: 600,
  },

  // Transition Sounds
  {
    name: 'screen-change',
    fileName: 'screen-change.mp3',
    folder: 'transitions',
    volume: 0.45,
    duration: 200,
  },
  {
    name: 'load-content',
    fileName: 'load-content.mp3',
    folder: 'transitions',
    volume: 0.45,
    duration: 250,
  },

  // Milestone Sounds
  {
    name: 'lesson-complete',
    fileName: 'lesson-complete.mp3',
    folder: 'milestones',
    volume: 0.85,
    duration: 900,
  },
  {
    name: 'achievement-unlock',
    fileName: 'achievement-unlock.mp3',
    folder: 'milestones',
    volume: 0.9,
    duration: 1100,
  },
  {
    name: 'victory-fanfare',
    fileName: 'victory-fanfare.mp3',
    folder: 'milestones',
    volume: 0.9,
    duration: 1400,
  },

  // Ambient Sounds
  {
    name: 'study-mode',
    fileName: 'study-mode.mp3',
    folder: 'ambient',
    volume: 0.25,
    isLoopable: true,
  },
];
