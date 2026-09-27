import { ConsumerPracticeRequests } from '@/practitioner/ConsumerPracticeRequests';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components';
import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { providerById } from '@/data';
import { ExperienceHeader } from '@/experience/ExperienceHeader';
import { useAppState } from '@/state';
import { bookingTimeValue } from '@/utils/bookingTime';
import { colors, spacing } from '@/theme';
import type { FeatherIconName } from '@/types';

export function SavitaHome() {
  const { tasks, toggleTask, medications, takenMedicationIds, toggleMedication, bookings } = useAppState();
  const [announcement, setAnnouncement] = useState('');
  const mobility = tasks.find((task) => task.id === 'mobility' && task.memberId === 'savita');
  const gel = medications.find((medicine) => medicine.id === 'savita-diclofenac' && !medicine.archived);
  const gelApplied = Boolean(gel && takenMedicationIds.includes(gel.id));
  const total = Number(Boolean(mobility)) + Number(Boolean(gel));
  const remaining = Number(Boolean(mobility && !mobility.completed)) + Number(Boolean(gel && !gelApplied));
  const completed = total - remaining;
  const progressText = total ? `${completed} of ${total} reminders completed` : 'No reminders today';
  const appointment = bookings.filter((item) => item.memberId === 'savita' && item.status === 'Confirmed')
    .sort((a, b) => bookingTimeValue(a) - bookingTimeValue(b))[0];
  const provider = appointment ? providerById(appointment.providerId) : undefined;

  return <ScreenContainer bottomInset={36} contentStyle={styles.content}>
    <ExperienceHeader title="Today" subtitle="Hello, Savita." />

    <View style={styles.section}>
      <View style={styles.sectionTop}><Text variant="title2">Your reminders</Text><Text variant="body" color={colors.textSecondary}>{completed} of {total} done</Text></View>
      <View style={styles.group}>
        <View accessible accessibilityRole="progressbar" accessibilityLabel="Today's reminders completed" accessibilityValue={{ min: 0, max: total || 1, now: completed, text: progressText }} aria-valuemin={0} aria-valuemax={total || 1} aria-valuenow={completed} aria-valuetext={progressText} style={styles.progressTrack}><View style={[styles.progressFill, { width: `${total ? completed / total * 100 : 100}%` }]} /></View>
        {mobility ? <TaskRow title="Mobility exercises" detail="10 minutes" completed={mobility.completed} onPress={() => {
          toggleTask(mobility.id);
          setAnnouncement(mobility.completed ? 'Exercises marked as still to do.' : 'Exercises marked done.');
        }} /> : null}
        {mobility && gel ? <View style={styles.taskDivider} /> : null}
        {gel ? <TaskRow title="Apply knee gel" detail={gel.dose} completed={gelApplied} onPress={() => {
          toggleMedication(gel.id);
          setAnnouncement(gelApplied ? 'Knee gel marked as still to do.' : 'Knee gel marked applied.');
        }} /> : null}
      </View>
      {announcement ? <Text accessibilityLiveRegion="polite" variant="body" color={colors.textSecondary} style={styles.body}>{announcement}</Text> : null}
      {!remaining && !announcement ? <Text variant="body" color={colors.textSecondary} style={styles.body}>Everything on your list is done.</Text> : null}
    </View>

    <View style={styles.group}>
      <ActionRow icon="message-circle" title="Ask Circle" detail="Medicines, reports and more" accent={colors.blue} tint={colors.blueTint} onPress={() => router.push('/ai')} />
      <View style={styles.insetDivider} />
      <ActionRow icon="heart" title="Ask Arjun for help" detail="Write a family note" accent={colors.plum} tint={colors.plumTint} onPress={() => router.push('/ai?prompt=Help%20me%20write%20a%20note%20to%20Arjun.')} />
    </View>

    <ConsumerPracticeRequests limit={1} activeOnly />

    {appointment && provider ? <View style={styles.section}>
      <Text variant="title2">Next appointment</Text>
      <View style={styles.appointment}>
        <View style={styles.appointmentTop}><View style={styles.calendarIcon}><Feather name="calendar" size={25} color={colors.blue} /></View><View style={styles.flex}><Text variant="headline">{appointment.service}</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>{provider.name}</Text></View></View>
        <Text variant="body" style={styles.body}>{appointment.date} · {appointment.time} IST</Text>
        <Text variant="body" color={colors.textSecondary} style={styles.body}>{appointment.mode === 'In person' ? 'Clinic visit' : appointment.mode}</Text>
        <Pressable onPress={() => router.push(`/booking/${appointment.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.appointmentButton, pressed && styles.pressed]}><Text variant="headline" color={colors.blue}>View appointment</Text><Feather name="chevron-right" size={22} color={colors.blue} /></Pressable>
      </View>
    </View> : null}

    <View style={styles.shortcuts}>
      <Shortcut icon="plus-square" title="Medicines" accent={colors.plum} tint={colors.plumTint} onPress={() => router.push('/medications')} />
      <Shortcut icon="file-text" title="Reports" accent={colors.amber} tint={colors.amberTint} onPress={() => router.push('/records')} />
    </View>
  </ScreenContainer>;
}

function TaskRow({ title, detail, completed, onPress }: { title: string; detail: string; completed: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${completed ? 'Done. Undo completion' : 'Mark done'}: ${title}. ${detail}`} style={({ pressed }) => [styles.task, pressed && styles.pressed]}>
    <Feather name={completed ? 'check-circle' : 'circle'} size={30} color={completed ? colors.blue : colors.textTertiary} />
    <View style={styles.flex}><Text variant="headline">{title}</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>{detail}</Text></View>
    <View style={styles.taskAction}><Text variant="headline" color={colors.blue} align="center">{completed ? 'Undo' : 'Mark\ndone'}</Text></View>
  </Pressable>;
}

function ActionRow({ icon, title, detail, onPress, accent, tint }: { icon: FeatherIconName; title: string; detail: string; onPress: () => void; accent: string; tint: string }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={({ pressed }) => [styles.helpRow, pressed && styles.pressed]}><View style={[styles.helpIcon, { backgroundColor: tint }]}><Feather name={icon} size={25} color={accent} /></View><View style={styles.flex}><Text variant="headline">{title}</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>{detail}</Text></View><Feather name="chevron-right" size={22} color={colors.textTertiary} /></Pressable>;
}

function Shortcut({ icon, title, onPress, accent, tint }: { icon: FeatherIconName; title: string; onPress: () => void; accent: string; tint: string }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open my ${title.toLowerCase()}`} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}><View style={[styles.shortcutIcon, { backgroundColor: tint }]}><Feather name={icon} size={24} color={accent} /></View><Text variant="headline">{title}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  body: { fontSize: 18, lineHeight: 25 },
  flex: { flex: 1, minWidth: 0, gap: 4 },
  section: { gap: spacing.md },
  sectionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
  group: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' },
  progressTrack: { height: 4, backgroundColor: colors.blueTint },
  progressFill: { height: 4, backgroundColor: colors.blue },
  task: { minHeight: 104, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  taskAction: { minWidth: 56, minHeight: 56, justifyContent: 'center' },
  taskDivider: { height: StyleSheet.hairlineWidth, marginLeft: 58, backgroundColor: colors.border },
  insetDivider: { height: StyleSheet.hairlineWidth, marginLeft: 76, backgroundColor: colors.border },
  helpRow: { minHeight: 90, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  helpIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appointment: { padding: spacing.lg, borderRadius: 18, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing.sm },
  appointmentTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  calendarIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
  appointmentButton: { minHeight: 56, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  shortcuts: { flexDirection: 'row', gap: spacing.md },
  shortcut: { minHeight: 102, flex: 1, padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.surface, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  shortcutIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
});
