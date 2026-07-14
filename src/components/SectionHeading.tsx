import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/Text';
import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  eyebrow?: string;
  /** Optional trailing text action (e.g. "See all"). */
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

/**
 * A consistent section header: optional uppercase eyebrow, a strong title and
 * an optional quiet trailing action.
 */
export function SectionHeading({ title, eyebrow, action, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.titles}>
        {eyebrow ? (
          <Text variant="overline" color={colors.textSecondary}>
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="title3">{title}</Text>
      </View>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text variant="subhead" color={colors.blue}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titles: {
    gap: spacing.xxs,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
