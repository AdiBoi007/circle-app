import { ConsumerPracticeRequests } from '@/practitioner/ConsumerPracticeRequests';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { launchMarket } from '@/config/launch';
import { ScreenContainer, Text } from '@/components';
import { individualHabits, nextPersonalBooking } from '@/data/individual';
import { ExperienceHeader } from '@/experience/ExperienceHeader';
import { useAppState } from '@/state';
import { colors } from '@/theme';
import { categoryAppearance, DemoNotice, PersonalBookingCard, PersonalButton, PersonalSection, ui } from './PersonalUI';

const habitLabels = ['20-minute walk', 'Drink water', 'Wind down'];
const habitDetails = ['Get outside for some fresh air', 'Finish your second bottle', '10 quiet minutes before bed'];

export function IndividualHome() {
  const { completedHabitIds, toggleHabit, individualBookings } = useAppState();
  const { fontScale } = useWindowDimensions();
  const completed = individualHabits.filter((habit) => completedHabitIds.includes(habit.id)).length;
  const nextBooking = nextPersonalBooking(individualBookings);

  return <ScreenContainer bottomInset={32} contentStyle={ui.page}>
    <ExperienceHeader title="Summary" subtitle={`${launchMarket.city} · Friday, 25 September`} />

    <PersonalSection title="Highlights" action="All health" onPress={() => router.push('/health')}>
      <View style={[styles.metrics, fontScale > 1.2 && { flexDirection: 'column' }]}>
        <Pressable onPress={() => router.push('/personal/records?section=sleep')} accessibilityRole="button" accessibilityLabel="Sleep: 7 hours 20 minutes, sample night, 24 September. View details." style={({ pressed }) => [styles.metric, pressed && ui.pressed]}>
          <View style={styles.metricHeader}><Feather name="moon" size={18} color={colors.plum} /><Text variant="headline" color={colors.plum} style={{ flex: 1 }}>Sleep</Text><Feather name="chevron-right" size={16} color={colors.textSecondary} /></View>
          <View style={styles.valueRow}><Text style={styles.metricValue}>7<Text variant="subhead" color={colors.textSecondary}> hr </Text>20<Text variant="subhead" color={colors.textSecondary}> min</Text></Text></View>
          <Text variant="footnote" color={colors.textSecondary}>24 September</Text>
          <View style={styles.sleepTrack}><View style={styles.sleepBand} /></View>
          <View style={ui.between}><Text variant="caption" color={colors.textSecondary}>11:10 pm</Text><Text variant="caption" color={colors.textSecondary}>6:30 am</Text></View>
        </Pressable>
        <Pressable onPress={() => router.push('/personal/records?section=movement')} accessibilityRole="button" accessibilityLabel="Steps: 6,420 of an 8,000 step example goal, 24 September. View details." style={({ pressed }) => [styles.metric, pressed && ui.pressed]}>
          <View style={styles.metricHeader}><Feather name="activity" size={18} color={colors.red} /><Text variant="headline" color={colors.red} style={{ flex: 1 }}>Steps</Text><Feather name="chevron-right" size={16} color={colors.textSecondary} /></View>
          <View style={styles.valueRow}><Text style={styles.metricValue}>6,420</Text></View>
          <Text variant="footnote" color={colors.textSecondary}>of 8,000 · sample goal</Text>
          <View style={styles.stepsTrack}><View style={styles.stepsFill} /></View>
          <View style={ui.between}><Text variant="caption" color={colors.textSecondary}>24 September</Text><Text variant="caption" color={colors.red}>80%</Text></View>
        </Pressable>
      </View>
    </PersonalSection>

    <PersonalSection title="Today’s habits" action={`${completed} of 3`} onPress={() => router.push('/health')}>
      <View style={styles.group}>
        <View style={styles.habitProgress} accessible accessibilityLabel={`${completed} of 3 habits complete`}>{individualHabits.map((habit) => <View key={habit.id} style={[styles.progressSegment, completedHabitIds.includes(habit.id) && styles.progressComplete]} />)}</View>
        {individualHabits.map((habit, index) => {
          const done = completedHabitIds.includes(habit.id);
          return <Pressable key={habit.id} onPress={() => toggleHabit(habit.id)} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={habit.title} style={({ pressed }) => [styles.habit, index > 0 && styles.habitBorder, pressed && ui.pressed]}>
            <View style={[styles.habitIcon, { backgroundColor: done ? colors.blue : colors.surfaceMuted }]}><Feather name={done ? 'check' : habit.icon} size={20} color={done ? colors.white : colors.blue} /></View>
            <View style={ui.flex}><Text variant="headline" color={done ? colors.textSecondary : colors.textPrimary}>{habitLabels[index]}</Text><Text variant="footnote" color={colors.textSecondary}>{done ? 'Completed · tap to undo' : habitDetails[index]}</Text></View>
            <Feather name={done ? 'check-circle' : 'circle'} size={24} color={done ? colors.blue : colors.textSecondary} />
          </Pressable>;
        })}
      </View>
    </PersonalSection>

    <ConsumerPracticeRequests limit={2} activeOnly />

    <PersonalSection title="Next appointment" action="See all" onPress={() => router.push('/personal/bookings')}>
      {nextBooking ? <PersonalBookingCard booking={nextBooking} /> : <View style={[ui.card, { gap: 12 }]}><Text variant="callout" color={colors.textSecondary}>No upcoming appointments.</Text><PersonalButton title="Find care" onPress={() => router.push('/care')} /></View>}
    </PersonalSection>

    <PersonalSection title="Find care" action="See all" onPress={() => router.push('/care')}>
      <View style={styles.careGroup}>{(['Therapy', 'Fitness', 'Nutrition'] as const).map((category, index) => {
        const appearance = categoryAppearance[category];
        return <Pressable key={category} onPress={() => router.push(`/care?category=${category}`)} accessibilityRole="button" accessibilityLabel={`Find ${category.toLowerCase()} practitioners`} style={({ pressed }) => [styles.careRow, index > 0 && styles.habitBorder, pressed && ui.pressed]}><View style={[styles.categoryIcon, { backgroundColor: appearance.tint }]}><Feather name={appearance.icon} size={20} color={appearance.color} /></View><Text variant="body" style={ui.flex}>{category}</Text><Text variant="footnote" color={colors.textSecondary}>{category === 'Therapy' ? 'Talk it through' : category === 'Fitness' ? 'Build strength' : 'Eat well'}</Text><Feather name="chevron-right" size={18} color={colors.textSecondary} /></Pressable>;
      })}</View>
    </PersonalSection>

    <View style={styles.shortcuts}><Pressable onPress={() => router.push('/personal/records')} accessibilityRole="button" style={styles.shortcut}><Feather name="folder" size={23} color={colors.blue} /><Text variant="headline" color={colors.blue}>My records</Text></Pressable><Pressable onPress={() => router.push('/ai?prompt=Help%20me%20plan%20a%20gentle%20week')} accessibilityRole="button" style={styles.shortcut}><Feather name="message-circle" size={23} color={colors.blue} /><Text variant="headline" color={colors.blue}>Ask Circle</Text></Pressable></View>
    <DemoNotice compact />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { flex: 1, minWidth: 138, backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 7 },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  valueRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
  metricValue: { fontSize: 30, lineHeight: 36, fontWeight: '600', letterSpacing: -1, flexShrink: 1 },
  sleepTrack: { height: 20, borderRadius: 5, backgroundColor: colors.plumTint, justifyContent: 'center', marginTop: 14, marginBottom: 4 },
  sleepBand: { height: 12, marginHorizontal: 4, borderRadius: 4, backgroundColor: colors.plum },
  stepsTrack: { height: 20, borderRadius: 5, backgroundColor: colors.redTint, marginTop: 14, marginBottom: 4, overflow: 'hidden' },
  stepsFill: { height: 20, width: '80.25%', borderRadius: 5, backgroundColor: colors.red },
  group: { backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16 },
  habitProgress: { flexDirection: 'row', gap: 5, paddingTop: 16, paddingBottom: 4 },
  progressSegment: { height: 4, flex: 1, borderRadius: 3, backgroundColor: colors.surfaceMuted },
  progressComplete: { backgroundColor: colors.blue },
  habit: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, minHeight: 76 },
  habitBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  habitIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  careGroup: { backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16 },
  careRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 62, paddingVertical: 10, flexWrap: 'wrap' },
  categoryIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shortcut: { flex: 1, minWidth: 130, minHeight: 85, padding: 16, borderRadius: 16, backgroundColor: colors.surface, gap: 10 },
});
