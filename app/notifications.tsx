import { useState } from 'react';
import { Feather as FeatherBase } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonalText } from '@/accounts/savita/PersonalText';
import { Card, DetailHeader, IconChip, Segmented, Text as CircleText } from '@/components';
import { family } from '@/data';
import { useAppState } from '@/state';
import { accents, colors, screenPadding, spacing } from '@/theme';
import type { Href } from 'expo-router';

function Feather({ name, size, color }: { name: string; size?: number; color?: string }) {
  const resolved = (name === 'bell-ring' ? 'bell' : name) as keyof typeof FeatherBase.glyphMap;
  return <FeatherBase name={resolved} size={size} color={color} />;
}

export default function NotificationsScreen() {
  const { activeAccountId, notifications, markAllRead, markNotification } = useAppState();
  const personal = activeAccountId === 'savita';
  const Text = personal ? PersonalText : CircleText;
  const [filter, setFilter] = useState('All');
  const filters = ['All', ...family.map((member) => member.name.split(' ')[0]!)] as const;
  const visible = notifications.filter((item) => personal ? item.memberId === 'savita' : filter === 'All' || family.find((member) => member.id === item.memberId)?.name.startsWith(filter));
  const readVisible = () => personal ? visible.forEach((item) => markNotification(item.id)) : markAllRead();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><DetailHeader title="Notifications" actionLabel="Read all" onAction={readVisible} /></View>
      {!personal ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><Segmented options={filters} value={filter as typeof filters[number]} onChange={setFilter} /></ScrollView> : null}
      <ScrollView contentContainerStyle={styles.content}>
        {(['Today', 'Earlier'] as const).map((group) => (
          <View key={group} style={styles.group}>
            <Text variant="title3">{group}</Text>
            {visible.filter((item) => item.group === group).map((item) => (
              <Card key={item.id} onPress={() => { markNotification(item.id); router.push(item.href as Href); }} style={!item.read ? styles.unread : undefined} elevation="sm">
                <View style={styles.row}>
                  <IconChip size={48} background={!item.read ? accents.blue.tint : colors.surfaceMuted}><Feather name={item.read ? 'bell' : 'bell-ring'} size={20} color={!item.read ? colors.blue : colors.textSecondary} /></IconChip>
                  <View style={styles.copy}>
                    <View style={styles.titleRow}><Text variant="headline" style={styles.copy}>{item.title}</Text><Text variant={personal ? 'subhead' : 'caption'} color={colors.textSecondary}>{item.time}</Text></View>
                    <Text variant={personal ? 'body' : 'footnote'} color={colors.textSecondary} style={personal ? styles.personalText : undefined}>{item.body}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: screenPadding },
  filters: { paddingHorizontal: screenPadding, paddingVertical: spacing.md },
  content: { paddingHorizontal: screenPadding, paddingBottom: spacing.giant, gap: spacing.xxxl },
  group: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.blue },
  personalText: { fontSize: 18, lineHeight: 26 },
});
