import { PracticeDirectoryCard } from '@/practitioner/PracticeDirectoryCard';
import { ConsumerPracticeRequests } from '@/practitioner/ConsumerPracticeRequests';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, ScreenContainer } from '@/components';
import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { careProfessionals, providerById } from '@/data';
import { ExperienceHeader } from '@/experience/ExperienceHeader';
import { useAppState } from '@/state';
import { bookingTimeValue, fixtureDateValue } from '@/utils/bookingTime';
import { colors, spacing } from '@/theme';

export function SavitaCare() {
  const { bookings } = useAppState();
  const [browse, setBrowse] = useState(false);
  const [history, setHistory] = useState(false);
  const appointments = bookings.filter((item) => item.memberId === 'savita' && item.status === 'Confirmed').sort((a, b) => bookingTimeValue(a) - bookingTimeValue(b));
  const past = bookings.filter((item) => item.memberId === 'savita' && item.status !== 'Confirmed').sort((a, b) => fixtureDateValue(b.date) - fixtureDateValue(a.date));
  const recommended = careProfessionals.filter((provider) => provider.id !== 'arvind-nair' && provider.recommendedFor.includes('savita')).slice(0, 3);

  return <ScreenContainer bottomInset={36} contentStyle={styles.content}>
    <ExperienceHeader title="My care" />
    <ConsumerPracticeRequests />
    <PracticeDirectoryCard />
    <Text variant="title2">Upcoming appointments</Text>
    {appointments.length ? appointments.map((appointment) => {
      const provider = providerById(appointment.providerId);
      return <View key={appointment.id} style={styles.card}>
        <View style={styles.date}><View style={styles.calendarIcon}><Feather name="calendar" size={24} color={colors.blue} /></View><View style={styles.flex}><Text variant="headline">{appointment.date}</Text><Text variant="body" style={styles.body}>{appointment.time} · India time</Text></View></View>
        <Text variant="title2">{appointment.service}</Text>
        <View style={styles.provider}><Avatar name={provider?.name ?? 'Care professional'} accent={provider?.accent ?? 'blue'} size={44} /><View style={styles.flex}><Text variant="headline">{provider?.name ?? 'Care professional'}</Text><Text variant="body" style={styles.body} color={colors.textSecondary}>{appointment.mode === 'In person' ? 'Clinic visit' : appointment.mode}</Text></View></View>
        <Pressable onPress={() => router.push(`/appointment-prep/${appointment.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text variant="headline" color={colors.white}>Get ready for my visit</Text></Pressable>
        <Pressable onPress={() => router.push(`/booking/${appointment.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text variant="headline" color={colors.blue} style={styles.flex}>View or change appointment</Text><Feather name="chevron-right" size={22} color={colors.blue} /></Pressable>
      </View>;
    }) : <View style={styles.card}><Text variant="title3">No appointments booked</Text><Text variant="body" style={styles.body}>Find care below, or ask Arjun to help.</Text></View>}

    <Pressable onPress={() => router.push('/ai?prompt=Help%20me%20ask%20Arjun%20to%20arrange%20an%20appointment.')} accessibilityRole="button" style={({ pressed }) => [styles.help, pressed && styles.pressed]}><View style={styles.familyIcon}><Feather name="heart" size={24} color={colors.plum} /></View><Text variant="headline" style={styles.flex}>Ask Arjun for help</Text><Feather name="chevron-right" size={22} color={colors.textTertiary} /></Pressable>

    <View style={styles.options}>
      <Pressable onPress={() => setBrowse((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: browse }} style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}><Feather name="search" size={24} color={colors.blue} /><Text variant="headline" style={styles.flex}>Find care</Text><Feather name={browse ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textTertiary} /></Pressable>
      {past.length ? <><View style={styles.divider} /><Pressable onPress={() => setHistory((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: history }} style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}><Feather name="clock" size={24} color={colors.blue} /><Text variant="headline" style={styles.flex}>Past appointments</Text><Feather name={history ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textTertiary} /></Pressable></> : null}
    </View>
    {browse ? <View style={styles.list}><Text variant="title2">Care professionals</Text><Text variant="body" style={styles.body} color={colors.textSecondary}>Sample profiles for this demo.</Text>{recommended.map((provider) => <View key={provider.id} style={styles.card}>
      <View style={styles.provider}><Avatar name={provider.name} accent={provider.accent} size={48} /><View style={styles.flex}><Text variant="headline">{provider.name}</Text><Text variant="body" style={styles.body}>{provider.title}</Text></View></View>
      <Text variant="body" style={styles.body} color={colors.textSecondary}>{provider.languages.join(' · ')}{`\n`}{provider.modes.map((mode) => mode === 'In person' ? 'Clinic visit' : mode).join(' · ')}</Text>
      <View style={styles.priceRow}><Text variant="headline">{provider.currency}{provider.price}{provider.priceSuffix ?? ''}</Text><Pressable onPress={() => router.push(`/provider/${provider.id}?memberId=savita`)} accessibilityRole="button" accessibilityLabel={`View ${provider.name}`} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}><Text variant="headline" color={colors.blue}>View profile</Text><Feather name="chevron-right" size={20} color={colors.blue} /></Pressable></View>
    </View>)}</View> : null}
    {history ? <View style={styles.list}><Text variant="title2">Past appointments</Text><View style={styles.options}>{past.map((appointment, index) => <View key={appointment.id}>{index > 0 ? <View style={styles.divider} /> : null}<Pressable onPress={() => router.push(`/booking/${appointment.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.pastRow, pressed && styles.pressed]}><View style={styles.flex}><Text variant="headline">{appointment.service}</Text><Text variant="body" style={styles.body} color={colors.textSecondary}>{appointment.date} · {appointment.status}</Text></View><Feather name="chevron-right" size={22} color={colors.textTertiary} /></Pressable></View>)}</View></View> : null}
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  body: { fontSize: 18, lineHeight: 25 },
  flex: { flex: 1, minWidth: 0, gap: 4 },
  card: { padding: spacing.lg, backgroundColor: colors.surface, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing.md },
  date: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  calendarIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
  provider: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  primary: { minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.blue, borderRadius: 12, marginTop: spacing.sm },
  secondary: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm },
  help: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: 18, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  familyIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.plumTint, alignItems: 'center', justifyContent: 'center' },
  options: { borderRadius: 18, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' },
  disclosure: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.lg },
  pastRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  profileButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  list: { gap: spacing.md },
  pressed: { opacity: 0.65 },
});
