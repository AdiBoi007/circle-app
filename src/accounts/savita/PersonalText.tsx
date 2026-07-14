import { Text as CircleText, type TextProps } from '@/components/Text';
import { useAppState } from '@/state';
import { colors, typography } from '@/theme';

export function PersonalText({ variant = 'body', style, color, ...props }: TextProps) {
  const { personalPreferences } = useAppState();
  const token = typography[variant];
  const larger = personalPreferences.largerText
    ? { fontSize: Math.max(18, Math.round(token.fontSize * 1.1)), lineHeight: Math.max(25, Math.round(token.lineHeight * 1.1)) }
    : undefined;
  const resolvedColor = personalPreferences.highContrast && (color === colors.textSecondary || color === colors.textTertiary)
    ? colors.textPrimary
    : color;
  return <CircleText variant={variant} color={resolvedColor} style={[style, larger]} {...props} />;
}
