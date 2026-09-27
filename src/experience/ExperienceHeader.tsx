import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AccountSection } from '@/components/AccountSection';
import { Text } from '@/components';
import { useAppState } from '@/state';
import { colors } from '@/theme';

export function ExperienceHeader({ title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  const { activeAccountId, notifications } = useAppState();
  const { fontScale } = useWindowDimensions();
  const unread = notifications.filter((item) => !item.read && (activeAccountId === 'arjun' || item.memberId === 'savita')).length;
  const simple = activeAccountId === 'savita';
  return <View style={styles.root}>
    <View style={[styles.titleRow, fontScale > 1.25 && styles.stacked]}>
      <Text variant="largeTitle" accessibilityRole="header" style={styles.title}>{title.replace(/\.$/, '')}</Text>
      <AccountSection compact />
    </View>
    {(subtitle || simple || activeAccountId !== 'riya') && <View style={styles.subtitleRow}>
      <View style={styles.copy}>{subtitle && <Text variant="callout" color={colors.textSecondary}>{subtitle}</Text>}{simple && <Text variant="footnote" color={colors.textSecondary}>Demo day · 13 July 2026</Text>}</View>
      {activeAccountId !== 'riya' && <Pressable accessibilityRole="button" accessibilityLabel={`Notifications, ${unread} unread`} onPress={() => router.push('/notifications')} style={styles.bell}><Feather name="bell" size={20} color={colors.blue} />{unread > 0 && <View style={styles.dot} />}</Pressable>}
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  root: { gap: 2, paddingTop: 20, paddingBottom: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stacked: { flexDirection: 'column-reverse', alignItems: 'flex-start' },
  title: { flex: 1, flexShrink: 1, letterSpacing: -0.7 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 },
  copy: { flex: 1, gap: 4 },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.red, borderWidth: 1, borderColor: colors.background, position: 'absolute', top: 9, right: 11 },
});
