/**
 * Spacing scale on a consistent 8-point rhythm (with 4pt half-steps).
 * Use these tokens instead of raw numbers to keep vertical/horizontal
 * cadence consistent across the app.
 */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  giant: 48,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Standard horizontal screen gutter. */
export const screenPadding = spacing.xl;
