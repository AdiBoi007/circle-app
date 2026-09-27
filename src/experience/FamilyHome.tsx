import { ConsumerPracticeRequests } from '@/practitioner/ConsumerPracticeRequests';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Avatar, ScreenContainer, Text } from '@/components';
import { launchMarket } from '@/config/launch';
import { family } from '@/data';
import { ExperienceHeader } from '@/experience/ExperienceHeader';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';
import type { Booking, FeatherIconName } from '@/types';

const demoDay = Date.UTC(2026, 6, 13);
const essentials: { title: string; icon: FeatherIconName; href: Href; color: string }[] = [
  { title: 'Records', icon: 'folder', href: '/records', color: colors.blue },
  { title: 'Medicines', icon: 'plus-circle', href: '/medications', color: colors.sage },
  { title: 'Tasks', icon: 'check-square', href: '/tasks', color: colors.amber },
  { title: 'Appointments', icon: 'calendar', href: '/calendar', color: colors.red },
];

export function FamilyHome() {
  const { tasks, bookings, toggleTask } = useAppState();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.2;
  const [lastCompleted, setLastCompleted] = useState<string>();
  const dayTasks = tasks.filter((task) => task.date === 'Today');
  const openTasks = dayTasks.filter((task) => !task.completed);
  const completedCount = dayTasks.length - openTasks.length;
  const nextTask = openTasks[0];
  const completedTask = tasks.find((task) => task.id === lastCompleted && task.completed);
  const nextBooking = bookings
    .filter((booking) => booking.status === 'Confirmed' && bookingTimestamp(booking) >= demoDay)
    .sort((a, b) => bookingTimestamp(a) - bookingTimestamp(b))[0];

  return (
    <ScreenContainer bottomInset={36} contentStyle={styles.page}>
      <ExperienceHeader title="Summary" subtitle="Your family, at a glance." />

      <View style={styles.section}>
        <SectionHeading title="Family overview" action="All tasks" href="/tasks" />
        <View style={styles.overview}>
          <Text variant="footnote" color={colors.textSecondary}>13 July 2026 · Demo day</Text>
          <View style={[styles.summaryRow, largeText && styles.vertical]}>
            <View style={styles.flex}><Text variant="largeTitle" style={styles.summaryNumber}>{openTasks.length}</Text><Text variant="headline">{openTasks.length === 1 ? 'Open task' : 'Open tasks'}</Text><Text variant="footnote" color={colors.textSecondary} style={styles.smallGap}>{completedCount} of {dayTasks.length} completed</Text></View>
            <CompletionRing completed={completedCount} total={dayTasks.length} />
          </View>
          {nextTask ? <View style={styles.nextAction}>
            <View style={styles.nextMeta}><Feather name={nextTask.icon} size={18} color={nextTask.time === 'Overdue' ? colors.amber : colors.blue} /><Text variant="subhead" color={colors.textSecondary} style={styles.flex}>{nextTask.who} · {nextTask.time === 'Overdue' ? 'Past due in demo' : nextTask.time}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel={`View next task: ${nextTask.title}`} onPress={() => router.push({ pathname: '/tasks', params: { focus: nextTask.id } })} style={({ pressed }) => [styles.taskTitleButton, pressed && styles.pressed]}><Text variant="title3" style={styles.flex}>{nextTask.title}</Text><Feather name="chevron-right" size={18} color={colors.textTertiary} /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Mark task complete: ${nextTask.title}`} accessibilityHint="Updates this task only." onPress={() => { toggleTask(nextTask.id); setLastCompleted(nextTask.id); }} style={({ pressed }) => [styles.completeButton, pressed && styles.pressed]}><Feather name="check" size={20} color={colors.white} /><Text variant="headline" color={colors.white} style={styles.buttonLabel}>Mark task complete</Text></Pressable>
          </View> : <View style={styles.nextAction}><Text variant="headline">All tasks completed</Text><Text variant="subhead" color={colors.textSecondary}>Review upcoming tasks in your family calendar.</Text></View>}
        </View>
        {completedTask ? <View style={styles.feedback}><Text accessibilityLiveRegion="polite" variant="footnote" style={styles.flex}>Completed: {completedTask.title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Undo completion of ${completedTask.title}`} onPress={() => { toggleTask(completedTask.id); setLastCompleted(undefined); }} style={styles.undo}><Text variant="headline" color={colors.blue}>Undo</Text></Pressable></View> : null}
      </View>

      <View style={styles.section}>
        <SectionHeading title="Essentials" action="Browse" href="/health" />
        <View style={styles.essentials}>
          {essentials.map((item, index) => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`Open ${item.title.toLowerCase()}`} onPress={() => router.push(item.href)} style={({ pressed }) => [styles.essential, largeText && styles.essentialLarge, (largeText ? index > 0 : index > 1) && styles.topDivider, !largeText && index % 2 === 1 && styles.leftDivider, pressed && styles.pressed]}><Feather name={item.icon} size={24} color={item.color} /><Text variant="subhead" style={styles.essentialLabel}>{item.title}</Text></Pressable>)}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Family" action="View all" href="/family" />
        <View style={styles.people}>
          {family.map((member) => <Pressable key={member.id} accessibilityRole="button" accessibilityLabel={`${member.name}, ${member.relation}. View profile.`} onPress={() => router.push(`/member/${member.id}`)} style={({ pressed }) => [styles.person, largeText && styles.personLarge, pressed && styles.pressed]}><Avatar name={member.name} accent={member.accent} size={46} /><Text variant="subhead" style={styles.personLabel}>{member.name.split(' ')[0]}</Text><Text variant="caption" color={colors.textSecondary} style={styles.personLabel}>{member.id === 'savita' ? 'Grandma' : member.relation}</Text></Pressable>)}
        </View>
      </View>

      <ConsumerPracticeRequests limit={2} activeOnly />

      <View style={styles.section}>
        <SectionHeading title="Next appointment" action="Calendar" href="/calendar" />
        {nextBooking ? <AppointmentPreview booking={nextBooking} /> : <Pressable accessibilityRole="button" onPress={() => router.push('/care')} style={styles.emptyBooking}><Text variant="headline">No upcoming appointments</Text><Text variant="subhead" color={colors.blue}>Find care</Text><Feather name="chevron-right" size={18} color={colors.textTertiary} /></Pressable>}
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Ask Circle a health question" onPress={() => router.push('/ai')} style={({ pressed }) => [styles.assistant, largeText && styles.vertical, pressed && styles.pressed]}><View style={styles.assistantIcon}><Feather name="message-circle" size={22} color={colors.blue} /></View><View style={[styles.flex, largeText && styles.fullWidth]}><Text variant="headline">Ask Circle</Text><Text variant="footnote" color={colors.textSecondary}>Understand a report or prepare for a visit.</Text></View><Feather name="chevron-right" size={18} color={colors.textTertiary} /></Pressable>
    </ScreenContainer>
  );
}

function SectionHeading({ title, action, href }: { title: string; action: string; href: Href }) {
  return <View style={styles.sectionHeading}><Text variant="title2" style={styles.sectionTitle}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${action}: ${title}`} onPress={() => router.push(href)} style={styles.sectionAction}><Text variant="subhead" color={colors.blue} style={styles.shrink}>{action}</Text></Pressable></View>;
}

function CompletionRing({ completed, total }: { completed: number; total: number }) {
  const progress = total > 0 ? completed / total : 0;
  const percentage = Math.round(progress * 100);
  const label = `${completed} of ${total} family tasks completed`;
  const circumference = 2 * Math.PI * 29;
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: percentage, text: label }} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} aria-valuetext={label} style={styles.ring}>
      <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={70} height={70} viewBox="0 0 70 70"><Circle cx={35} cy={35} r={29} fill="none" stroke={colors.surfaceMuted} strokeWidth={6} /><Circle cx={35} cy={35} r={29} fill="none" stroke={colors.blue} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - progress)} transform="rotate(-90 35 35)" /></Svg>
        <View style={styles.ringCenter} pointerEvents="none"><Feather name="check" size={26} color={colors.blue} /></View>
      </View>
    </View>
  );
}

function AppointmentPreview({ booking }: { booking: Booking }) {
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.2;
  const member = family.find((person) => person.id === booking.memberId);
  const [day, month, year] = booking.date.split(' ');
  return <Pressable accessibilityRole="button" accessibilityLabel={`${booking.service} for ${member?.name}, ${booking.date}, ${booking.time} ${launchMarket.timeZoneLabel}. Open appointment.`} onPress={() => router.push(`/booking/${booking.id}`)} style={({ pressed }) => [styles.appointment, largeText && styles.vertical, pressed && styles.pressed]}><View style={styles.dateBlock}><Text variant="caption" color={colors.red}>{month?.slice(0, 3)}</Text><Text variant="title1">{day}</Text></View><View style={[styles.flex, largeText && styles.fullWidth]}><Text variant="headline">{booking.service}</Text><Text variant="subhead" color={colors.textSecondary}>{member?.name.split(' ')[0]} · {booking.time}</Text><Text variant="caption" color={colors.textSecondary}>{booking.mode} · {launchMarket.timeZoneLabel} · {year}</Text></View><Feather name="chevron-right" size={18} color={colors.textTertiary} /></Pressable>;
}

/** Explicit English seed dates are parsed consistently across native and web. */
function bookingTimestamp(booking: Booking): number {
  const match = booking.date.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  const time = booking.time.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match || !time) return Number.NaN;
  const month = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(match[2]!.toLowerCase());
  if (month < 0) return Number.NaN;
  const hour = Number(time[1]) % 12 + (time[3]!.toLowerCase() === 'pm' ? 12 : 0);
  return Date.UTC(Number(match[3]), month, Number(match[1]), hour, Number(time[2]));
}

const styles = StyleSheet.create({
  page: { gap: spacing.xxl },
  flex: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1, minWidth: 0 },
  fullWidth: { flex: 0, width: '100%' },
  vertical: { flexDirection: 'column', alignItems: 'flex-start' },
  section: { gap: spacing.sm },
  sectionHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  sectionTitle: { flexGrow: 1, flexShrink: 1, minWidth: 130, maxWidth: '100%' },
  sectionAction: { minHeight: 48, maxWidth: '100%', justifyContent: 'center', paddingLeft: spacing.sm },
  overview: { padding: spacing.xl, gap: spacing.lg, borderRadius: 24, backgroundColor: colors.surface },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  summaryNumber: { fontSize: 42, lineHeight: 48, letterSpacing: -1.3, fontWeight: '700', fontVariant: ['tabular-nums'] },
  smallGap: { marginTop: spacing.xs },
  ring: { width: 70, height: 70, position: 'relative', flexShrink: 0 },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  nextAction: { paddingTop: spacing.lg, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  nextMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  taskTitleButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingBottom: spacing.sm },
  completeButton: { minHeight: 50, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.blue, borderRadius: 14 },
  buttonLabel: { flexShrink: 1, textAlign: 'center' },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.lg, paddingRight: spacing.sm, borderRadius: 14, backgroundColor: colors.blueTint },
  undo: { minHeight: 48, minWidth: 64, paddingHorizontal: spacing.sm, justifyContent: 'center', alignItems: 'center' },
  essentials: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 20, backgroundColor: colors.surface, overflow: 'hidden' },
  essential: { width: '50%', minHeight: 92, padding: spacing.lg, gap: spacing.sm, justifyContent: 'center' },
  essentialLarge: { width: '100%', minHeight: 80, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: spacing.md },
  essentialLabel: { flexShrink: 1, maxWidth: '100%' },
  topDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  leftDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingVertical: spacing.lg, paddingHorizontal: spacing.sm, borderRadius: 20, backgroundColor: colors.surface },
  person: { flexGrow: 1, flexBasis: '23%', minWidth: 0, alignItems: 'center', gap: spacing.xs },
  personLarge: { flexBasis: '46%', paddingVertical: spacing.sm },
  personLabel: { maxWidth: '100%', textAlign: 'center' },
  appointment: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg },
  dateBlock: { minWidth: 48, alignItems: 'center', alignSelf: 'flex-start', paddingVertical: spacing.xs },
  emptyBooking: { minHeight: 100, backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, gap: spacing.sm },
  assistant: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: 20 },
  assistantIcon: { width: 38, minHeight: 40, justifyContent: 'center', alignItems: 'center' },
  pressed: { opacity: 0.65 },
});
