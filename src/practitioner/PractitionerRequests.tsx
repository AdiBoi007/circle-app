import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, DetailHeader, ScreenContainer, Text } from '@/components';
import { practiceDateLabel, practiceTimeLabel } from '@/practitioner/model';
import type { PracticeRequestStatus } from '@/practitioner/types';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';

const filters = ['Requested', 'Confirmed', 'Completed', 'Declined', 'Cancelled', 'All'] as const;
type Filter = typeof filters[number];

export function PractitionerRequests() {
  const { status } = useLocalSearchParams<{ status?: string }>();
  const { practice } = useAppState();
  const filter: Filter = filters.find((item) => item === status) ?? 'Requested';
  const setFilter = (value: Filter) => router.setParams({ status: value });
  const [query, setQuery] = useState('');
  const visible = practice.requests
    .filter((request) => (filter === 'All' || request.status === filter) && `${request.recipientName} ${request.requesterName} ${request.serviceName}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return <ScreenContainer bottomInset={36} contentStyle={styles.page}>
    <DetailHeader title="Appointment requests" />
    <Text variant="footnote" color={colors.textSecondary}>Demo workspace · All times IST</Text>
    <View style={styles.search}><Feather name="search" size={22} color={colors.textSecondary} /><TextInput value={query} onChangeText={setQuery} placeholder="Search client or service" placeholderTextColor={colors.textSecondary} accessibilityLabel="Search requests by client, requester or service" autoCorrect={false} style={styles.searchInput} />{query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear request search" onPress={() => setQuery('')} style={styles.clear}><Text variant="headline" color={colors.blue}>Clear</Text></Pressable> : null}</View>
    <View style={styles.filters}>{filters.map((item) => {
      const count = item === 'All' ? practice.requests.length : practice.requests.filter((request) => request.status === item).length;
      const selected = item === filter;
      return <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected }} aria-pressed={selected} accessibilityLabel={`${item}, ${count} requests`} onPress={() => setFilter(item)} style={({ pressed }) => [styles.filter, selected && styles.filterActive, pressed && styles.pressed]}><Text variant="subhead" color={selected ? colors.white : colors.textPrimary}>{item} · {count}</Text></Pressable>;
    })}</View>

    <View style={styles.resultsHeading}><Text variant="title2">{filter === 'All' ? 'All requests' : filter === 'Requested' ? 'Needs a response' : `${filter} visits`}</Text><Text variant="callout" color={colors.textSecondary} accessibilityLiveRegion="polite" accessibilityLabel={`${visible.length} matching requests`}>{visible.length}</Text></View>
    {visible.length ? <View style={styles.list}>{visible.map((request) => <Pressable key={request.id} accessibilityRole="button" accessibilityLabel={`${request.recipientName}, ${request.serviceName}, ${request.status}, ${practiceDateLabel(request.date)} at ${practiceTimeLabel(request.time)}. Open request.`} onPress={() => router.push(`/practice/request/${request.id}`)} style={({ pressed }) => [styles.request, pressed && styles.pressed]}>
      <View style={styles.requestTop}><Text variant="title3" style={styles.flex}>{request.recipientName}</Text><View style={[styles.status, { backgroundColor: statusTone(request.status).background }]}><Text variant="footnote" color={statusTone(request.status).color}>{request.status}</Text></View></View>
      <Text variant="callout">{request.serviceName}</Text>
      <Text variant="headline">{practiceDateLabel(request.date)} · {practiceTimeLabel(request.time)}</Text>
      <Text variant="callout" color={colors.textSecondary}>{request.mode} · {request.durationMinutes} minutes</Text>
      {request.requesterName !== request.recipientName ? <Text variant="footnote" color={colors.textSecondary}>Requested by {request.requesterName}</Text> : null}
      <View style={styles.requestAction}><Text variant="headline" color={colors.blue}>{request.status === 'Requested' ? 'Review request' : 'View appointment'}</Text><Feather name="chevron-right" size={22} color={colors.blue} /></View>
    </Pressable>)}</View> : <View style={styles.empty}><Feather name="inbox" size={30} color={colors.textSecondary} /><Text variant="title3">{query ? 'No matching requests' : filter === 'Requested' ? 'All caught up' : `No ${filter === 'All' ? '' : `${filter.toLowerCase()} `}requests`}</Text><Text variant="callout" color={colors.textSecondary} align="center">{query ? 'Try another name or clear the search.' : 'Choose another status to see more appointments.'}</Text><Button title={query ? 'Clear search' : 'View all requests'} variant="secondary" onPress={() => query ? setQuery('') : setFilter('All')} style={styles.button} /></View>}
  </ScreenContainer>;
}

function statusTone(status: PracticeRequestStatus) {
  if (status === 'Requested') return { color: colors.amber, background: colors.amberTint };
  if (status === 'Confirmed') return { color: colors.blue, background: colors.blueTint };
  if (status === 'Completed') return { color: colors.sage, background: colors.sageTint };
  return { color: colors.textSecondary, background: colors.surfaceMuted };
}

const styles = StyleSheet.create({
  page: { gap: spacing.lg, paddingTop: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  search: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
  searchInput: { flex: 1, minWidth: 0, minHeight: 56, fontSize: 17, color: colors.textPrimary },
  clear: { minHeight: 48, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: { minHeight: 48, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  filterActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  resultsHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  list: { gap: spacing.md },
  request: { padding: spacing.lg, gap: spacing.sm, borderRadius: 18, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  requestTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  status: { borderRadius: 9, paddingHorizontal: spacing.sm, paddingVertical: 5 },
  requestAction: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: spacing.sm },
  empty: { padding: spacing.xl, borderRadius: 18, backgroundColor: colors.surface, gap: spacing.lg, alignItems: 'center' },
  button: { minHeight: 56 },
  pressed: { opacity: 0.7 },
});
