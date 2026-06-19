// Semantic accent colors — the ONLY non-greyscale colors in the UI.
// See docs/design-system.md §2. Don't introduce new accent hexes elsewhere;
// add them here so the palette stays consistent.
export const ACCENTS = {
  /** "Your current pick" — selected answers, and inline emphasis in display headings. */
  selection: '#2563EB',
  /** Correct answer. */
  success: '#16A34A',
  /** Wrong / try again. */
  error: '#DC2626',
  /** Neutral answer reveal. */
  revealInk: '#1a1c1c',
} as const;
