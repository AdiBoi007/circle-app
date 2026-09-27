import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Keyboard, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { Button, Text } from '@/components';
import { launchMarket } from '@/config/launch';
import { practiceDateLabel } from '@/practitioner/model';
import type { PracticeHours } from '@/practitioner/types';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';

const weekdays = [
  { day: 1, name: 'Monday' }, { day: 2, name: 'Tuesday' }, { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' }, { day: 5, name: 'Friday' }, { day: 6, name: 'Saturday' }, { day: 0, name: 'Sunday' },
];
const validTime = (time: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
const orderedHours = (hours: PracticeHours[]) => weekdays.map(({ day }) => ({ ...(hours.find((item) => item.day === day) ?? { day, enabled: false, start: '09:00', end: '17:00' }) }));

type Props = { onDone?: () => void; initialDate?: string };

export function PracticeAvailabilityEditor({ onDone, initialDate = '' }: Props) {
  const { practice, savePracticeHours, togglePracticeBlockedDate } = useAppState();
  const { width, fontScale } = useWindowDimensions();
  const [hoursDraft, setHoursDraft] = useState<PracticeHours[] | null>(null);
  const [hoursError, setHoursError] = useState('');
  const [hoursNotice, setHoursNotice] = useState('');
  const [date, setDate] = useState(initialDate);
  const [dateError, setDateError] = useState('');
  const [dateNotice, setDateNotice] = useState('');
  const savedHours = orderedHours(practice.hours);
  const hours = hoursDraft ?? savedHours;
  const dirty = JSON.stringify(hours) !== JSON.stringify(savedHours);
  const closed = practice.blockedDates.includes(date.trim());
  const stacked = width < 600 || fontScale > 1.2;
  const largeText = fontScale > 1.4;

  function updateDay(day: number, patch: Partial<PracticeHours>) {
    setHoursDraft((current) => (current ?? orderedHours(practice.hours)).map((item) => {
      if (item.day !== day) return item;
      const next = { ...item, ...patch };
      // Inputs on closed days are hidden; keep their stored times valid.
      if (!next.enabled) return { ...next, start: validTime(next.start) ? next.start : '09:00', end: validTime(next.end) ? next.end : '17:00' };
      return next;
    }));
    setHoursError('');
    setHoursNotice('');
  }

  function saveHours() {
    Keyboard.dismiss();
    const result = savePracticeHours(hours);
    if (!result.ok) { setHoursError(result.error); setHoursNotice(''); return; }
    setHoursDraft(null);
    setHoursError('');
    setHoursNotice('Weekly hours saved.');
  }

  function cancelHours() {
    Keyboard.dismiss();
    setHoursDraft(null);
    setHoursError('');
    setHoursNotice('Unsaved weekly hours discarded.');
  }

  function toggleDate(value: string) {
    Keyboard.dismiss();
    const reopening = practice.blockedDates.includes(value);
    const result = togglePracticeBlockedDate(value);
    if (!result.ok) { setDateError(result.error); setDateNotice(''); return; }
    setDateError('');
    setDateNotice(`${practiceDateLabel(value)} ${reopening ? 'reopened. Weekly hours apply.' : 'closed to new requests.'}`);
    setDate('');
  }

  return <View style={styles.form}>
    <Text variant="footnote" color={colors.textSecondary}>Demo schedule · {launchMarket.city} · {launchMarket.timeZoneLabel}</Text>

    <View style={styles.section}>
      <View style={styles.heading}><Text variant="title3" accessibilityRole="header">Weekly hours</Text><Text variant="footnote" color={colors.textSecondary}>Use 24-hour times, such as 09:00 and 17:00.</Text></View>
      <View style={styles.group}>{weekdays.map(({ day, name }, index) => {
        const value = hours.find((item) => item.day === day)!;
        return <View key={day} style={[styles.day, index > 0 && styles.divider, stacked && styles.stackedDay]}>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: value.enabled }} aria-checked={value.enabled} accessibilityLabel={`${name}, ${value.enabled ? 'open' : 'closed'}`} onPress={() => { Keyboard.dismiss(); updateDay(day, { enabled: !value.enabled }); }} style={({ pressed }) => [styles.dayHeader, stacked && styles.stackedHeader, pressed && styles.pressed]}>
            <Text variant="headline" style={styles.flex}>{name}</Text>
            <View style={[styles.toggle, value.enabled && styles.toggleOn]}><View style={[styles.toggleKnob, value.enabled && styles.toggleKnobOn]} /></View>
          </Pressable>
          {value.enabled ? <View style={[styles.timeFields, stacked && styles.stackedTimes]}>
            <View style={[styles.timeField, largeText && styles.largeTimeField]}><Text variant="footnote" color={colors.textSecondary}>From</Text><TextInput value={value.start} onChangeText={(start) => updateDay(day, { start })} accessibilityLabel={`${name} opening time in HH:mm`} placeholder="09:00" placeholderTextColor={colors.textTertiary} maxLength={5} keyboardType="numbers-and-punctuation" autoCorrect={false} autoCapitalize="none" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={styles.timeInput} /></View>
            <View style={[styles.timeField, largeText && styles.largeTimeField]}><Text variant="footnote" color={colors.textSecondary}>Until</Text><TextInput value={value.end} onChangeText={(end) => updateDay(day, { end })} accessibilityLabel={`${name} closing time in HH:mm`} placeholder="17:00" placeholderTextColor={colors.textTertiary} maxLength={5} keyboardType="numbers-and-punctuation" autoCorrect={false} autoCapitalize="none" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={styles.timeInput} /></View>
          </View> : <Text variant="subhead" color={colors.textSecondary} style={[styles.closedLabel, stacked && styles.stackedClosed]}>Closed</Text>}
        </View>;
      })}</View>
      {hoursError ? <Feedback message={hoursError} error /> : null}
      {hoursNotice ? <Feedback message={hoursNotice} /> : null}
      <View style={styles.actions}><Button title="Save weekly hours" size="md" disabled={!dirty} onPress={saveHours} /><Button title="Cancel changes" size="md" variant="tertiary" disabled={!dirty} onPress={cancelHours} /></View>
    </View>

    <View style={styles.section}>
      <View style={styles.heading}><Text variant="title3" accessibilityRole="header">Close a date</Text><Text variant="footnote" color={colors.textSecondary}>Take a day off. Confirmed visits must be resolved first.</Text></View>
      <View style={styles.dateCard}>
        <Text variant="subhead">Date · YYYY-MM-DD</Text>
        <TextInput value={date} onChangeText={(value) => { setDate(value); setDateError(''); setDateNotice(''); }} accessibilityLabel="Date to close or reopen, YYYY-MM-DD" placeholder="2026-09-30" placeholderTextColor={colors.textTertiary} maxLength={10} keyboardType="numbers-and-punctuation" autoCorrect={false} autoCapitalize="none" returnKeyType="done" onSubmitEditing={Keyboard.dismiss} style={styles.dateInput} />
        <Button title={closed ? 'Reopen date' : 'Close date'} size="md" variant="secondary" disabled={!date.trim()} onPress={() => toggleDate(date.trim())} />
        <Text variant="footnote" color={colors.textSecondary}>Date changes apply immediately.</Text>
      </View>
      {dateError ? <Feedback message={dateError} error /> : null}
      {dateNotice ? <Feedback message={dateNotice} /> : null}
    </View>

    <View style={styles.section}>
      <Text variant="title3" accessibilityRole="header">Closed dates</Text>
      {practice.blockedDates.length ? <View style={styles.group}>{[...practice.blockedDates].sort().map((value, index) => <View key={value} style={[styles.closedDate, index > 0 && styles.divider]}><View style={styles.flex}><Text variant="headline">{practiceDateLabel(value)}</Text><Text variant="footnote" color={colors.textSecondary}>{value}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Reopen ${practiceDateLabel(value)}`} onPress={() => toggleDate(value)} style={({ pressed }) => [styles.reopen, pressed && styles.pressed]}><Text variant="subhead" color={colors.blue}>Reopen</Text></Pressable></View>)}</View> : <View style={styles.empty}><Text variant="callout" color={colors.textSecondary}>No dates closed. Weekly hours apply.</Text></View>}
    </View>

    {onDone ? <View style={styles.done}><Button title="Done" onPress={() => { Keyboard.dismiss(); onDone(); }} disabled={dirty} accessibilityHint={dirty ? 'Save or cancel your weekly hours before closing.' : 'Close the availability editor.'} />{dirty ? <Text variant="footnote" color={colors.textSecondary} align="center">Save or cancel your weekly hours to finish.</Text> : null}</View> : null}
  </View>;
}

function Feedback({ message, error = false }: { message: string; error?: boolean }) {
  return <View accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion={error ? 'assertive' : 'polite'} style={[styles.feedback, { backgroundColor: error ? colors.redTint : colors.sageTint }]}><Feather name={error ? 'alert-circle' : 'check-circle'} size={20} color={error ? colors.red : colors.sage} /><Text variant="callout" color={error ? colors.red : colors.sage} style={styles.flex}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  form: { gap: spacing.xxl },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  section: { gap: spacing.md },
  heading: { gap: spacing.xs },
  group: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
  day: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  stackedDay: { flexDirection: 'column', alignItems: 'stretch', gap: 0 },
  dayHeader: { flexBasis: 180, flexGrow: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stackedHeader: { flexBasis: 'auto', flexGrow: 0 },
  toggle: { width: 40, height: 25, padding: 3, borderRadius: 13, backgroundColor: colors.borderStrong },
  toggleOn: { backgroundColor: colors.blue },
  toggleKnob: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.white },
  toggleKnobOn: { alignSelf: 'flex-end' },
  timeFields: { flex: 1.5, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  stackedTimes: { flex: undefined, paddingBottom: spacing.sm },
  timeField: { flexGrow: 1, flexBasis: 110, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  largeTimeField: { flexBasis: '100%' },
  timeInput: { flex: 1, minWidth: 64, minHeight: 44, borderRadius: 9, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, fontSize: 17, color: colors.textPrimary, backgroundColor: colors.background, textAlign: 'center', fontVariant: ['tabular-nums'] },
  closedLabel: { flex: 1.5 },
  stackedClosed: { flex: undefined, paddingBottom: spacing.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  actions: { gap: spacing.xs },
  dateCard: { padding: spacing.md, gap: spacing.md, backgroundColor: colors.surface, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  dateInput: { minHeight: 48, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 17, fontVariant: ['tabular-nums'], color: colors.textPrimary, backgroundColor: colors.background, borderRadius: 10 },
  feedback: { padding: spacing.md, borderRadius: 12, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  closedDate: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  reopen: { minHeight: 48, minWidth: 76, paddingHorizontal: spacing.sm, justifyContent: 'center', alignItems: 'center' },
  empty: { padding: spacing.lg, backgroundColor: colors.background, borderRadius: 14 },
  done: { gap: spacing.sm },
  pressed: { opacity: 0.65 },
});
