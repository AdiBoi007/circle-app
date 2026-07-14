import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import { colors, radius, spacing } from '@/theme';

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return <View style={styles.wrap} accessibilityRole="tablist">{options.map((option) => <Pressable key={option} onPress={() => onChange(option)} accessibilityRole="tab" accessibilityState={{ selected: value === option }} accessibilityLabel={option} style={[styles.item, value === option && styles.active]}><Text variant="caption" color={value === option ? colors.white : colors.textSecondary}>{option}</Text></Pressable>)}</View>;
}
const styles = StyleSheet.create({ wrap: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, padding: 3, borderRadius: radius.pill }, item: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.pill }, active: { backgroundColor: colors.textPrimary } });
