import { Platform, type TextStyle } from 'react-native';

/**
 * Typography tokens modelled on Apple's type ramp: large, bold headings with
 * compact (slightly negative) letter spacing and highly legible body sizes.
 *
 * We use the platform system font (San Francisco on iOS, Roboto on Android)
 * to keep the bundle lean and the rendering native-feeling. No custom fonts
 * are loaded in this phase.
 */

const systemFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

const systemFontMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'System',
});

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const satisfies Record<string, TextStyle['fontWeight']>;

type Variant = {
  fontSize: number;
  lineHeight: number;
  fontWeight: TextStyle['fontWeight'];
  letterSpacing: number;
  fontFamily: string;
};

export const typography = {
  /** Screen hero heading — "Good afternoon, Arjun". */
  largeTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.6,
    fontFamily: systemFontMedium,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
    fontFamily: systemFontMedium,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.4,
    fontFamily: systemFontMedium,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.3,
    fontFamily: systemFontMedium,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.2,
    fontFamily: systemFontMedium,
  },
  body: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: fontWeight.regular,
    letterSpacing: -0.2,
    fontFamily: systemFont,
  },
  callout: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeight.regular,
    letterSpacing: -0.1,
    fontFamily: systemFont,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
    letterSpacing: -0.1,
    fontFamily: systemFont,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeight.regular,
    letterSpacing: 0,
    fontFamily: systemFont,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.1,
    fontFamily: systemFont,
  },
  /** All-caps eyebrow label above section headings. */
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.8,
    fontFamily: systemFontMedium,
  },
} as const satisfies Record<string, Variant>;

export type TypographyVariant = keyof typeof typography;
