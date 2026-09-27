import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { colors, spacing, shadows } from '@/theme';

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return <View style={styles.wrap} accessibilityRole="tablist">{options.map((option) => <Pressable key={option} onPress={() => onChange(option)} accessibilityRole="tab" accessibilityState={{ selected: value === option }} accessibilityLabel={option} style={[styles.item, value === option && styles.active]}><Text variant="subhead" color={colors.textPrimary} style={{ fontWeight: value === option ? '600' : '400' }}>{option}</Text></Pressable>)}</View>;
}
const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, padding: 3, borderRadius: 12 },
  item: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 9 },
  active: { backgroundColor: colors.surface, ...shadows.sm },
});
