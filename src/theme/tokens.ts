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
