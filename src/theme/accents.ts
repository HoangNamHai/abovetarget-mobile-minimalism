// Semantic accent colors — the ONLY non-greyscale colors in the UI.
// See docs/design-system.md §2. Don't introduce new accent hexes elsewhere;
// add them here so the palette stays consistent.
export const ACCENTS = {
  /**
   * "Your current pick" — selected answers, and inline emphasis in display
   * headings. Ink rather than a hue so selection matches the monochrome brand
   * (the onboarding ChoiceScreen already fills selected rows with ink).
   */
  selection: '#111111',
  /** Premium / recommended — the single warm accent in the app (gold). */
  premium: '#B98A2E',
  /** Correct answer. */
  success: '#16A34A',
  /** Wrong / try again. */
  error: '#DC2626',
  /** Answer reveal — dark burnt orange. */
  reveal: '#C2410C',
} as const;
