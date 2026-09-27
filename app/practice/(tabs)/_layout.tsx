import { forwardRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountSection, Text } from '@/components';
import { useAppState } from '@/state';
import { colors, shadows } from '@/theme';

type PracticeTab = { label: string; name: string; href: '/practice' | '/practice/requests' | '/practice/availability' | '/practice/profile'; icon: keyof typeof Ionicons.glyphMap; selectedIcon: keyof typeof Ionicons.glyphMap };
const tabs: PracticeTab[] = [
  { name: 'practice-home', href: '/practice', label: 'Today', icon: 'sunny-outline', selectedIcon: 'sunny' },
  { name: 'practice-requests', href: '/practice/requests', label: 'Requests', icon: 'file-tray-outline', selectedIcon: 'file-tray' },
  { name: 'practice-availability', href: '/practice/availability', label: 'Schedule', icon: 'calendar-outline', selectedIcon: 'calendar' },
  { name: 'practice-profile', href: '/practice/profile', label: 'My practice', icon: 'person-circle-outline', selectedIcon: 'person-circle' },
];
const PracticeTabButton = forwardRef<View, TabTriggerSlotProps & { tab: PracticeTab; count?: number }>(function PracticeTabButton({ isFocused, tab, count, ...props }, ref) {
  const color = isFocused ? colors.blue : colors.textSecondary;
  return <Pressable {...props} ref={ref} accessibilityRole="tab" accessibilityLabel={`${tab.label}${count ? `, ${count} pending` : ''}`} accessibilityState={{ selected: !!isFocused }} aria-selected={!!isFocused} style={[styles.tab, isFocused && styles.selected]}>
    <View><Ionicons name={isFocused ? tab.selectedIcon : tab.icon} color={color} size={25} />{Boolean(count) && <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>}</View>
    <Text variant="caption" color={color} align="center" style={{ fontWeight: isFocused ? '600' : '500' }}>{tab.label}</Text>
  </Pressable>;
});
export default function PracticeTabs() {
  const insets = useSafeAreaInsets();
  const { practice } = useAppState();
  const pending = practice.requests.filter((item) => item.status === 'Requested').length;
  return <Tabs style={styles.root}>
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}><Text variant="footnote" color={colors.textSecondary} style={styles.label}>Circle for practitioners</Text><AccountSection compact /></View>
    <TabSlot style={styles.content} />
    <TabList style={[styles.bar, { marginBottom: Math.max(insets.bottom, 12) }]}>{tabs.map((tab) => <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild><PracticeTabButton tab={tab} count={tab.name === 'practice-requests' ? pending : undefined} /></TabTrigger>)}</TabList>
  </Tabs>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, content: { flex: 1 },
  header: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, label: { flex: 1 },
  bar: { flexDirection: 'row', width: '94%', maxWidth: 728, alignSelf: 'center', padding: 5, borderRadius: 38, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, marginTop: 6, ...shadows.md },
  tab: { flex: 1, minWidth: 0, minHeight: 58, paddingHorizontal: 2, paddingVertical: 5, borderRadius: 30, alignItems: 'center', justifyContent: 'center', gap: 3 }, selected: { backgroundColor: colors.blueTint },
  badge: { position: 'absolute', right: -9, top: -5, minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: 9, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, lineHeight: 15, fontWeight: '700', color: colors.white },
});
