import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadows, spacing, type RadiusToken, type ShadowToken } from '@/theme';

type Props = {
  children: ReactNode;
  padding?: number;
  radiusToken?: RadiusToken;
  elevation?: ShadowToken;
  background?: string;
  bordered?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The primary content surface: thick rounded corners, warm fill, soft shadow
 * and (deliberately) no border by default. Pass `onPress` to make it an
 * interactive card with gentle press feedback.
 */
export function Card({
  children,
  padding = spacing.xxl,
  radiusToken = 'card',
  elevation = 'none',
  background = colors.surface,
  bordered = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props) {
  const base: StyleProp<ViewStyle> = [
    styles.card,
    shadows[elevation],
    {
      padding,
      borderRadius: radius[radiusToken],
      backgroundColor: background,
    },
    bordered && styles.bordered,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [base, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.76,
  },
});
