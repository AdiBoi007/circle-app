import Svg, { Line, Path } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { colors, spacing } from '@/theme';

export function TrendChart({ values, labels }: { values: number[]; labels: string[] }) {
  const width = 320; const height = 130; const pad = 12;
  const min = Math.min(...values); const max = Math.max(...values); const range = Math.max(1, max - min);
  const points = values.map((value, i) => ({ x: pad + i * ((width - pad * 2) / Math.max(1, values.length - 1)), y: pad + (max - value) / range * (height - pad * 2) }));
  const d = points.map((point, i) => `${i ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  return <View><Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Line x1={pad} y1={height / 2} x2={width - pad} y2={height / 2} stroke={colors.border} strokeDasharray="4 5" /><Path d={d} stroke={colors.blue} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg><View style={styles.labels}>{labels.map((label, index) => <Text key={`${label}-${index}`} variant="caption" color={colors.textTertiary}>{label}</Text>)}</View></View>;
}
const styles = StyleSheet.create({ labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs } });
