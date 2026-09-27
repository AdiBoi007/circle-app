import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button } from '@/components';
import { launchMarket } from '@/config/launch';
import { practiceDateLabel, practiceTimeLabel } from '@/practitioner/model';
import { useAppState } from '@/state';
import { colors } from '@/theme';

import { consumerStyles, isPracticeClient, PracticeSection, PracticeStatusBadge, PracticeText } from './ConsumerPracticeProfile';

export function ConsumerPracticeRequests({ limit, activeOnly = false }: { limit?: number; activeOnly?: boolean } = {}) {
  const { activeAccountId, practice } = useAppState();
  if (!isPracticeClient(activeAccountId)) return null;
  const requests = practice.requests.filter((request) => request.clientAccountId === activeAccountId && (!activeOnly || request.status === 'Requested' || request.status === 'Confirmed')).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const visible = limit ? requests.slice(0, limit) : requests;
  if (activeOnly && !requests.length) return null;

  return <PracticeSection title="Care requests">
    <PracticeText variant="footnote" color={colors.textSecondary}>Sample requests · September 2026</PracticeText>
    {requests.length ? visible.map((request) => <Pressable key={request.id} onPress={() => router.push(`/care-request/${request.id}`)} accessibilityRole="button" accessibilityLabel={`View ${request.status.toLowerCase()} request for ${request.recipientName}: ${request.serviceName}, ${practiceDateLabel(request.date)}, ${practiceTimeLabel(request.time)} ${launchMarket.timeZoneLabel}`} style={({ pressed }) => [consumerStyles.card, consumerStyles.row, pressed && consumerStyles.pressed]}>
      <View style={consumerStyles.flex}>
        <PracticeStatusBadge status={request.status} />
        <PracticeText variant="headline">{request.serviceName}</PracticeText>
        <PracticeText variant="subhead" color={colors.textSecondary}>{request.recipientName} · {request.mode}</PracticeText>
        <PracticeText variant="footnote" color={colors.textSecondary}>{practiceDateLabel(request.date)} · {practiceTimeLabel(request.time)} {launchMarket.timeZoneLabel}</PracticeText>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textSecondary} />
    </Pressable>) : <View style={[consumerStyles.card, consumerStyles.section]}>
      <PracticeText variant="headline">Request a time with a practitioner</PracticeText>
      <PracticeText variant="callout" color={colors.textSecondary}>Try the connected demo. A request needs the practitioner’s acceptance before it is confirmed.</PracticeText>
      <Button title="View sample practice" variant="secondary" size="md" onPress={() => router.push('/practitioner-profile')} />
    </View>}
    {limit && requests.length > limit ? <Button title={`View all ${requests.length} care requests`} variant="tertiary" size="md" onPress={() => router.push(activeAccountId === 'riya' ? '/personal/bookings' : activeAccountId === 'savita' ? '/care' : '/calendar')} /> : null}
  </PracticeSection>;
}
