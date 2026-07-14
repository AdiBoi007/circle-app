import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { accents, colors, radius, type AccentName } from '@/theme';

type Props = {
  /** 0..1 */
  progress: number;
  accent?: AccentName;
  height?: number;
  trackColor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** A rounded progress track with an accent fill. */
export function ProgressBar({
  progress,
  accent = 'sage',
  height = 10,
  trackColor = colors.surfaceMuted,
  accessibilityLabel,
  style,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const fill = accents[accent].solid;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[
        styles.track,
        { height, borderRadius: radius.pill, backgroundColor: trackColor },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: fill,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
