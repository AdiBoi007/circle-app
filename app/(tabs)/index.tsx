import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  Avatar,
  CircleMark,
  IconButton,
  ProgressBar,
  ScreenContainer,
  ScreenHeader,
  Text,
} from '@/components';
import {
  family,
  familyGoal as seedFamilyGoal,
  homeFamilyGoalNext,
  homeFamilyPulse,
  homeMemberSnapshots,
  recentUpdates,
} from '@/data';
import { useAppState } from '@/state';
import { accents, colors, pastels, radius, shadows, spacing } from '@/theme';
import type { Href } from 'expo-router';
import type { Booking, MemberId } from '@/types';
import { SavitaHome } from '@/accounts/savita/SavitaHome';

type FamilyFilter = 'all' | MemberId;
type DisplayUpdate = { title: string; memberId?: MemberId; time: string; href: string };

export default function HomeScreen() {
  const { activeAccountId } = useAppState();
  return activeAccountId === 'savita' ? <SavitaHome /> : <ArjunHomeScreen />;
}

function ArjunHomeScreen() {
  const [selectedId, setSelectedId] = useState<FamilyFilter>('all');
  const { bookings, goals, familyLogs } = useAppState();
  const familyGoal = goals.find((goal) => !goal.memberId && goal.active) ?? seedFamilyGoal;
  const upcomingCare = nextCareFor(bookings, selectedId);
  const loggedUpdates: DisplayUpdate[] = familyLogs
    .filter((item) => selectedId === 'all' || item.memberId === selectedId)
    .map((item) => ({ title: item.text, memberId: item.memberId, time: item.time, href: `/member/${item.memberId}` }));
  const updates: DisplayUpdate[] = [...loggedUpdates, ...recentUpdates]
    .filter((item) => selectedId === 'all' || item.memberId === selectedId)
    .slice(0, 3);

  return (
    <ScreenContainer bottomInset={132} contentStyle={styles.content}>
      <ScreenHeader
        eyebrow="CIRCLE BY SWASTH"
        title="Good evening, Arjun"
        titleVariant="title1"
        subtitle="A clear view of what changed and what comes next."
        trailing={(
          <View style={styles.headerActions}>
            <IconButton accessibilityLabel="Notifications" onPress={() => router.push('/notifications')}>
              <Feather name="bell" size={20} color={colors.textPrimary} />
            </IconButton>
          </View>
        )}
      />

      <HomeFamilyFilter selectedId={selectedId} onSelect={setSelectedId} />
      <FamilySnapshot selectedId={selectedId} />
      <UpdatesSection updates={updates} />
      <UpNextCard booking={upcomingCare} />

      <Pressable
        onPress={() => router.push('/goals')}
        style={({ pressed }) => [styles.goalCard, pressed && styles.pressed]}
      >
        <View style={styles.goalTop}>
          <View style={styles.flex}>
            <Text variant="overline" color={accents.plum.solid}>JULY FAMILY GOAL</Text>
            <Text variant="headline" numberOfLines={1}>Sunday health check-ins</Text>
          </View>
          <Feather name="chevron-right" size={19} color={colors.textTertiary} />
        </View>
        <View style={styles.goalProgress}>
          <Text variant="subhead">{familyGoal.current} of {familyGoal.target} completed</Text>
          <ProgressBar
            progress={familyGoal.current / familyGoal.target}
            accent="plum"
            height={8}
            trackColor="rgba(255,255,255,0.76)"
            accessibilityLabel={familyGoal.caption}
          />
        </View>
        <Text variant="footnote" color={colors.textSecondary}>
          Next: Sunday · {homeFamilyGoalNext.time}
        </Text>
      </Pressable>

    </ScreenContainer>
  );
}

function HomeFamilyFilter({ selectedId, onSelect }: { selectedId: FamilyFilter; onSelect: (id: FamilyFilter) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterContent}
    >
      <Pressable onPress={() => onSelect('all')} accessibilityRole="button" accessibilityState={{ selected: selectedId === 'all' }} style={styles.filterItem}>
        <View style={[styles.allAvatar, selectedId === 'all' && styles.filterSelected]}>
          <CircleMark size={35} color={colors.textPrimary} strokeWidth={2.3} showRing={false} />
        </View>
        <Text variant="caption" numberOfLines={1} color={selectedId === 'all' ? colors.textPrimary : colors.textSecondary}>All Family</Text>
      </Pressable>
      {family.map((member) => {
        const selected = selectedId === member.id;
        return (
          <Pressable key={member.id} onPress={() => onSelect(member.id)} accessibilityRole="button" accessibilityState={{ selected }} style={styles.filterItem}>
            <Avatar name={member.name} accent={member.accent} selected={selected} size={52} />
            <Text variant="caption" numberOfLines={1} color={selected ? colors.textPrimary : colors.textSecondary}>{member.name.split(' ')[0]}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function FamilySnapshot({ selectedId }: { selectedId: FamilyFilter }) {
  const snapshot = selectedId === 'all' ? homeFamilyPulse : homeMemberSnapshots[selectedId];
  return (
    <View style={styles.snapshotCard}>
      <View style={styles.snapshotWatermark} accessibilityElementsHidden>
        <CircleMark size={82} color="#718576" strokeWidth={1.7} showRing={false} />
      </View>
      <Text variant="overline" color={colors.textSecondary}>{snapshot.eyebrow}</Text>
      <Text variant="title2">{snapshot.title}</Text>
      <Text variant="callout" color={colors.textSecondary} style={styles.snapshotSummary}>{snapshot.summary}</Text>
      <View style={styles.snapshotFooter}>
        <View style={styles.updatedRow}>
          <Feather name="check-circle" size={15} color={colors.textSecondary} />
          <Text variant="footnote" color={colors.textSecondary}>{snapshot.updatedLabel}</Text>
        </View>
        <Pressable onPress={() => router.push(snapshot.askHref as Href)} hitSlop={8} style={styles.reviewLink}>
          <Text variant="subhead" color={colors.blue}>Review with Circle</Text>
          <Feather name="arrow-right" size={16} color={colors.blue} />
        </Pressable>
      </View>
    </View>
  );
}

function UpdatesSection({ updates }: { updates: DisplayUpdate[] }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="title3">Updates</Text>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
          <Text variant="subhead" color={colors.blue}>See all</Text>
        </Pressable>
      </View>
      <View style={styles.updatesCard}>
        {updates.length ? updates.map((item, index) => {
          const member = item.memberId ? family.find((person) => person.id === item.memberId) : undefined;
          return (
            <View key={item.title}>
              {index ? <View style={styles.updateDivider} /> : null}
              <Pressable onPress={() => router.push(item.href as Href)} style={({ pressed }) => [styles.updateRow, pressed && styles.pressed]}>
                {member ? <Avatar name={member.name} accent={member.accent} size={34} /> : <View style={styles.familyIcon}><CircleMark size={21} showRing={false} /></View>}
                <View style={styles.updateCopy}>
                  <Text variant="subhead" numberOfLines={1}>{item.title}</Text>
                  <Text variant="footnote" color={colors.textSecondary}>{item.time}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textTertiary} />
              </Pressable>
            </View>
          );
        }) : (
          <View style={styles.emptyUpdates}>
            <Text variant="subhead" color={colors.textSecondary}>No recent updates for this member.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function UpNextCard({ booking }: { booking?: Booking }) {
  const member = booking ? family.find((person) => person.id === booking.memberId) : undefined;
  return (
    <Pressable
      disabled={!booking}
      onPress={() => booking && router.push(`/booking/${booking.id}`)}
      style={({ pressed }) => [styles.upNextCard, pressed && styles.pressed]}
    >
      <View style={styles.upNextTop}>
        <Text variant="overline" color={colors.blue}>UP NEXT</Text>
        <View style={styles.careIcon}><Feather name="calendar" size={17} color={colors.blue} /></View>
      </View>
      <Text variant="title3">{booking ? `${member?.name.split(' ')[0]}’s ${shortService(booking.service)}` : 'No care booked'}</Text>
      {booking ? <View><Text variant="subhead">{whenLabel(booking)} · {booking.time}</Text><Text variant="footnote" color={colors.textSecondary}>{booking.mode}</Text></View> : null}
      <Text variant="subhead" color={colors.blue}>{booking ? 'View booking →' : 'Browse care →'}</Text>
    </Pressable>
  );
}

function nextCareFor(bookings: Booking[], selectedId: FamilyFilter): Booking | undefined {
  return bookings.find((booking) => booking.status === 'Confirmed' && (selectedId === 'all' || booking.memberId === selectedId));
}

function shortService(service: string): string {
  return service.replace('Home ', '').replace(' consultation', '').toLowerCase();
}

function whenLabel(booking: Booking): string {
  return booking.date.startsWith('14 July') ? 'Tomorrow' : booking.date.replace(' 2026', '');
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl, width: '100%', maxWidth: '100%', alignSelf: 'stretch' },
  headerActions: { flexDirection: 'row', gap: spacing.sm, flexShrink: 0 },
  flex: { flex: 1, minWidth: 0 },
  filterScroll: { width: '100%', maxWidth: '100%', minWidth: 0 },
  filterContent: { gap: spacing.lg, paddingVertical: spacing.xxs, paddingHorizontal: spacing.xs, paddingRight: spacing.xxl },
  filterItem: { width: 72, alignItems: 'center', gap: spacing.xs },
  allAvatar: { width: 63, height: 63, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent', backgroundColor: colors.surfaceMuted },
  filterSelected: { borderColor: colors.textPrimary },
  snapshotCard: { minHeight: 220, borderRadius: 26, backgroundColor: '#E8EEE8', borderWidth: StyleSheet.hairlineWidth, borderColor: '#D9E1D9', padding: spacing.xl, gap: spacing.md, overflow: 'hidden', ...shadows.sm },
  snapshotWatermark: { position: 'absolute', top: spacing.sm, right: -spacing.sm, opacity: 0.1 },
  snapshotSummary: { maxWidth: '94%', lineHeight: 23 },
  snapshotFooter: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  updatedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.md },
  updatesCard: { borderRadius: 22, backgroundColor: colors.surface, overflow: 'hidden', ...shadows.sm },
  updateRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  updateCopy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  updateDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.lg + 34 + spacing.md },
  familyIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  emptyUpdates: { minHeight: 68, justifyContent: 'center', paddingHorizontal: spacing.lg },
  upNextCard: { minHeight: 160, borderRadius: 24, backgroundColor: pastels.blue.gradient[0], padding: spacing.xl, gap: spacing.sm, justifyContent: 'space-between', ...shadows.sm },
  upNextTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  careIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center' },
  goalCard: { minHeight: 148, borderRadius: 22, backgroundColor: '#F0ECF5', padding: spacing.lg, gap: spacing.sm, justifyContent: 'space-between', ...shadows.sm },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  goalProgress: { gap: spacing.sm },
  pressed: { opacity: 0.7 },
});
