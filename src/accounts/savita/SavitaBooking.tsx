import { useCallback, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, DetailHeader, ScreenContainer } from '@/components';
import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { providerById } from '@/data';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';
import type { CareMode, FeatherIconName } from '@/types';

const demoDate = '18 July 2026';
const times = ['10:00 AM', '2:00 PM', '6:30 PM'];

export function SavitaBooking() {
  const { id, providerId: queryProvider } = useLocalSearchParams<{ id: string; providerId?: string }>();
  const { bookings, addBooking, updateBooking } = useAppState();
  const existing = bookings.find((booking) => booking.id === id && booking.memberId === 'savita');
  const provider = providerById(existing?.providerId ?? queryProvider ?? '');
  const [stage, setStage] = useState<'choose' | 'review' | 'saved'>('choose');
  const [service, setService] = useState(provider?.services[0] ?? '');
  const [time, setTime] = useState(times[0]);
  const [mode, setMode] = useState<CareMode>(provider?.modes[0] ?? 'Home visit');
  const [bookingId, setBookingId] = useState('');
  const [editing, setEditing] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [notice, setNotice] = useState('');
  const bookingSequence = useRef(0);
  const creating = useRef(false);

  const confirm = useCallback(() => {
    if (!provider || creating.current) return;
    creating.current = true;
    const newId = `savita-booking-${provider.id}-${Date.now()}-${++bookingSequence.current}`;
    addBooking({ id: newId, providerId: provider.id, memberId: 'savita', service, date: demoDate, time, mode, status: 'Confirmed' });
    setBookingId(newId);
    setStage('saved');
  }, [provider, addBooking, service, time, mode]);

  if (!provider || (id !== 'new' && !existing)) return <ScreenContainer contentStyle={styles.content}><DetailHeader title="Appointment" /><Text variant="title2">Appointment unavailable</Text><Text variant="body" style={styles.body}>This appointment is not in your care list.</Text><Action label="Back to My care" onPress={() => router.replace('/care')} /></ScreenContainer>;

  if (existing && id !== 'new') return <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
    <DetailHeader title="Your appointment" />
    <View style={styles.hero}><Avatar name={provider.name} accent={provider.accent} size={60} /><View style={styles.flex}><Text variant="title2">{provider.name}</Text><Text variant="body" style={styles.body}>{existing.service}</Text></View></View>
    <View style={styles.card}><Info icon="calendar" title={`${existing.date} · ${existing.time}`} /><Text variant="body" color={colors.textSecondary} style={styles.body}>India time (IST)</Text><Info icon="map-pin" title={existing.mode === 'In person' ? 'Clinic visit' : existing.mode} /><Info icon={existing.status === 'Cancelled' ? 'x-circle' : 'check-circle'} title={existing.status} /></View>
    {notice ? <Text accessibilityLiveRegion="polite" variant="body" style={styles.notice}>{notice}</Text> : null}
    {existing.status === 'Confirmed' && !editing && !cancel ? <>
      <Action label="Get ready for my visit" onPress={() => router.push(`/appointment-prep/${existing.id}`)} />
      <Action label="Change appointment time" secondary onPress={() => { setEditing(true); setNotice(''); }} />
      <Action label="Cancel appointment" secondary onPress={() => { setCancel(true); setNotice(''); }} />
    </> : null}
    {editing ? <View style={styles.card}><Text variant="title2">Choose a new time</Text><Text variant="body" style={styles.body}>{demoDate} · India time (IST)</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>Sample times for this demo.</Text>{times.map((item) => <Choice key={item} label={item} selected={time === item} onPress={() => setTime(item)} />)}<Action label="Save new time" onPress={() => { updateBooking(existing.id, { date: demoDate, time }); setEditing(false); setNotice('The new time is saved in this demo.'); }} /><Action label="Keep original time" secondary onPress={() => setEditing(false)} /></View> : null}
    {cancel ? <View style={styles.card}><Text variant="title2">Cancel this appointment?</Text><Text variant="body" style={styles.body}>This will remove it from your upcoming appointments in this demo.</Text><Action label="Keep my appointment" onPress={() => setCancel(false)} /><Action label="Yes, cancel appointment" secondary onPress={() => { updateBooking(existing.id, { status: 'Cancelled' }); setCancel(false); setNotice('Appointment cancelled in this demo.'); }} /></View> : null}
    <Action label="Back to My care" secondary onPress={() => router.replace('/care')} />
  </ScreenContainer>;

  return <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
    <DetailHeader title={stage === 'saved' ? 'Appointment saved' : 'Book a visit'} />
    <View style={styles.provider}><Avatar name={provider.name} accent={provider.accent} size={64} /><View style={styles.flex}><Text variant="title3">{provider.name}</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>{provider.title}</Text></View></View>
    {stage === 'choose' ? <>
      <Text variant="title1">Plan your visit</Text>
      <Text variant="body" color={colors.textSecondary} style={styles.body}>Sample appointment. No payment is made.</Text>
      <View style={styles.card}><Text variant="title2">Choose a service</Text>{provider.services.slice(0, 3).map((item) => <Choice key={item} label={item} selected={service === item} onPress={() => setService(item)} />)}</View>
      <View style={styles.card}><Text variant="title2">Visit type</Text>{provider.modes.map((item) => <Choice key={item} label={item === 'In person' ? 'Clinic visit' : item} selected={mode === item} onPress={() => setMode(item)} />)}</View>
      <View style={styles.card}><Text variant="title2">Choose a time</Text><Text variant="body" style={styles.body}>{demoDate} · India time (IST)</Text>{times.map((item) => <Choice key={item} label={item} selected={time === item} onPress={() => setTime(item)} />)}</View>
      <Action label="Review my visit" onPress={() => setStage('review')} />
    </> : null}
    {stage === 'review' ? <><Text variant="title1">Review your visit</Text><View style={styles.card}><Info icon="heart" title={service} /><Info icon="calendar" title={`${demoDate} · ${time} IST`} /><Info icon="map-pin" title={mode === 'In person' ? 'Clinic visit' : mode} /><Info icon="credit-card" title={`${provider.currency}${provider.price}${provider.priceSuffix ?? ''}`} /></View><Text variant="body" style={styles.body}>This saves a sample appointment. You will not be charged.</Text><Action label="Save demo appointment" onPress={confirm} /><Action label="Make a change" secondary onPress={() => setStage('choose')} /></> : null}
    {stage === 'saved' ? <View style={styles.success} accessibilityLiveRegion="polite"><View style={styles.successIcon}><Feather name="check" size={38} color={colors.blue} /></View><Text variant="title1" align="center">Sample visit saved.</Text><Text variant="body" align="center" style={styles.body}>{demoDate} · {time} IST{`\n`}{provider.name}</Text><Text variant="body" color={colors.textSecondary} align="center" style={styles.body}>Your sample visit is in My care.</Text><Action label="View appointment" onPress={() => router.replace(`/booking/${bookingId}`)} /><Action label="Back to My care" secondary onPress={() => router.replace('/care')} /></View> : null}
  </ScreenContainer>;
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={label} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}><Text variant="body" style={[styles.body, styles.flex]}>{label}</Text><Feather name={selected ? 'check-circle' : 'circle'} size={25} color={selected ? colors.blue : colors.textSecondary} /></Pressable>;
}
function Info({ icon, title }: { icon: FeatherIconName; title: string }) {
  return <View style={styles.info}><Feather name={icon} size={24} color={colors.blue} /><Text variant="body" style={[styles.body, styles.flex]}>{title}</Text></View>;
}
function Action({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.action, secondary && styles.secondary, pressed && styles.pressed]}><Text variant="headline" align="center" color={secondary ? colors.blue : colors.white}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  body: { fontSize: 19, lineHeight: 27 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.md },
  provider: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, minWidth: 0 },
  card: { padding: spacing.lg, gap: spacing.md, borderRadius: 18, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  info: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  choice: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 12, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  choiceSelected: { backgroundColor: colors.blueTint, borderColor: colors.blue },
  action: { minHeight: 60, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  secondary: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  notice: { padding: spacing.lg, backgroundColor: colors.blueTint, borderRadius: 12, fontSize: 18, lineHeight: 26 },
  success: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxl },
  successIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueTint },
  pressed: { opacity: 0.7 },
});
