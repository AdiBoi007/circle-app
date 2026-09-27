import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DetailHeader, ScreenContainer } from '@/components';
import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { providerById } from '@/data';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';

export default function AppointmentPreparationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeAccountId, bookings, medications } = useAppState();
  const booking = bookings.find((item) => item.id === id && (activeAccountId === 'arjun' || item.memberId === activeAccountId));
  const provider = booking ? providerById(booking.providerId) : undefined;
  const medicines = medications.filter((medicine) => medicine.memberId === booking?.memberId && !medicine.archived && !medicine.name.toLowerCase().includes('reminder'));
  const questions = provider?.category === 'physiotherapy' ? ['Which exercises should I practise at home?', 'What should I do if an exercise hurts?', 'When should we meet again?'] : ['What would you like to know about my health?', 'What should I do before our next visit?', 'When should we meet again?'];

  if (!booking || !provider) return <ScreenContainer contentStyle={styles.content}><DetailHeader title="Get ready" /><Text variant="title2">Appointment unavailable</Text><Text variant="body" style={styles.body}>Open an appointment from your care list to get ready.</Text></ScreenContainer>;

  return <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
    <DetailHeader title="Get ready" />
    <View style={styles.heading}><Text variant="title1">Before your visit</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>{booking.service} with {provider.name}</Text></View>
    <View style={styles.appointment}><Text variant="title3">{booking.date} · {booking.time}</Text><Text variant="body" style={styles.body}>IST (UTC+05:30) · {booking.mode === 'In person' ? 'Clinic visit' : booking.mode}</Text>{booking.status !== 'Confirmed' ? <Text variant="headline">This appointment is {booking.status.toLowerCase()}.</Text> : null}</View>
    <View style={styles.section}><Text variant="title2">Your medicines</Text><View style={styles.card}>{medicines.length ? medicines.map((medicine) => <View key={medicine.id} style={styles.medicine}><Text variant="headline">{medicine.name}</Text><Text variant="body" style={styles.body} color={colors.textSecondary}>{medicine.dose} · {medicine.schedule}</Text></View>) : <Text variant="body" style={styles.body}>Your saved list has no active medicines. Bring any current prescription or medicine packaging.</Text>}<Text variant="body" color={colors.textSecondary} style={styles.body}>Mention any changes to this list.</Text></View></View>
    <View style={styles.section}><Text variant="title2">How you feel</Text><View style={styles.card}><Text variant="body" style={styles.body}>What has changed since your last visit? Make a note to discuss when you meet.</Text></View></View>
    <View style={styles.section}><Text variant="title2">Questions to ask</Text><View style={styles.card}>{questions.map((question) => <View key={question} style={styles.question}><Feather name="message-circle" size={24} color={colors.blue} /><Text variant="body" style={[styles.body, styles.flex]}>{question}</Text></View>)}</View></View>
    <Pressable onPress={() => router.replace(`/booking/${booking.id}`)} accessibilityRole="button" style={({ pressed }) => [styles.done, pressed && styles.pressed]}><Text variant="headline" color={colors.white}>Back to my appointment</Text></Pressable>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  heading: { gap: spacing.md },
  body: { fontSize: 19, lineHeight: 27 },
  appointment: { padding: spacing.lg, borderRadius: 18, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing.sm },
  card: { padding: spacing.lg, borderRadius: 18, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: spacing.lg },
  flex: { flex: 1, minWidth: 0 },
  section: { gap: spacing.md },
  medicine: { gap: spacing.xs, paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  question: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  done: { minHeight: 60, padding: spacing.lg, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue },
  pressed: { opacity: 0.7 },
});
