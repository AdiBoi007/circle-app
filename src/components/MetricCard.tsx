import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconChip } from '@/components/IconChip';
import { MiniBars } from '@/components/MiniBars';
import { Text } from '@/components/Text';
import { colors, pastels, radius, shadows, spacing, type PastelName } from '@/theme';

type Props = {
  label: string;
  value: string;
  caption?: string;
  pastel?: PastelName;
  /** Thin line icon element for the chip. */
  icon: ReactNode;
  /** Show the decorative trend bars in the top corner. */
  showTrend?: boolean;
  /** Tighter dashboard treatment for two-column overview grids. */
  compact?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A pastel bento metric card: soft two-stop gradient for depth, a line icon in
 * a circular chip, a large value and tiny supporting labels. The heart of the
 * Home dashboard's Apple-Health-style hierarchy.
 */
export function MetricCard({
  label,
  value,
  caption,
  pastel = 'lavender',
  icon,
  showTrend = true,
  compact = false,
  onPress,
  accessibilityHint,
  style,
}: Props) {
  const tone = pastels[pastel];
  const a11yLabel = `${label}, ${value}${caption ? `, ${caption}` : ''}`;

  const content = (
    <LinearGradient
      colors={tone.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, compact && styles.gradientCompact]}
    >
      <View style={styles.top}>
        <IconChip size={compact ? 34 : 40} background={tone.chip}>
          {icon}
        </IconChip>
        {showTrend ? <MiniBars color={tone.line} height={compact ? 18 : 22} /> : null}
      </View>

      <View style={[styles.bottom, compact && styles.bottomCompact]}>
        <Text variant={compact ? 'caption' : 'subhead'} color={colors.textSecondary} numberOfLines={1}>
          {label}
        </Text>
        <Text variant={compact ? 'title3' : 'title1'} numberOfLines={1}>{value}</Text>
        {caption ? (
          <Text variant="footnote" color={colors.textSecondary} numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
    </LinearGradient>
  );

  const wrapperStyle: StyleProp<ViewStyle> = [
    styles.wrapper,
    shadows.sm,
    { backgroundColor: tone.gradient[0] },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [wrapperStyle, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={wrapperStyle} accessibilityLabel={a11yLabel}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
    gap: spacing.xxl,
    minHeight: 156,
  },
  gradientCompact: {
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 124,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bottom: {
    gap: 2,
  },
  bottomCompact: {
    minWidth: 0,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
});
