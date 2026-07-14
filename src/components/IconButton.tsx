import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, shadows, type ShadowToken } from '@/theme';

type Props = {
  children: ReactNode;
  /** Required — icon-only controls must announce their purpose. */
  accessibilityLabel: string;
  onPress?: () => void;
  size?: number;
  background?: string;
  elevation?: ShadowToken;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A circular icon-only button. Enforces an accessible label and a comfortable
 * (>=44pt) touch target regardless of the visual size.
 */
export function IconButton({
  children,
  accessibilityLabel,
  onPress,
  size = 44,
  background = colors.surface,
  elevation = 'sm',
  disabled = false,
  accessibilityHint,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      style={({ pressed }) => [
        styles.base,
        shadows[elevation],
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
