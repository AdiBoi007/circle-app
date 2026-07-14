import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text as CircleText } from '@/components/Text';
import { PersonalText } from '@/accounts/savita/PersonalText';
import { useAppState } from '@/state';
import { colors, spacing, type TypographyVariant } from '@/theme';

type Props = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  /** Right-aligned element (e.g. a notification <IconButton>). */
  trailing?: ReactNode;
  titleVariant?: Extract<TypographyVariant, 'largeTitle' | 'title1'>;
  style?: StyleProp<ViewStyle>;
};

/**
 * The large page header shared by every tab: an uppercase eyebrow, a big bold
 * title and an optional subtitle, with room for a trailing control.
 */
export function ScreenHeader({
  title,
  eyebrow,
  subtitle,
  trailing,
  titleVariant = 'largeTitle',
  style,
}: Props) {
  const { activeAccountId } = useAppState();
  const Text = activeAccountId === 'savita' ? PersonalText : CircleText;
  return (
    <View style={style}>
      <View style={styles.topRow}>
        <View style={styles.eyebrowWrap}>
          {eyebrow ? (
            <Text variant="overline" color={colors.textSecondary}>
              {eyebrow}
            </Text>
          ) : null}
        </View>
        {trailing}
      </View>
      <Text variant={titleVariant} style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="callout" color={colors.textSecondary} style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  eyebrowWrap: {
    flexShrink: 1,
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing.xs,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
});
