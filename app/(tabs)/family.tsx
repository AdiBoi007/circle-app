import { Feather } from '@expo/vector-icons';
import { Redirect, router, type Href } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Avatar, ProgressBar, ScreenContainer, Text } from '@/components';
import { launchMarket } from '@/config/launch';
import { family } from '@/data';
import { ExperienceHeader } from '@/experience/ExperienceHeader';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';
import type { FeatherIconName } from '@/types';

type FamilyTool = { title: string; icon: FeatherIconName; href: Href; color: string; value?: string };

export default function FamilyScreen() {
  const { activeAccountId, tasks, records, goals, medications } = useAppState();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.2;
  const familyGoal = goals.find((goal) => !goal.memberId && goal.active);
  if (activeAccountId !== 'arjun') return <Redirect href="/" />;

  const planning: FamilyTool[] = [
    { title: 'Tasks', icon: 'check-square', href: '/tasks', color: colors.amber, value: `${tasks.filter((task) => !task.completed).length} open` },
    { title: 'Calendar', icon: 'calendar', href: '/calendar', color: colors.red },
    { title: 'Medicines', icon: 'plus-circle', href: '/medications', color: colors.sage, value: `${medications.filter((medicine) => !medicine.archived).length} active` },
    { title: 'Goals', icon: 'target', href: '/goals', color: colors.plum, value: `${goals.filter((goal) => goal.active).length} active` },
  ];
  const information: FamilyTool[] = [
    { title: 'Health records', icon: 'folder', href: '/records', color: colors.blue, value: `${records.length}` },
    { title: 'Medical IDs', icon: 'shield', href: '/emergency', color: colors.red },
    { title: 'Sharing & permissions', icon: 'lock', href: '/settings/permissions', color: colors.textSecondary },
  ];

  return (
    <ScreenContainer bottomInset={36} contentStyle={styles.page}>
      <ExperienceHeader title="Family" subtitle={`Mehra family · ${launchMarket.city}`} />

      <View style={styles.section}>
        <Text variant="title2">Members</Text>
        <View style={styles.group}>
          {family.map((member, index) => {
            const openTasks = tasks.filter((task) => task.memberId === member.id && !task.completed);
            const latestRecord = records.filter((record) => record.memberId === member.id).sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))[0];
            return <View key={member.id} style={index > 0 && styles.memberDivider}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Open ${member.name}’s health profile. ${openTasks.length} open tasks.`} onPress={() => router.push(`/member/${member.id}`)} style={({ pressed }) => [styles.member, pressed && styles.pressed]}>
                <Avatar name={member.name} accent={member.accent} size={44} />
                <View style={styles.flex}><Text variant="headline">{member.name.split(' ')[0]}{member.id === 'arjun' ? ' (you)' : ''}</Text><Text variant="footnote" color={colors.textSecondary}>{member.relation === 'You' ? 'Organiser' : member.relation} · {member.location}</Text><Text variant="caption" color={colors.textSecondary}>{openTasks.length ? `${openTasks.length} open ${openTasks.length === 1 ? 'task' : 'tasks'}` : 'No open tasks'}</Text></View>
                <Feather name="chevron-right" size={18} color={colors.textTertiary} />
              </Pressable>
              <View style={[styles.memberActions, largeText && styles.memberActionsLarge]}>
                <MemberAction largeText={largeText} title="Latest record" icon="file-text" label={`View ${member.name}’s latest health record`} href={latestRecord ? `/record/${latestRecord.id}` : '/records'} />
                <MemberAction largeText={largeText} title="Medical ID" icon="shield" label={`View ${member.name}’s Medical ID`} href={`/emergency?member=${member.id}`} />
              </View>
            </View>;
          })}
        </View>
      </View>

      <ToolSection title="Care & planning" tools={planning} largeText={largeText} />
      <ToolSection title="Family information" tools={information} largeText={largeText} />

      {familyGoal ? <View style={styles.section}><Text variant="title2">Shared goal</Text><Pressable accessibilityRole="button" accessibilityLabel={`Family goal: ${familyGoal.title}. ${familyGoal.current} of ${familyGoal.target} complete.`} onPress={() => router.push('/goals')} style={({ pressed }) => [styles.goal, pressed && styles.pressed]}><View style={styles.goalTop}><Text variant="headline" style={styles.flex}>{familyGoal.title}</Text><Feather name="chevron-right" size={18} color={colors.textTertiary} /></View><Text variant="subhead" color={colors.textSecondary}>{familyGoal.current} of {familyGoal.target} completed</Text><ProgressBar progress={familyGoal.target > 0 ? familyGoal.current / familyGoal.target : 0} accent="blue" height={6} trackColor={colors.surfaceMuted} accessibilityLabel={`${familyGoal.current} of ${familyGoal.target} completed`} /><Text variant="footnote" color={colors.textSecondary}>July 2026 demo plan</Text></Pressable></View> : null}
    </ScreenContainer>
  );
}

function ToolSection({ title, tools, largeText }: { title: string; tools: FamilyTool[]; largeText: boolean }) {
  return <View style={styles.section}><Text variant="title2">{title}</Text><View style={styles.group}>{tools.map((tool, index) => <Pressable key={tool.title} accessibilityRole="button" accessibilityLabel={`Open ${tool.title}${tool.value ? `, ${tool.value}` : ''}`} onPress={() => router.push(tool.href)} style={({ pressed }) => [styles.tool, pressed && styles.pressed]}><View style={[styles.toolIcon, { backgroundColor: tool.color }]}><Feather name={tool.icon} size={18} color={colors.white} /></View><View style={[styles.toolContent, index > 0 && styles.toolDivider]}><View style={[styles.toolLabels, largeText && styles.toolLabelsLarge]}><Text variant="body" style={[styles.flex, largeText && styles.toolTitleLarge]}>{tool.title}</Text>{tool.value ? <Text variant="subhead" color={colors.textSecondary}>{tool.value}</Text> : null}</View><Feather name="chevron-right" size={17} color={colors.textTertiary} /></View></Pressable>)}</View></View>;
}

function MemberAction({ title, icon, label, href, largeText }: { title: string; icon: FeatherIconName; label: string; href: Href; largeText: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push(href)} style={({ pressed }) => [styles.memberAction, largeText && styles.memberActionLarge, pressed && styles.pressed]}><Feather name={icon} size={16} color={colors.blue} /><Text variant="footnote" color={colors.blue} style={styles.actionLabel}>{title}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { gap: spacing.xxxl },
  flex: { flex: 1, minWidth: 0 },
  section: { gap: spacing.md },
  group: { backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden' },
  member: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs },
  memberDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  memberActions: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm },
  memberActionsLarge: { flexDirection: 'column', gap: 0 },
  memberAction: { flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  memberActionLarge: { flex: 0, justifyContent: 'flex-start', gap: spacing.sm },
  actionLabel: { flexShrink: 1, maxWidth: '100%' },
  tool: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.lg, gap: spacing.md, minHeight: 60 },
  toolIcon: { width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  toolContent: { flex: 1, minWidth: 0, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingRight: spacing.lg, paddingVertical: spacing.md },
  toolDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  toolLabels: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toolLabelsLarge: { flexDirection: 'column', alignItems: 'stretch', gap: spacing.xs },
  toolTitleLarge: { flex: 0, width: '100%' },
  goal: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, gap: spacing.md },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pressed: { opacity: 0.65 },
});
