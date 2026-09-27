import { forwardRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Redirect, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components';
import { useAppState } from '@/state';
import { liveMode } from '@/live/mode';
import { colors, shadows } from '@/theme';
import type { FeatherIconName } from '@/types';
const destinations: { name: string; href: Href; label: string; icon: FeatherIconName }[] = [
  { name: 'home', href: '/', label: 'Today', icon: 'sun' },
  { name: 'family', href: '/family', label: 'Family', icon: 'users' },
  { name: 'health', href: '/health', label: 'Health', icon: 'heart' },
  { name: 'care', href: '/care', label: 'Care', icon: 'search' },
  { name: 'ai', href: '/ai', label: 'Ask Circle', icon: 'message-circle' },
  { name: 'settings', href: '/settings', label: 'Settings', icon: 'settings' },
];
const symbols: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  sun: ['sunny-outline', 'sunny'], users: ['people-outline', 'people'], heart: ['heart-outline', 'heart'],
  search: ['search-outline', 'search'], 'message-circle': ['chatbubble-ellipses-outline', 'chatbubble-ellipses'],
  settings: ['settings-outline', 'settings'], calendar: ['calendar-outline', 'calendar'],
};
const TabButton = forwardRef<View, TabTriggerSlotProps & { label: string; icon: FeatherIconName; simple: boolean }>(function TabButton({ isFocused, label, icon, simple, ...props }, ref) {
  const color = isFocused ? colors.blue : colors.textSecondary;
  return <Pressable ref={ref} {...props} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: !!isFocused }} aria-selected={!!isFocused} style={[styles.item, isFocused && styles.active]}>
    <Ionicons name={symbols[icon][isFocused ? 1 : 0]} size={simple ? 27 : 24} color={color} />
    <Text variant={simple ? 'subhead' : 'caption'} color={color} align="center" style={{ fontWeight: isFocused ? '600' : '500' }}>{label}</Text>
  </Pressable>;
});
export default function TabsLayout() {
  const { activeAccountId, hasStarted } = useAppState();
  const insets = useSafeAreaInsets();
  if (liveMode) return <Redirect href="/beta" />;
  if (!hasStarted) return <Redirect href="/onboarding" />;
  if (activeAccountId === 'practitioner') return <Redirect href="/practice" />;
  const simple = activeAccountId === 'savita';
  const names = simple ? ['home', 'ai', 'care'] : activeAccountId === 'riya' ? ['home', 'health', 'care', 'ai'] : ['home', 'family', 'health', 'care', 'ai'];
  // Register secondary routes too, without using primary navigation space.
  const sorted = [...destinations].sort((a, b) => (names.indexOf(a.name) < 0 ? 99 : names.indexOf(a.name)) - (names.indexOf(b.name) < 0 ? 99 : names.indexOf(b.name)));
  return <Tabs key={activeAccountId} style={styles.root}>
    <TabSlot style={styles.slot} />
    <TabList style={[styles.bar, { marginBottom: Math.max(insets.bottom, 12) }]}>
      {sorted.map((tab) => <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
        {names.includes(tab.name) ? <TabButton label={tab.name === 'care' ? simple ? 'My care' : activeAccountId === 'riya' ? 'Find care' : 'Care' : tab.name === 'health' && activeAccountId === 'riya' ? 'My health' : tab.label} icon={simple && tab.name === 'care' ? 'calendar' : tab.icon} simple={simple} /> : <Pressable style={{ display: 'none' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />}
      </TabTrigger>)}
    </TabList>
  </Tabs>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background }, slot: { flex: 1 },
  bar: { flexDirection: 'row', width: '94%', maxWidth: 728, alignSelf: 'center', backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: 5, borderRadius: 38, marginTop: 6, ...shadows.md },
  item: { flex: 1, minWidth: 0, minHeight: 58, paddingVertical: 5, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 30 },
  active: { backgroundColor: colors.blueTint },
});
