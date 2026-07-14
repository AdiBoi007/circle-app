import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Avatar, Button, Card, DetailHeader, ProgressBar, ScreenContainer, Sheet, StatusPill, Text } from '@/components';
import { family, providerById } from '@/data';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';
import type { Booking, CareMode, MemberId } from '@/types';
import { SavitaBooking } from '@/accounts/savita/SavitaBooking';

const stepNames = ['Service', 'Member', 'Time', 'Mode', 'Records', 'Note', 'Review', 'Payment'] as const;

export default function BookingScreen() {
  const { activeAccountId } = useAppState();
  return activeAccountId === 'savita' ? <SavitaBooking /> : <ArjunBookingScreen />;
}

function ArjunBookingScreen() {
  const { id, providerId: queryProvider, memberId: queryMember } = useLocalSearchParams<{ id: string; providerId?: string; memberId?: MemberId }>();
  const { bookings, records, addBooking, updateBooking } = useAppState();
  const existing = bookings.find((item) => item.id === id);
  const pro = providerById(existing?.providerId ?? queryProvider ?? 'rhea-malhotra');
  const [step, setStep] = useState(0);
  const [memberId, setMemberId] = useState<MemberId>(existing?.memberId ?? queryMember ?? 'rajiv');
  const [service, setService] = useState(existing?.service ?? pro?.services[0] ?? 'Introduction');
  const [date, setDate] = useState(existing?.date ?? '20 July 2026');
  const [time, setTime] = useState(existing?.time ?? '6:30 pm');
  const [mode, setMode] = useState<CareMode>(existing?.mode ?? pro?.modes[0] ?? 'Online');
  const [shared, setShared] = useState<string[]>([]);
  const [note, setNote] = useState(existing?.note ?? '');
  const [confirmed, setConfirmed] = useState(false);
  const [createdId, setCreatedId] = useState('');
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [cancel, setCancel] = useState(false);

  if (!pro) return <ScreenContainer><DetailHeader title="Booking" /><Text>Professional not found.</Text></ScreenContainer>;

  if (existing && id !== 'new' && !confirmed) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <DetailHeader title="Booking detail" />
        <View style={styles.hero}>
          <Avatar name={pro.name} accent={pro.accent} size={82} />
          <StatusPill label={existing.status} accent={existing.status === 'Cancelled' ? 'red' : 'sage'} />
          <Text variant="title1" align="center">{pro.name}</Text>
          <Text variant="headline" color={colors.textSecondary}>{existing.service}</Text>
        </View>
        <Card><Info label="For" value={family.find((item) => item.id === existing.memberId)!.name} /><Line /><Info label="When" value={`${existing.date}, ${existing.time}`} /><Line /><Info label="Mode" value={existing.mode} /></Card>
        <View style={styles.buttons}>
          <Button title="Join waiting room" disabled={existing.status !== 'Confirmed'} onPress={() => router.push(`/consultation/${existing.id}`)} />
          <Button title="Reschedule" variant="secondary" onPress={() => updateBooking(existing.id, { date: '21 July 2026', time: '7:00 pm' })} />
          <Button title="Cancel booking" variant="tertiary" onPress={() => setCancel(true)} />
          <Button title="Rebook" variant="tertiary" onPress={() => router.push(`/booking/new?providerId=${pro.id}&memberId=${existing.memberId}`)} />
        </View>
        <Sheet visible={cancel} onClose={() => setCancel(false)} title="Cancel booking?" footer={<Button title="Confirm cancellation" onPress={() => { updateBooking(existing.id, { status: 'Cancelled' }); setCancel(false); }} />}><Text variant="callout" color={colors.textSecondary}>{pro.cancellation}</Text></Sheet>
      </ScreenContainer>
    );
  }

  if (confirmed) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <DetailHeader title="Booking confirmed" />
        <View style={styles.hero}>
          <Avatar name={pro.name} accent={pro.accent} size={82} />
          <View style={styles.successBadge}><Feather name="check" size={18} color={colors.white} /></View>
          <Text variant="title1" align="center">You’re booked with {pro.name}</Text>
          <Text variant="callout" color={colors.textSecondary} align="center">{family.find((item) => item.id === memberId)!.name} · {date}, {time} · {mode}</Text>
        </View>
        <Card><Text variant="headline">What happens next</Text><Text variant="callout" color={colors.textSecondary} style={styles.gap}>The booking now appears in Care, Home upcoming care and the member’s Care profile. Shared records remain local in this demo.</Text></Card>
        <Button title={calendarAdded ? 'Added to calendar' : 'Add to calendar'} disabled={calendarAdded} onPress={() => setCalendarAdded(true)} style={styles.gap} />
        <Button title="View booking" variant="secondary" onPress={() => router.replace(`/booking/${createdId}`)} />
        <Button title="Back to Care" variant="tertiary" onPress={() => router.replace('/care')} />
      </ScreenContainer>
    );
  }

  const next = () => {
    if (step < 7) return setStep((value) => value + 1);
    const bookingId = `booking-${Date.now()}`;
    const booking: Booking = { id: bookingId, providerId: pro.id, memberId, service, date, time, mode, status: 'Confirmed', note };
    addBooking(booking);
    setCreatedId(bookingId);
    setConfirmed(true);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <DetailHeader title="Book care" />
      <View style={styles.providerBar}><Avatar name={pro.name} accent={pro.accent} size={48} /><View style={styles.flex}><Text variant="headline">{pro.name}</Text><Text variant="footnote" color={colors.textSecondary}>{pro.title}</Text></View></View>
      <Text variant="caption" color={colors.textSecondary}>STEP {step + 1} OF 8 · {stepNames[step]}</Text>
      <ProgressBar progress={(step + 1) / 8} accent="blue" accessibilityLabel={`Step ${step + 1} of 8`} />
      <Card style={styles.stepCard}>
        {step === 0 ? <Choices title="Select service" options={pro.services} value={service} onChange={setService} /> : null}
        {step === 1 ? <MemberChoices value={memberId} onChange={setMemberId} /> : null}
        {step === 2 ? <><Choices title="Choose date" options={['20 July 2026', '21 July 2026', '23 July 2026']} value={date} onChange={setDate} /><Choices title="Choose time" options={['6:30 pm', '7:00 pm', '8:00 pm']} value={time} onChange={setTime} /></> : null}
        {step === 3 ? <Choices title="Session mode" options={pro.modes} value={mode} onChange={(value) => setMode(value as CareMode)} /> : null}
        {step === 4 ? <><Text variant="title3">Choose records to share</Text>{records.filter((item) => item.memberId === memberId).map((record) => <Pressable key={record.id} onPress={() => setShared((items) => items.includes(record.id) ? items.filter((item) => item !== record.id) : [...items, record.id])} style={styles.record}><Feather name={shared.includes(record.id) ? 'check-circle' : 'circle'} size={20} color={shared.includes(record.id) ? colors.blue : colors.textTertiary} /><Text variant="callout" style={styles.flex}>{record.title}</Text></Pressable>)}</> : null}
        {step === 5 ? <><Text variant="title3">Add a note</Text><TextInput value={note} onChangeText={setNote} multiline placeholder="What would you like the professional to know?" placeholderTextColor={colors.textTertiary} style={styles.note} /></> : null}
        {step === 6 ? <><Text variant="title3">Review booking</Text><Info label="Professional" value={pro.name} /><Info label="For" value={family.find((item) => item.id === memberId)!.name} /><Info label="When" value={`${date}, ${time}`} /><Info label="Mode" value={mode} /><Info label="Records" value={`${shared.length} selected`} /><Info label="Total" value={`${pro.currency}${pro.price}`} /></> : null}
        {step === 7 ? <><Text variant="title3">Mock payment</Text><Card background={colors.surfaceMuted}><Text variant="headline">•••• 4242</Text><Text variant="footnote" color={colors.textSecondary}>Demo family payment method</Text></Card><Text variant="footnote" color={colors.textSecondary}>No payment is processed. Confirming creates a local booking only.</Text></> : null}
      </Card>
      <View style={styles.buttons}><Button title={step === 7 ? `Confirm · ${pro.currency}${pro.price}` : 'Continue'} onPress={next} /><Button title="Back" variant="tertiary" disabled={step === 0} onPress={() => setStep((value) => value - 1)} /></View>
    </ScreenContainer>
  );
}

function MemberChoices({ value, onChange }: { value: MemberId; onChange: (value: MemberId) => void }) {
  return <View style={styles.choiceBlock}><Text variant="title3">Who is this for?</Text>{family.map((member) => <Pressable key={member.id} onPress={() => onChange(member.id)} style={[styles.choice, value === member.id && styles.choiceActive]}><View style={styles.personChoice}><Avatar name={member.name} accent={member.accent} size={42} /><View><Text variant="callout" color={value === member.id ? colors.blue : colors.textPrimary}>{member.name}</Text><Text variant="footnote" color={colors.textSecondary}>{member.relation}</Text></View></View><Feather name={value === member.id ? 'check-circle' : 'circle'} size={20} color={value === member.id ? colors.blue : colors.textTertiary} /></Pressable>)}</View>;
}
function Choices<T extends string>({ title, options, value, onChange }: { title: string; options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return <View style={styles.choiceBlock}><Text variant="title3">{title}</Text>{options.map((item) => <Pressable key={item} onPress={() => onChange(item)} style={[styles.choice, value === item && styles.choiceActive]}><Text variant="callout" color={value === item ? colors.blue : colors.textPrimary}>{item}</Text><Feather name={value === item ? 'check-circle' : 'circle'} size={20} color={value === item ? colors.blue : colors.textTertiary} /></Pressable>)}</View>;
}
function Info({ label, value }: { label: string; value: string }) { return <View style={styles.info}><Text variant="caption" color={colors.textSecondary}>{label.toUpperCase()}</Text><Text variant="headline">{value}</Text></View>; }
function Line() { return <View style={styles.line} />; }

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xxxl },
  successBadge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue, marginTop: -24 },
  providerBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  gap: { marginTop: spacing.lg },
  buttons: { marginTop: spacing.xxl, gap: spacing.sm },
  stepCard: { marginTop: spacing.xl, gap: spacing.xl },
  choiceBlock: { gap: spacing.md },
  choice: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderRadius: radius.input, backgroundColor: colors.surfaceMuted },
  choiceActive: { backgroundColor: colors.blueTint },
  personChoice: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  record: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  flex: { flex: 1 },
  note: { minHeight: 130, backgroundColor: colors.surfaceMuted, borderRadius: radius.input, padding: spacing.lg, fontSize: 16, textAlignVertical: 'top', color: colors.textPrimary },
  info: { gap: spacing.xs, marginTop: spacing.md },
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.lg },
});
