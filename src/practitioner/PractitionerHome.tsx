import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, ScreenContainer, Text } from '@/components';
import { practiceDateLabel, practiceDemoDate, practiceDemoNow, practiceRequestEnd, practiceSetupIssues, practiceTimeLabel } from '@/practitioner/model';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';
import type { FeatherIconName } from '@/types';

export function PractitionerHome() {
  const { practice } = useAppState();
  const pending = practice.requests.filter((request) => request.status === 'Requested');
  const confirmed = practice.requests.filter((request) => request.status === 'Confirmed');
  const today = confirmed.filter((request) => request.date === practiceDemoDate);
  const next = confirmed.filter((request) => practiceRequestEnd(request) > Date.parse(practiceDemoNow))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  const activeServices = practice.services.filter((service) => service.active);
  const openDays = practice.hours.filter((day) => day.enabled).length;
  const setupIssues = practiceSetupIssues(practice);

  return <ScreenContainer bottomInset={36} contentStyle={styles.page}>
    <Text variant="largeTitle" accessibilityRole="header">My practice</Text>
    <View style={styles.demo}><Feather name="briefcase" size={16} color={colors.textSecondary} /><Text variant="footnote" color={colors.textSecondary} style={styles.flex}>Demo workspace · Chandigarh · IST</Text></View>
    <Text variant="callout" color={colors.textSecondary}>{practice.profile.name}{`\n`}{practiceDateLabel(practiceDemoDate)}</Text>

    <View style={styles.inbox}>
      <View style={styles.inboxTop}><View style={styles.inboxIcon}><Feather name="inbox" size={28} color={colors.blue} /></View><Text variant="largeTitle" color={colors.blue}>{pending.length}</Text></View>
      <Text variant="title2">{pending.length === 1 ? 'Request to review' : 'Requests to review'}</Text>
      <Text variant="callout" color={colors.textSecondary}>{pending.length ? 'Review the visit details, then confirm or decline.' : 'New appointment requests will appear here.'}</Text>
      <Button title={pending.length ? 'Review requests' : 'View all requests'} onPress={() => router.push(`/practice/requests?status=${pending.length ? 'Requested' : 'All'}`)} style={styles.button} />
    </View>

    <View style={styles.stats}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${today.length} confirmed visits today. View confirmed appointments.`} onPress={() => router.push('/practice/requests?status=Confirmed')} style={({ pressed }) => [styles.stat, pressed && styles.pressed]}><Feather name="calendar" size={22} color={colors.blue} /><Text variant="title1">{today.length}</Text><Text variant="callout" color={colors.textSecondary}>Confirmed today</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`${activeServices.length} active services. Manage services.`} onPress={() => router.push('/practice/services')} style={({ pressed }) => [styles.stat, pressed && styles.pressed]}><Feather name="layers" size={22} color={colors.plum} /><Text variant="title1">{activeServices.length}</Text><Text variant="callout" color={colors.textSecondary}>Active services</Text></Pressable>
    </View>

    <View style={styles.section}>
      <Text variant="title2">Next confirmed visit</Text>
      {next ? <View style={styles.card}>
        <View style={styles.row}><View style={styles.avatar}><Text variant="title3" color={colors.blue}>{next.recipientName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</Text></View><View style={styles.flex}><Text variant="title3">{next.recipientName}</Text><Text variant="callout" color={colors.textSecondary}>{next.serviceName}</Text></View></View>
        <Text variant="headline">{practiceDateLabel(next.date)} · {practiceTimeLabel(next.time)}</Text>
        <Text variant="callout" color={colors.textSecondary}>{next.mode} · {next.durationMinutes} minutes · IST</Text>
        <Button title="View appointment" variant="secondary" onPress={() => router.push(`/practice/request/${next.id}`)} style={styles.button} />
      </View> : <View style={styles.card}><Text variant="headline">No upcoming confirmed visits</Text><Text variant="callout" color={colors.textSecondary}>Confirmed requests will appear here.</Text></View>}
    </View>

    {setupIssues.length > 0 ? <View style={styles.setup}><Text variant="headline">Finish your setup</Text>{setupIssues.map((issue, index) => <View key={`${index}-${issue}`} style={styles.row}><Feather name="info" size={18} color={colors.amber} /><Text variant="callout" style={styles.flex}>{issue}</Text></View>)}</View> : null}

    <View style={styles.section}>
      <Text variant="title2">Manage your practice</Text>
      <View style={styles.group}>
        <Shortcut icon="user" title="Profile" detail={practice.profile.acceptingRequests ? 'Accepting appointment requests' : 'Appointment requests are paused'} onPress={() => router.push('/practice/profile')} />
        <View style={styles.divider} />
        <Shortcut icon="layers" title="Services & fees" detail={`${activeServices.length} active ${activeServices.length === 1 ? 'service' : 'services'}`} onPress={() => router.push('/practice/services')} />
        <View style={styles.divider} />
        <Shortcut icon="clock" title="Availability" detail={`${openDays} ${openDays === 1 ? 'day' : 'days'} a week · ${practice.blockedDates.length} closed dates`} onPress={() => router.push('/practice/availability')} />
      </View>
    </View>
  </ScreenContainer>;
}

function Shortcut({ icon, title, detail, onPress }: { icon: FeatherIconName; title: string; detail: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}><Feather name={icon} size={23} color={colors.blue} /><View style={styles.flex}><Text variant="headline">{title}</Text><Text variant="callout" color={colors.textSecondary}>{detail}</Text></View><Feather name="chevron-right" size={22} color={colors.textTertiary} /></Pressable>;
}

const styles = StyleSheet.create({
  page: { gap: spacing.lg, paddingTop: spacing.lg },
  flex: { flex: 1, minWidth: 0, gap: 4 },
  demo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inbox: { padding: spacing.xl, gap: spacing.md, borderRadius: 20, backgroundColor: colors.blueTint },
  inboxTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inboxIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, minWidth: 0, gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  section: { gap: spacing.md },
  card: { padding: spacing.lg, gap: spacing.md, borderRadius: 18, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueTint },
  button: { minHeight: 56 },
  setup: { padding: spacing.lg, gap: spacing.md, borderRadius: 18, backgroundColor: colors.amberTint },
  group: { borderRadius: 18, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' },
  shortcut: { minHeight: 88, flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.lg },
  pressed: { opacity: 0.7 },
});
