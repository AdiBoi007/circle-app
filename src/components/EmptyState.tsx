import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  description?: string;
  /** A visual — typically an <IconChip> or the <CircleMark>. */
  icon?: ReactNode;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

/** A calm, centered empty state for zero-content surfaces. */
export function EmptyState({ title, description, icon, action, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.text}>
        <Text variant="title3" align="center">
          {title}
        </Text>
        {description ? (
          <Text variant="callout" color={colors.textSecondary} align="center">
            {description}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Button title={action.label} onPress={action.onPress} fullWidth={false} size="md" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    marginBottom: spacing.xs,
  },
  text: {
    gap: spacing.sm,
    maxWidth: 320,
  },
});
