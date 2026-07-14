/**
 * Circle design tokens — the single source of truth for the visual system.
 *
 * Usage:
 *   import { theme } from '@/theme';
 *   ...backgroundColor: theme.colors.surface
 *
 * A static token object (rather than context) keeps state minimal for this
 * phase. The app ships a single warm light appearance.
 */

import { accents, colors, pastels } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { screenPadding, spacing } from './spacing';
import { fontWeight, typography } from './typography';

export const theme = {
  colors,
  accents,
  pastels,
  spacing,
  screenPadding,
  radius,
  shadows,
  typography,
  fontWeight,
} as const;

export type Theme = typeof theme;

export { accents, colors, palette, pastels } from './colors';
export { radius } from './radius';
export { shadows } from './shadows';
export { screenPadding, spacing } from './spacing';
export { fontWeight, typography } from './typography';

export type { AccentName, PastelName } from './colors';
export type { RadiusToken } from './radius';
export type { ShadowToken } from './shadows';
export type { SpacingToken } from './spacing';
export type { TypographyVariant } from './typography';
