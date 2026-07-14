import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { accents, radius, spacing, type AccentName } from '@/theme';

type Variant = 'soft' | 'solid';

type Props = {
  label: string;
  accent?: AccentName;
  variant?: Variant;
  /** Optional leading icon; otherwise a small status dot is shown on soft pills. */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * A fully-rounded status pill. Status is always carried by the text label (and
 * an icon/dot), never by color alone — colour only reinforces meaning.
 */
export function StatusPill({ label, accent = 'neutral', variant = 'soft', icon, style }: Props) {
  const a = accents[accent];
  const isSolid = variant === 'solid';
  const fg = isSolid ? a.on : accent === 'neutral' ? accents.neutral.solid : a.solid;

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: isSolid ? a.solid : a.tint },
        style,
      ]}
    >
      {icon ?? (!isSolid && <View style={[styles.dot, { backgroundColor: a.solid }]} />)}
      <Text variant="caption" color={fg}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },
});
