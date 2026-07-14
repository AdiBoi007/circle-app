import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

type Props = {
  children: ReactNode;
  /** Diameter in px. */
  size?: number;
  /** Chip background. Defaults to a soft translucent white that reads on any pastel. */
  background?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * A small circular container that holds a thin line icon. Used on cards and
 * list rows to give icons a soft, consistent home rather than floating loose.
 */
export function IconChip({ children, size = 40, background = colors.surface, style }: Props) {
  return (
    <View
      style={[
        styles.chip,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
