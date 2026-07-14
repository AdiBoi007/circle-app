import { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PersonalText } from '@/accounts/savita/PersonalText';
import { Button, DetailHeader, IconChip, ScreenContainer, StatusPill, Text as CircleText } from '@/components';
import type { TextProps } from '@/components/Text';
import { family } from '@/data';
import { useAppState } from '@/state';
import { accents, colors, radius, shadows, spacing } from '@/theme';
import type { FeatherIconName, HealthRecord } from '@/types';

const categories = ['All', 'Lab report', 'Prescription', 'Consultation', 'Imaging', 'Vaccination'];
const groups = ['July 2026', 'June 2026', 'May 2026', 'Earlier'] as const;

const categoryIcon: Record<HealthRecord['category'], FeatherIconName> = {
  'Lab report': 'bar-chart-2',
  Prescription: 'file-text',
  Consultation: 'message-square',
  Imaging: 'image',
  Vaccination: 'shield',
};

export default function RecordsScreen() {
  const { activeAccountId, records } = useAppState();
  const personal = activeAccountId === 'savita';
  const [query, setQuery] = useState('');
  const [member, setMember] = useState(personal ? 'savita' : 'all');
  const [category, setCategory] = useState('All');
  const [newest, setNewest] = useState(true);

  const visible = useMemo(() => records
    .filter((record) =>
      (personal ? record.memberId === 'savita' : member === 'all' || record.memberId === member) &&
      (category === 'All' || record.category === category) &&
      `${record.title} ${record.note}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => newest ? dateValue(b.date) - dateValue(a.date) : dateValue(a.date) - dateValue(b.date)),
  [records, personal, member, category, query, newest]);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <DetailHeader title={personal ? 'My records' : 'Family record vault'} actionLabel="Upload" onAction={() => router.push(personal ? '/savita-upload' : '/quick-add/upload')} />
      <View style={styles.search}>
        <Feather name="search" size={18} color={colors.textSecondary} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search records" placeholderTextColor={colors.textTertiary} style={styles.input} />
      </View>
      {!personal ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[{ id: 'all', name: 'Everyone' }, ...family].map((item) => (
          <Chip key={item.id} label={item.name.split(' ')[0]!} active={member === item.id} onPress={() => setMember(item.id)} />
        ))}
      </ScrollView> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {categories.map((item) => <Chip key={item} label={item} active={category === item} onPress={() => setCategory(item)} />)}
      </ScrollView>
      <View style={styles.sort}>
        <Text variant="footnote" color={colors.textSecondary}>{visible.length} records</Text>
        <Pressable onPress={() => setNewest((value) => !value)}>
          <Text variant="footnote" color={colors.blue}>{newest ? 'Newest first' : 'Oldest first'}</Text>
        </Pressable>
      </View>

      <View style={styles.timeline}>
        {groups.map((group) => {
          const items = visible.filter((record) => groupFor(record.date) === group);
          if (!items.length) return null;
          return (
            <View key={group} style={styles.group}>
              <Text variant="overline" color={colors.textSecondary}>{group}</Text>
              <View style={styles.groupCard}>
                {items.map((record, index) => (
                  <View key={record.id}>
                    {index ? <View style={styles.divider} /> : null}
                    <RecordRow record={record} />
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
      <Button title="Upload new record" onPress={() => router.push(personal ? '/savita-upload' : '/quick-add/upload')} />
    </ScreenContainer>
  );
}

function Text(props: TextProps) {
  const { activeAccountId } = useAppState();
  return activeAccountId === 'savita' ? <PersonalText {...props} /> : <CircleText {...props} />;
}

function RecordRow({ record }: { record: HealthRecord }) {
  const person = family.find((item) => item.id === record.memberId)!;
  return (
    <Pressable onPress={() => router.push(`/record/${record.id}`)} accessibilityRole="button" accessibilityLabel={`Open ${record.title}`} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <IconChip size={42} background={accents[person.accent].tint}>
        <Feather name={categoryIcon[record.category]} size={18} color={accents[person.accent].solid} />
      </IconChip>
      <View style={styles.copy}>
        <Text variant="headline" numberOfLines={1}>{record.title}</Text>
        <Text variant="footnote" color={colors.textSecondary}>{person.name.split(' ')[0]} · {record.date}</Text>
      </View>
      <View style={styles.trailing}>
        {record.status === 'Processing' ? (
          <StatusPill label="Processing" accent="amber" />
        ) : (
          <Text variant="caption" color={colors.textSecondary}>{record.values.length} {record.values.length === 1 ? 'value' : 'values'}</Text>
        )}
        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.chip, active && styles.chipActive]}>
      <Text variant="subhead" color={active ? colors.white : colors.textSecondary}>{label}</Text>
    </Pressable>
  );
}

function dateValue(date: string): number {
  return new Date(date).getTime() || 0;
}

function groupFor(date: string): typeof groups[number] {
  if (date.includes('July 2026')) return 'July 2026';
  if (date.includes('June 2026')) return 'June 2026';
  if (date.includes('May 2026')) return 'May 2026';
  return 'Earlier';
}

const styles = StyleSheet.create({
  search: { height: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, paddingHorizontal: spacing.lg, borderRadius: radius.input, marginTop: spacing.lg },
  input: { flex: 1, fontSize: 18, color: colors.textPrimary },
  chips: { gap: spacing.sm, paddingVertical: spacing.md, paddingRight: spacing.xl },
  chip: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.pill },
  chipActive: { backgroundColor: colors.textPrimary },
  sort: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.sm },
  timeline: { gap: spacing.xxl, marginBottom: spacing.xxl },
  group: { gap: spacing.sm },
  groupCard: { backgroundColor: colors.surface, borderRadius: 22, overflow: 'hidden', ...shadows.sm },
  row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.lg + 42 + spacing.md },
  copy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pressed: { opacity: 0.65 },
});
