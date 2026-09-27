import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Redirect, router, type Href } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ScreenContainer, Text } from '@/components';
import { individualHabits } from '@/data/individual';
import { ExperienceHeader } from '@/experience/ExperienceHeader';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';
import type { FeatherIconName } from '@/types';

type Tool = { title: string; description: string; icon: FeatherIconName; href: Href; color: string; group: string };

export default function HealthScreen() {
  const state = useAppState();
  const [query, setQuery] = useState('');
  if (state.activeAccountId === 'savita') return <Redirect href="/" />;
  const personal = state.activeAccountId === 'riya';
  const tools: Tool[] = personal ? [
    { title: 'Health records', description: 'Your documents and reports', icon: 'folder', href: '/personal/records', color: colors.blue, group: 'Health data' },
    { title: 'Sleep & movement', description: 'Sample readings and trends', icon: 'activity', href: '/personal/records?section=sleep', color: colors.plum, group: 'Health data' },
    { title: 'Appointments', description: `${state.individualBookings.filter((item) => item.status === 'Confirmed').length} booked · IST`, icon: 'calendar', href: '/personal/bookings', color: colors.red, group: 'Care' },
    { title: 'Find a practitioner', description: 'Therapy, fitness and nutrition', icon: 'search', href: '/care', color: colors.blue, group: 'Care' },
  ] : [
    { title: 'Health records', description: `${state.records.length} reports and documents`, icon: 'folder', href: '/records', color: colors.blue, group: 'Health data' },
    { title: 'Medicines', description: `${state.medications.filter((item) => !item.archived).length} active family medicines`, icon: 'plus-circle', href: '/medications', color: colors.sage, group: 'Health data' },
    { title: 'Health trends', description: 'Family readings and history', icon: 'activity', href: '/family', color: colors.red, group: 'Health data' },
    { title: 'Tasks & reminders', description: `${state.tasks.filter((item) => !item.completed).length} open tasks`, icon: 'check-square', href: '/tasks', color: colors.amber, group: 'Planning' },
    { title: 'Appointments', description: 'Visits and the family calendar', icon: 'calendar', href: '/calendar', color: colors.red, group: 'Planning' },
    { title: 'Goals', description: `${state.goals.filter((item) => item.active).length} active personal and shared goals`, icon: 'target', href: '/goals', color: colors.plum, group: 'Planning' },
    { title: 'Medical IDs', description: 'Health details and emergency contacts', icon: 'shield', href: '/emergency', color: colors.red, group: 'More information' },
    { title: 'Family insights', description: 'Changes in your family’s health', icon: 'bar-chart-2', href: '/insights', color: colors.blue, group: 'More information' },
  ];
  const matches = tools.filter((tool) => `${tool.title} ${tool.description} ${tool.group}`.toLowerCase().includes(query.toLowerCase().trim()));
  const groups = [...new Set(matches.map((tool) => tool.group))];

  return (
    <ScreenContainer bottomInset={36} contentStyle={styles.page}>
      <ExperienceHeader title={personal ? 'My Health' : 'Health'} />
      <View style={styles.search}><Feather name="search" size={20} color={colors.textSecondary} /><TextInput value={query} onChangeText={setQuery} accessibilityLabel="Search health tools" placeholder="Search health" placeholderTextColor={colors.textSecondary} returnKeyType="search" style={styles.input} />{query.length > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}><Feather name="x-circle" size={20} color={colors.textSecondary} /></Pressable> : null}</View>

      {groups.map((group) => <View key={group} style={styles.section}><Text variant="title2">{group}</Text><View style={styles.group}>{matches.filter((tool) => tool.group === group).map((tool, index) => <Pressable accessibilityRole="button" accessibilityLabel={`Open ${tool.title}. ${tool.description}.`} key={tool.title} onPress={() => router.push(tool.href)} style={({ pressed }) => [styles.tool, pressed && styles.pressed]}><View style={styles.icon}><Feather name={tool.icon} size={25} color={tool.color} /></View><View style={[styles.rowBody, index > 0 && styles.separator]}><View style={styles.copy}><Text variant="headline">{tool.title}</Text><Text variant="footnote" color={colors.textSecondary}>{tool.description}</Text></View><Feather name="chevron-right" size={17} color={colors.textTertiary} /></View></Pressable>)}</View></View>)}

      {matches.length === 0 ? <View style={styles.noResults}><Feather name="search" size={30} color={colors.textSecondary} /><Text variant="title3" align="center">No results for “{query}”</Text><Text variant="callout" color={colors.textSecondary} align="center">Try records, medicines or appointments.</Text><Pressable accessibilityRole="button" onPress={() => setQuery('')} style={styles.clearResults}><Text variant="headline" color={colors.blue}>Clear search</Text></Pressable></View> : null}

      {personal && !query ? <View style={styles.section}><View style={styles.habitHeading}><Text variant="title2" style={styles.flex}>Daily habits</Text><Text variant="subhead" color={colors.textSecondary}>{individualHabits.filter((habit) => state.completedHabitIds.includes(habit.id)).length} of {individualHabits.length}</Text></View><View style={styles.group}>{individualHabits.map((habit, index) => {
        const done = state.completedHabitIds.includes(habit.id);
        return <Pressable key={habit.id} onPress={() => state.toggleHabit(habit.id)} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={habit.title} accessibilityHint={done ? 'Marks this habit incomplete.' : 'Marks this habit complete.'} style={({ pressed }) => [styles.habit, pressed && styles.pressed]}><View style={styles.habitCheck}><Feather name={done ? 'check-circle' : 'circle'} size={26} color={done ? colors.blue : colors.textTertiary} /></View><View style={[styles.rowBody, index > 0 && styles.separator]}><View style={styles.copy}><Text variant="headline">{habit.title}</Text><Text variant="footnote" color={colors.textSecondary}>{done ? 'Completed · tap to undo' : habit.detail}</Text></View></View></Pressable>;
      })}</View></View> : null}

      <Text variant="footnote" color={colors.textSecondary} style={styles.sourceNote}>Sample health information · {personal ? 'September' : 'July'} 2026</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { gap: spacing.xxl },
  flex: { flex: 1, minWidth: 0 },
  search: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.surfaceMuted, borderRadius: 12 },
  input: { flex: 1, minWidth: 0, fontSize: 17, color: colors.textPrimary, paddingVertical: spacing.md },
  clear: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginRight: -spacing.sm },
  section: { gap: spacing.md },
  group: { backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden' },
  tool: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingLeft: spacing.lg, minHeight: 76 },
  icon: { width: 30, minHeight: 36, justifyContent: 'center', alignItems: 'center' },
  rowBody: { flex: 1, minWidth: 0, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingRight: spacing.lg, paddingVertical: spacing.lg },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  copy: { flex: 1, minWidth: 0, gap: spacing.xs },
  noResults: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.xxl, alignItems: 'center', gap: spacing.md },
  clearResults: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  habitHeading: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', justifyContent: 'space-between' },
  habit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingLeft: spacing.lg, minHeight: 76 },
  habitCheck: { width: 30, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  sourceNote: { paddingHorizontal: spacing.lg },
  pressed: { opacity: 0.65 },
});
