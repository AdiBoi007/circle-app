import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/theme';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle['textAlign'];
};

/**
 * The single typographic primitive. Every piece of text in the app renders
 * through this so the type ramp, color and dynamic-type behaviour stay
 * consistent. Text supports scaling to 200% for WCAG AA compatibility.
 */
export function Text({
  variant = 'body',
  color = colors.textPrimary,
  align,
  style,
  maxFontSizeMultiplier = 2,
  ...rest
}: TextProps) {
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[typography[variant], { color }, align ? { textAlign: align } : null, style]}
      {...rest}
    />
  );
}
