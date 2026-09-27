import type { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text as CircleText } from '@/components/Text';
import { PersonalText } from '@/accounts/savita/PersonalText';
import { useAppState } from '@/state';
import { Avatar } from '@/components/Avatar';
import { hasProfilePictureFor } from '@/data/profilePictures';
import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Leading element, typically an <IconChip>. */
  leading?: ReactNode;
  /** Custom trailing element; overrides `value`/chevron. */
  trailing?: ReactNode;
  /** Trailing value text shown before the chevron. */
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A single row for settings / list layouts: leading icon chip, a title +
 * optional subtitle, and a trailing value or chevron. Interactive when
 * `onPress` is provided.
 */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  value,
  onPress,
  showChevron,
  destructive = false,
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props) {
  const withChevron = showChevron ?? Boolean(onPress);
  const { activeAccountId } = useAppState();
  const Text = activeAccountId === 'savita' ? PersonalText : CircleText;

  const body = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : hasProfilePictureFor(title) ? <View style={styles.leading}><Avatar name={title} size={42} /></View> : null}
      <View style={styles.textBlock}>
        <Text variant="headline" color={destructive ? colors.red : colors.textPrimary}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color={colors.textSecondary}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.trailing}>
        {trailing ??
          (value ? (
            <Text variant="subhead" color={colors.textSecondary}>
              {value}
            </Text>
          ) : null)}
        {withChevron ? (
          <Feather name="chevron-right" size={20} color={colors.textTertiary} />
        ) : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={[styles.row, style]}>{body}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  leading: {
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  trailing: {
    flexShrink: 1,
    maxWidth: '40%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.55,
  },
});
