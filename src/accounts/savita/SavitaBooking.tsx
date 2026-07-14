import { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, DetailHeader, ProgressBar, ScreenContainer } from '@/components';
import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { providerById } from '@/data';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';
import type { Booking, CareMode } from '@/types';

const steps = ['Choose service', 'Choose time', 'Review booking', 'Confirmed'] as const;

export function SavitaBooking() {
  const { id, providerId: queryProvider } = useLocalSearchParams<{ id: string; providerId?: string }>();
  const { bookings, addBooking } = useAppState();
  const existing = bookings.find((booking) => booking.id === id);
  const provider = providerById(existing?.providerId ?? queryProvider ?? 'arvind-nair');
  const [step, setStep] = useState(0);
  const [service, setService] = useState(provider?.services[0] ?? 'Physiotherapy visit');
  const [time, setTime] = useState('10:00 AM');
  const [mode, setMode] = useState<CareMode>(provider?.modes[0] ?? 'Home visit');
  const [bookingId, setBookingId] = useState('');
  const bookingSequence = useRef(0);

  if (!provider) return <ScreenContainer><DetailHeader title="Booking" /><Text variant="body">Professional not found.</Text></ScreenContainer>;
  const displayName = existing?.id === 'physio-savita' ? 'Vikram Nair' : provider.name;

  if (existing && id !== 'new') {
    return (
      <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
        <DetailHeader title="Appointment" />
        <View style={styles.hero}><Avatar name={provider.name} accent={provider.accent} size={86} /><Text variant="title1" align="center">{displayName}</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>{existing.service}</Text></View>
        <Card elevation="none" bordered>
          <Info icon="calendar" title={`${existing.date}, ${existing.time}`} />
          <View style={styles.divider} />
          <Info icon="map-pin" title={existing.mode} />
          <View style={styles.divider} />
          <Info icon="check-circle" title={existing.status} />
        </Card>
        <Button title="Get ready" onPress={() => router.push(`/appointment-prep/${existing.id}`)} />
        <Button title="Back to My Health" variant="secondary" onPress={() => router.replace('/')} />
      </ScreenContainer>
    );
  }

  const confirm = () => {
    const newId = `savita-booking-${provider.id}-${++bookingSequence.current}`;
    const booking: Booking = { id: newId, providerId: provider.id, memberId: 'savita', service, date: '18 July 2026', time, mode, status: 'Confirmed' };
    addBooking(booking);
    setBookingId(newId);
    setStep(3);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
      <DetailHeader title="Book care" />
      <View style={styles.provider}><Avatar name={provider.name} accent={provider.accent} size={58} /><View style={styles.flex}><Text variant="title3">{provider.name}</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>{provider.title}</Text></View></View>
      <Text variant="headline" color={colors.textSecondary}>STEP {step + 1} OF 4 · {steps[step]}</Text>
      <ProgressBar progress={(step + 1) / 4} accent="blue" accessibilityLabel={`Step ${step + 1} of 4, ${steps[step]}`} />

      {step === 0 ? <Card elevation="none" bordered style={styles.stepCard}><Text variant="title2">Choose service</Text>{provider.services.slice(0, 3).map((item) => <Choice key={item} label={item} selected={service === item} onPress={() => setService(item)} />)}<Text variant="title3" style={styles.subheading}>Visit type</Text>{provider.modes.map((item) => <Choice key={item} label={item === 'In person' ? 'Clinic visit' : item} selected={mode === item} onPress={() => setMode(item)} />)}</Card> : null}
      {step === 1 ? <Card elevation="none" bordered style={styles.stepCard}><Text variant="title2">Choose time</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>18 July 2026</Text>{['10:00 AM', '2:00 PM', '6:30 PM'].map((item) => <Choice key={item} label={item} selected={time === item} onPress={() => setTime(item)} />)}</Card> : null}
      {step === 2 ? <Card elevation="none" bordered style={styles.stepCard}><Text variant="title2">Review booking</Text><Info icon="user" title={provider.name} /><Info icon="heart" title={service} /><Info icon="calendar" title={`18 July 2026 · ${time}`} /><Info icon="map-pin" title={mode === 'In person' ? 'Clinic visit' : mode} /><Info icon="credit-card" title={`${provider.currency}${provider.price}`} /></Card> : null}
      {step === 3 ? <View style={styles.success} accessibilityLiveRegion="polite"><View style={styles.successIcon}><Feather name="check" size={36} color={colors.white} /></View><Text variant="title1" align="center">Your booking is confirmed.</Text><Text variant="body" color={colors.textSecondary} align="center" style={styles.body}>{provider.name} · 18 July at {time}</Text><View style={styles.full}><Button title="View booking" onPress={() => router.replace(`/booking/${bookingId}`)} /><Button title="Back to Care" variant="secondary" onPress={() => router.replace('/care')} /></View></View> : null}

      {step < 3 ? <View style={styles.buttons}><Button title={step === 2 ? 'Confirm booking' : 'Continue'} onPress={step === 2 ? confirm : () => setStep((value) => value + 1)} /><Button title="Back" variant="secondary" disabled={step === 0} onPress={() => setStep((value) => value - 1)} /></View> : null}
    </ScreenContainer>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={label} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}><Text variant="body" style={styles.body}>{label}</Text><Feather name={selected ? 'check-circle' : 'circle'} size={24} color={selected ? colors.blue : colors.textSecondary} /></Pressable>;
}
function Info({ icon, title }: { icon: keyof typeof Feather.glyphMap; title: string }) {
  return <View style={styles.info}><Feather name={icon} size={22} color={colors.blue} /><Text variant="body" style={[styles.body, styles.flex]}>{title}</Text></View>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  body: { fontSize: 18, lineHeight: 26 },
  hero: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  provider: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, minWidth: 0 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginVertical: spacing.md },
  info: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepCard: { gap: spacing.md },
  subheading: { marginTop: spacing.md },
  choice: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.input, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: 'transparent' },
  choiceSelected: { backgroundColor: colors.blueTint, borderColor: colors.blue },
  buttons: { gap: spacing.md },
  success: { minHeight: 440, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  successIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  full: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.lg },
  pressed: { opacity: 0.7 },
});
