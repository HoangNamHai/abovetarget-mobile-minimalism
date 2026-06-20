export const TOKENS = {
  primary: '#000000',
  'on-primary': '#ffffff',
  background: '#f9f9f9',
  'on-background': '#1a1c1c',
  surface: '#f9f9f9',
  'surface-dim': '#dadada',
  'surface-bright': '#f9f9f9',
  'surface-container-lowest': '#ffffff',
  'surface-container-low': '#f3f3f3',
  'surface-container': '#eeeeee',
  'surface-container-high': '#e8e8e8',
  'surface-container-highest': '#e2e2e2',
  outline: '#7e7576',
  'outline-variant': '#cfc4c5',
} as const;

export type TokenName = keyof typeof TOKENS;

/**
 * Canonical border-radius scale (see docs/design-system.md §4). The single
 * source of truth in code — never hardcode a radius literal in a screen; if a
 * genuinely new value is needed, add it here first.
 *
 * Geometric circles (radius = ½ · width/height) are NOT radii on this scale —
 * keep those computed inline.
 */
export const RADIUS = {
  /** Cards, quiz options, drop zones (Tailwind `rounded-sm`). */
  card: 4,
  /** Image/media cards (lesson hero), tables (Tailwind `rounded-lg`). */
  media: 8,
  /** Bottom-sheet top corners (Tailwind `rounded-2xl`). */
  sheet: 16,
  /** Buttons, chips, badges, nav buttons (Tailwind `rounded-full`). */
  pill: 999,
  /** Thin progress-bar tracks. */
  track: 3,
} as const;

export type RadiusName = keyof typeof RADIUS;
