import { View, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { colors, spacing } from '@/theme';

import { CircleMark } from './CircleMark';

type Variant = 'compact' | 'default' | 'splash';
type Tone = 'dark' | 'light';

export type CircleWordmarkProps = {
  /** compact = app header, default = general, splash = launch/onboarding hero. */
  variant?: Variant;
  /** dark = near-black on warm light backgrounds; light = reversed on dark. */
  tone?: Tone;
  style?: ViewStyle;
};

const SIZES: Record<Variant, { mark: number; title: 'title3' | 'title2' | 'title1'; stroke: number }> = {
  compact: { mark: 30, title: 'title3', stroke: 2 },
  default: { mark: 40, title: 'title2', stroke: 2 },
  splash: { mark: 92, title: 'title1', stroke: 1.6 },
};

/**
 * The lockup: botanical mark + "Circle" / "by Swasth". Used in the app header
 * (compact), onboarding and splash (splash), and empty states (default).
 * `tone="light"` gives the reversed treatment for dark surfaces.
 */
export function CircleWordmark({ variant = 'default', tone = 'dark', style }: CircleWordmarkProps) {
  const s = SIZES[variant];
  const markColor = tone === 'light' ? colors.onInk : colors.textPrimary;
  const titleColor = tone === 'light' ? colors.onInk : colors.textPrimary;
  const subColor = tone === 'light' ? colors.onInkMuted : colors.textSecondary;

  if (variant === 'splash') {
    return (
      <View style={[{ alignItems: 'center', gap: spacing.lg }, style]}>
        <CircleMark size={s.mark} color={markColor} strokeWidth={s.stroke} />
        <View style={{ alignItems: 'center', gap: spacing.xxs }}>
          <Text variant={s.title} color={titleColor}>
            Circle
          </Text>
          <Text variant="overline" color={subColor}>
            BY SWASTH
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }, style]}>
      <CircleMark size={s.mark} color={markColor} strokeWidth={s.stroke} />
      <View>
        <Text variant={s.title} color={titleColor}>
          Circle
        </Text>
        <Text variant="caption" color={subColor} style={{ marginTop: -2 }}>
          by Swasth
        </Text>
      </View>
    </View>
  );
}
