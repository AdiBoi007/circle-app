import { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, IconButton, ScreenContainer, ScreenHeader } from '@/components';
import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function SavitaHome() {
  const { tasks, toggleTask, takenMedicationIds, toggleMedication } = useAppState();
  const [announcement, setAnnouncement] = useState('');
  const mobility = tasks.find((task) => task.id === 'mobility');
  const medicineTaken = takenMedicationIds.includes('savita-diclofenac');
  const thingsLeft = Number(!mobility?.completed) + Number(!medicineTaken);
  const todayCopy = thingsLeft === 0 ? 'You are all done for today.' : `You have ${thingsLeft} ${thingsLeft === 1 ? 'thing' : 'things'} to do today.`;

  const completeMobility = () => {
    if (mobility) toggleTask(mobility.id);
    setAnnouncement(mobility?.completed ? 'Mobility exercises marked not complete.' : 'Mobility exercises marked complete.');
  };
  const completeMedicine = () => {
    toggleMedication('savita-diclofenac');
    setAnnouncement(medicineTaken ? 'Evening medicine marked not taken.' : 'Evening medicine marked taken.');
  };

  const unread = useMemo(() => 1, []);

  return (
    <ScreenContainer bottomInset={132} contentStyle={styles.content}>
      <ScreenHeader
        eyebrow="CIRCLE BY SWASTH"
        title={`${greeting()}, Savita`}
        titleVariant="title1"
        subtitle={todayCopy}
        trailing={(
          <IconButton accessibilityLabel={`Notifications, ${unread} unread`} onPress={() => router.push('/notifications')} size={48}>
            <Feather name="bell" size={22} color={colors.textPrimary} />
          </IconButton>
        )}
      />

      {announcement ? (
        <View style={styles.confirmation} accessibilityLiveRegion="polite" accessible accessibilityLabel={announcement}>
          <Feather name="check-circle" size={21} color={colors.sage} />
          <Text variant="body" style={styles.bodyText}>{announcement}</Text>
        </View>
      ) : null}

      <View style={styles.todayCard}>
        <Text variant="title2">Today</Text>
        <TodayRow
          icon="repeat"
          title="Do your mobility exercises"
          supporting="10 minutes"
          completed={Boolean(mobility?.completed)}
          onPress={completeMobility}
        />
        <TodayRow
          icon="moon"
          title="Take your evening medicine"
          supporting="After dinner"
          completed={medicineTaken}
          onPress={completeMedicine}
        />
        <TodayRow
          icon="calendar"
          title="Physiotherapy appointment"
          supporting="14 July at 10:00 AM"
          action="View details"
          onPress={() => router.push('/booking/physio-savita')}
        />
      </View>

      <View style={styles.section}>
        <Text variant="title2">My health</Text>
        <Card padding={spacing.sm} elevation="none" bordered>
          <HealthRow icon="repeat" label="Mobility" interpretation={mobility?.completed ? 'Exercises completed today' : 'Exercises still to do'} />
          <View style={styles.divider} />
          <HealthRow icon="thermometer" label="Knee pain" interpretation="About the same" value="6 out of 10" onPress={() => router.push('/metric/savita/knee-pain')} />
          <View style={styles.divider} />
          <HealthRow icon="activity" label="Next check" interpretation="Blood pressure due tomorrow" />
        </Card>
      </View>

      <View style={styles.askCard}>
        <Pressable
          onPress={() => router.push('/ai')}
          accessibilityRole="button"
          accessibilityLabel="Ask Circle"
          accessibilityHint="Ask about medicines, reports or appointments"
          style={({ pressed }) => [styles.askMain, pressed && styles.pressed]}
        >
          <View style={styles.askCopy}>
            <Text variant="title2">Ask Circle</Text>
            <Text variant="body" color={colors.textSecondary} style={styles.bodyText}>Ask about medicines, reports or appointments.</Text>
          </View>
          <Feather name="arrow-right" size={24} color={colors.blue} />
        </Pressable>
        <View style={styles.askActions}>
          <Pressable onPress={() => router.push('/ai')} accessibilityRole="button" accessibilityLabel="Ask a question" style={({ pressed }) => [styles.askQuestion, pressed && styles.pressed]}>
            <Feather name="message-circle" size={21} color={colors.blue} />
            <Text variant="headline" color={colors.blue}>Ask a question</Text>
          </Pressable>
          <IconButton accessibilityLabel="Ask Circle using microphone" accessibilityHint="Starts a seeded voice question" onPress={() => router.push('/ai?prompt=What%20do%20I%20need%20to%20do%20today%3F')} size={48} elevation="none" background={colors.blueTint}>
            <Feather name="mic" size={22} color={colors.blue} />
          </IconButton>
          <IconButton accessibilityLabel="Upload a report" accessibilityHint="Take a photo or choose a document" onPress={() => router.push('/savita-upload')} size={48} elevation="none" background={colors.blueTint}>
            <Feather name="camera" size={22} color={colors.blue} />
          </IconButton>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="title2">Next appointment</Text>
        <Card padding={spacing.lg} elevation="none" bordered>
          <View style={styles.appointmentTop}>
            <View style={styles.appointmentIcon}><Feather name="calendar" size={24} color={colors.blue} /></View>
            <View style={styles.askCopy}>
              <Text variant="title3">Physiotherapy with Vikram Nair</Text>
              <Text variant="body" color={colors.textSecondary} style={styles.bodyText}>14 July · 10:00 AM</Text>
              <Text variant="body" color={colors.textSecondary} style={styles.bodyText}>Home visit</Text>
            </View>
          </View>
          <View style={styles.appointmentActions}>
            <Pressable onPress={() => router.push('/booking/physio-savita')} accessibilityRole="button" accessibilityLabel="View appointment details" style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}><Text variant="headline">View details</Text></Pressable>
            <Pressable onPress={() => router.push('/appointment-prep/physio-savita')} accessibilityRole="button" accessibilityLabel="Get ready for appointment" style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}><Text variant="headline" color={colors.white}>Get ready</Text></Pressable>
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

function TodayRow({ icon, title, supporting, completed, action, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; supporting: string; completed?: boolean; action?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${supporting}. ${completed ? 'Completed' : action ?? 'Mark complete'}`}
      accessibilityState={completed === undefined ? undefined : { checked: completed }}
      style={({ pressed }) => [styles.todayRow, pressed && styles.pressed]}
    >
      <View style={styles.todayIcon}><Feather name={completed ? 'check' : icon} size={23} color={completed ? colors.sage : colors.textPrimary} /></View>
      <View style={styles.askCopy}>
        <Text variant="headline" style={styles.rowTitle}>{title}</Text>
        <Text variant="body" color={colors.textSecondary} style={styles.bodyText}>{supporting}</Text>
      </View>
      <View style={styles.rowAction}>
        <Feather name={completed ? 'check-circle' : action ? 'chevron-right' : 'circle'} size={22} color={completed ? colors.sage : colors.textSecondary} />
        <Text variant="subhead" color={completed ? colors.sage : colors.textSecondary}>{completed ? 'Completed' : action ?? 'Mark complete'}</Text>
      </View>
    </Pressable>
  );
}

function HealthRow({ icon, label, interpretation, value, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; interpretation: string; value?: string; onPress?: () => void }) {
  const content = <><View style={styles.healthIcon}><Feather name={icon} size={22} color={colors.plum} /></View><View style={styles.askCopy}><Text variant="subhead" color={colors.textSecondary}>{label}</Text><Text variant="headline" style={styles.healthInterpretation}>{interpretation}</Text>{value ? <Text variant="body" color={colors.textSecondary} style={styles.bodyText}>{value}</Text> : null}</View>{onPress ? <Feather name="chevron-right" size={22} color={colors.textSecondary} /> : null}</>;
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}. ${interpretation}. ${value ?? ''}`} style={({ pressed }) => [styles.healthRow, pressed && styles.pressed]}>{content}</Pressable> : <View style={styles.healthRow}>{content}</View>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.xxl },
  bodyText: { fontSize: 18, lineHeight: 25 },
  confirmation: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.input, backgroundColor: colors.sageTint },
  todayCard: { gap: spacing.sm, padding: spacing.xl, borderRadius: radius.cardLarge, backgroundColor: '#E8EEE8', borderWidth: 1, borderColor: '#C8D7CC' },
  todayRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
  todayIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  rowTitle: { fontSize: 18, lineHeight: 24 },
  rowAction: { maxWidth: 92, alignItems: 'center', gap: spacing.xxs },
  section: { gap: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginHorizontal: spacing.md },
  healthRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  healthIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.plumTint },
  healthInterpretation: { fontSize: 18, lineHeight: 24 },
  askCard: { borderRadius: radius.cardLarge, backgroundColor: colors.blueTint, borderWidth: 1, borderColor: '#B8CCEF', overflow: 'hidden' },
  askMain: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.xl },
  askCopy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  askActions: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  askQuestion: { minHeight: 48, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.button, backgroundColor: colors.surface },
  appointmentTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  appointmentIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueTint },
  appointmentActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  secondaryAction: { minHeight: 52, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, backgroundColor: colors.surfaceMuted },
  primaryAction: { minHeight: 52, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, backgroundColor: colors.blue },
  pressed: { opacity: 0.7 },
});
