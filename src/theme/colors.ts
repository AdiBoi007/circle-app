/**
 * Circle color tokens.
 *
 * A warm off-white, grouped palette with clear semantic accents. Every accent carries a
 * semantic meaning and ships with a soft tint used for pill/label surfaces
 * so we never rely on the raw accent as a large fill.
 */

export const palette = {
  // Neutrals
  background: '#F6F1E8',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EADF',
  textPrimary: '#1C1C1E',
  // Muted text stays AA-compliant on Circle's light surfaces.
  textSecondary: '#636366',
  textTertiary: '#6C6C70',
  border: '#E8E1D6',
  borderStrong: '#DCD3C4',

  // Accents
  // Semantic colours meet AA on light surfaces and behind white labels.
  blue: '#0066CC',
  sage: '#248A3D',
  amber: '#9C5700',
  plum: '#8944AB',
  red: '#C93445',

  // Soft accent tints (for pill backgrounds, subtle fills)
  blueTint: '#E8F2FF',
  sageTint: '#EAF6ED',
  amberTint: '#FFF3DF',
  plumTint: '#F3ECF8',
  redTint: '#FFF0F2',

  // Fixed
  white: '#FFFFFF',
  black: '#1C1C1E',
  overlay: 'rgba(0, 0, 0, 0.24)',
  scrim: 'rgba(0, 0, 0, 0.32)',

  // Dark surface used for the Circle AI composer (premium, focused)
  ink: '#1C1C1E',
  inkMuted: '#3A3A3C',
  onInk: '#FFFDF8',
  onInkMuted: '#D1D1D6',
} as const;

/** Semantic accent groupings: a strong color + its soft tint + on-color text. */
export const accents = {
  blue: { solid: palette.blue, tint: palette.blueTint, on: palette.white },
  sage: { solid: palette.sage, tint: palette.sageTint, on: palette.white },
  amber: { solid: palette.amber, tint: palette.amberTint, on: palette.white },
  plum: { solid: palette.plum, tint: palette.plumTint, on: palette.white },
  red: { solid: palette.red, tint: palette.redTint, on: palette.white },
  neutral: {
    solid: palette.textPrimary,
    tint: palette.surfaceMuted,
    on: palette.white,
  },
} as const;

export type AccentName = keyof typeof accents;

/**
 * Soft pastel card surfaces for the Home bento layout. Each ships a two-stop
 * gradient (very subtle, for depth only), a translucent circular icon-chip
 * background, and a muted line color for decorative glyphs. Text on these
 * surfaces always stays near-black for contrast.
 */
export const pastels = {
  lavender: {
    gradient: ['#F5F0FA', '#EDE5F5'] as const,
    chip: 'rgba(255, 255, 255, 0.62)',
    line: '#9D8FBE',
  },
  blue: {
    gradient: ['#EEF5FF', '#E3EFFF'] as const,
    chip: 'rgba(255, 255, 255, 0.62)',
    line: '#8FA9CF',
  },
  mint: {
    gradient: ['#EEF8F0', '#E3F2E7'] as const,
    chip: 'rgba(255, 255, 255, 0.62)',
    line: '#93BBA1',
  },
  peach: {
    gradient: ['#FFF4EA', '#FFEADA'] as const,
    chip: 'rgba(255, 255, 255, 0.6)',
    line: '#D0A583',
  },
  cream: {
    gradient: ['#FFFFFF', '#F6F1E8'] as const,
    chip: 'rgba(255, 255, 255, 0.7)',
    line: '#C7BFB1',
  },
} as const;

export type PastelName = keyof typeof pastels;

export const colors = palette;
