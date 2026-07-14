/**
 * Circle color tokens.
 *
 * A warm, calm, medically-trustworthy palette. Every accent carries a
 * semantic meaning and ships with a soft tint used for pill/label surfaces
 * so we never rely on the raw accent as a large fill.
 */

export const palette = {
  // Neutrals
  background: '#F6F1E8',
  surface: '#FFFDF8',
  surfaceMuted: '#F1EADF',
  textPrimary: '#171815',
  // Muted text stays AA-compliant on Circle's warm surfaces.
  textSecondary: '#62645D',
  textTertiary: '#686A63',
  border: '#E8E1D6',
  borderStrong: '#DCD3C4',

  // Accents
  // Semantic colours meet AA on light surfaces and behind white labels.
  blue: '#2463D4',
  sage: '#356C50',
  amber: '#855612',
  plum: '#73578F',
  red: '#B53E39',

  // Soft accent tints (for pill backgrounds, subtle fills)
  blueTint: '#E4EDFE',
  sageTint: '#E6EFE9',
  amberTint: '#F6ECDA',
  plumTint: '#EEE9F2',
  redTint: '#F8E5E3',

  // Fixed
  white: '#FFFFFF',
  black: '#171815',
  overlay: 'rgba(23, 24, 21, 0.35)',
  scrim: 'rgba(23, 24, 21, 0.55)',

  // Dark surface used for the Circle AI composer (premium, focused)
  ink: '#1F211C',
  inkMuted: '#33352F',
  onInk: '#F6F1E8',
  onInkMuted: '#A7A99F',
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
    gradient: ['#ECE7F6', '#E1DAF0'] as const,
    chip: 'rgba(255, 255, 255, 0.62)',
    line: '#9D8FBE',
  },
  blue: {
    gradient: ['#E3EDF9', '#D4E2F4'] as const,
    chip: 'rgba(255, 255, 255, 0.62)',
    line: '#8FA9CF',
  },
  mint: {
    gradient: ['#E3EFE8', '#D5E7DB'] as const,
    chip: 'rgba(255, 255, 255, 0.62)',
    line: '#93BBA1',
  },
  peach: {
    gradient: ['#F7E9DB', '#F2DECB'] as const,
    chip: 'rgba(255, 255, 255, 0.6)',
    line: '#D0A583',
  },
  cream: {
    gradient: ['#FFFDF8', '#F6F0E6'] as const,
    chip: 'rgba(255, 255, 255, 0.7)',
    line: '#C7BFB1',
  },
} as const;

export type PastelName = keyof typeof pastels;

export const colors = palette;
