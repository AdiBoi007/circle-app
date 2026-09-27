import { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, DetailHeader, ScreenContainer, Text } from '@/components';
import { DemoNotice, PersonalAccess, PersonalButton, PersonalSection, ui } from '@/accounts/individual/PersonalUI';
import { individualProviders, individualSlotDates, personalDate, personalPrice, personalTime, personalTimeZoneLabel, type IndividualBooking } from '@/data/individual';
import { useAppState } from '@/state';
import { colors } from '@/theme';

export default function IndividualBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeAccountId, individualBookings, addIndividualBooking, updateIndividualBooking } = useAppState();
  const booking = individualBookings.find((item) => item.id === id);
  const provider = individualProviders.find((item) => item.id === (booking?.providerId ?? id));
  const [mode, setMode] = useState<IndividualBooking['mode']>(provider?.modes[0] ?? 'Online');
  const [date, setDate] = useState(individualSlotDates[0]);
  const [time, setTime] = useState('');
  const [review, setReview] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const submitted = useRef(false);
  if (activeAccountId !== 'riya') return <PersonalAccess />;
  if (!provider) return <ScreenContainer><DetailHeader title="Appointment" /><Text>We couldn’t find this sample appointment.</Text><PersonalButton title="My appointments" onPress={() => router.replace('/personal/bookings')} /></ScreenContainer>;
  const occupied = (slot: string) => individualBookings.some((item) => item.status === 'Confirmed' && item.date === date && item.time === slot);
  const confirm = () => {
    if (submitted.current) return;
    if (!time || occupied(time)) { setError('That time is already in your diary. Please choose another time.'); setReview(false); return; }
    submitted.current = true;
    const newId = `riya-${provider.id}-${date}-${time.replace(':', '')}-${individualBookings.length}`;
    addIndividualBooking({ id: newId, providerId: provider.id, service: `${provider.title} consultation`, date, time, mode, status: 'Confirmed' });
    router.replace(`/personal/booking/${newId}`);
  };
  return <ScreenContainer bottomInset={40} contentStyle={ui.page}>
    <DetailHeader title={booking ? 'Your appointment' : review ? 'Review your appointment' : 'Choose your time'} />
    <View style={[ui.card, ui.row]}><Avatar name={provider.portrait} size={64} /><View style={ui.flex}><Text variant="title3">{provider.name}</Text><Text variant="subhead" color={colors.textSecondary}>{provider.title}</Text><Text variant="footnote" color={colors.textSecondary}>{provider.duration} minutes · {personalPrice(provider.price)}</Text></View></View>
    <DemoNotice />
    {booking ? <>
      <View style={[ui.card, { backgroundColor: colors.surface, gap: 16 }]}><View style={ui.row}><Feather name={booking.status === 'Cancelled' ? 'x-circle' : 'check-circle'} size={28} color={colors.blue} /><Text variant="title2" style={{ flex: 1, minWidth: 0 }}>{booking.status === 'Cancelled' ? 'Demo booking cancelled' : 'You’re in the diary'}</Text></View><Text variant="body">{personalDate(booking.date)} · {personalTime(booking.time)}</Text><Text variant="subhead" color={colors.textSecondary}>{personalTimeZoneLabel}</Text><View style={ui.row}><Feather name={booking.mode === 'Online' ? 'video' : 'map-pin'} size={20} color={colors.blue} /><Text variant="body" style={{ flex: 1, minWidth: 0 }}>{booking.mode === 'Online' ? 'Online consultation' : provider.location}</Text></View><Text variant="footnote" color={colors.textSecondary}>{booking.status === 'Cancelled' ? 'Your demo diary has been updated.' : 'Saved in your demo diary. No practitioner has been contacted, no payment was taken, and there is no live meeting link.'}</Text></View>
      {booking.status === 'Confirmed' ? <PersonalSection title="Before your appointment"><Text variant="callout" color={colors.textSecondary}>Bring your questions and anything you want to talk about. It’s okay to start with what feels most useful.</Text><PersonalButton title="Prepare my questions" onPress={() => router.push(`/ai?prompt=${encodeURIComponent(`Help me prepare for my ${provider.title.toLowerCase()} appointment`)}`)} secondary /></PersonalSection> : null}
      <PersonalButton title="See all appointments" onPress={() => router.replace('/personal/bookings')} />
      {booking.status === 'Confirmed' && !cancelling ? <Pressable onPress={() => setCancelling(true)} accessibilityRole="button" style={ui.textAction}><Text variant="headline" color={colors.red}>Cancel demo appointment</Text></Pressable> : null}
      {booking.status === 'Confirmed' && cancelling ? <View style={[ui.card, { gap: 14 }]}><Text variant="headline">Remove this from your demo diary?</Text><PersonalButton title="Yes, cancel appointment" onPress={() => { updateIndividualBooking(booking.id, { status: 'Cancelled' }); setCancelling(false); }} /><PersonalButton title="Keep appointment" secondary onPress={() => setCancelling(false)} /></View> : null}
    </> : review ? <>
      <Text variant="title2">Review details</Text><View style={[ui.card, { gap: 16 }]}><SummaryRow label="Practitioner" value={`${provider.name} · ${provider.title}`} /><SummaryRow label="When" value={`${personalDate(date)} at ${personalTime(time)}`} /><SummaryRow label="Time zone" value={personalTimeZoneLabel} /><SummaryRow label="Where" value={mode === 'Online' ? 'Online consultation' : provider.location} /><SummaryRow label="Example price" value={`${personalPrice(provider.price)} · ${provider.duration} minutes`} /></View><Text variant="callout" color={colors.textSecondary}>This adds an appointment to Riya’s demo diary. No payment details are needed.</Text><PersonalButton title="Confirm demo appointment" onPress={confirm} /><PersonalButton title="Change date or time" secondary onPress={() => setReview(false)} />
    </> : <>
      <Text variant="title2">Book an appointment</Text>
      <PersonalSection title="Consultation"><View style={styles.choices}>{provider.modes.map((item) => <Choice key={item} title={item} selected={mode === item} onPress={() => setMode(item)} />)}</View><Text variant="footnote" color={colors.textSecondary}>{mode === 'Online' ? 'A video session from wherever you feel comfortable.' : `A local appointment in ${provider.location}.`}</Text></PersonalSection>
      <PersonalSection title="Date"><View style={styles.choices}>{individualSlotDates.map((item) => <Choice key={item} title={personalDate(item, true)} selected={date === item} onPress={() => { setDate(item); setTime(''); setError(''); }} />)}</View></PersonalSection>
      <PersonalSection title="Time"><Text variant="footnote" color={colors.textSecondary}>{personalTimeZoneLabel}</Text><View style={styles.choices}>{provider.slots.map((slot) => <Choice key={slot} title={`${personalTime(slot)}${occupied(slot) ? ' · Busy' : ''}`} selected={time === slot} disabled={occupied(slot)} onPress={() => { setTime(slot); setError(''); }} />)}</View></PersonalSection>
      {error ? <Text color={colors.red} accessibilityLiveRegion="polite">{error}</Text> : null}
      <PersonalButton title="Review appointment" disabled={!time} onPress={() => setReview(true)} />
    </>}
  </ScreenContainer>;
}

function Choice({ title, selected, onPress, disabled = false }: { title: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} style={[styles.choice, selected && styles.selected, disabled && { opacity: 0.45 }]}><Text variant="subhead" align="center" color={selected ? colors.white : colors.blue}>{title}</Text></Pressable>;
}
function SummaryRow({ label, value }: { label: string; value: string }) { return <View style={{ gap: 3 }}><Text variant="footnote" color={colors.textSecondary}>{label}</Text><Text variant="headline">{value}</Text></View>; }
const styles = StyleSheet.create({ choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, choice: { minHeight: 48, flexBasis: '28%', flexGrow: 1, minWidth: 82, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface }, selected: { backgroundColor: colors.blue, borderColor: colors.blue } });
