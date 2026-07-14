import { StyleSheet, View } from 'react-native';

import { radius } from '@/theme';

type Props = {
  color: string;
  /** Relative bar heights (0..1). */
  bars?: number[];
  height?: number;
};

/**
 * A tiny decorative bar motif used in the top corner of metric cards to echo
 * the Apple Health "trend" glyph. Purely ornamental.
 */
export function MiniBars({ color, bars = [0.4, 0.7, 0.5, 1, 0.65], height = 22 }: Props) {
  return (
    <View style={[styles.row, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {bars.map((value, index) => (
        <View
          key={index}
          style={{
            width: 3,
            height: Math.max(4, value * height),
            borderRadius: radius.pill,
            backgroundColor: color,
            opacity: 0.5 + value * 0.4,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
});
