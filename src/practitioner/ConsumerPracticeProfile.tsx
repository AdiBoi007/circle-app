import type { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PersonalText } from '@/accounts/savita/PersonalText';
import { Avatar, Button, DetailHeader, ScreenContainer, Text } from '@/components';
import type { TextProps } from '@/components/Text';
import { launchMarket } from '@/config/launch';
import { practicePrice } from '@/practitioner/model';
import type { ClientAccountId, PracticeRequestStatus } from '@/practitioner/types';
import { useAppState } from '@/state';
import { colors } from '@/theme';

export function isPracticeClient(account: string): account is ClientAccountId {
  return account === 'arjun' || account === 'savita' || account === 'riya';
}

export function PracticeText(props: TextProps) {
  const { activeAccountId } = useAppState();
  return activeAccountId === 'savita' ? <PersonalText {...props} /> : <Text {...props} />;
}

export function PracticeDemoNote() {
  return <View style={consumerStyles.notice}><Feather name="info" size={17} color={colors.textSecondary} /><PracticeText variant="footnote" color={colors.textSecondary} style={consumerStyles.flex}>Connected demo · sample practitioner, unverified qualifications and example fees. Requests stay in this demo; no external contact or payment.</PracticeText></View>;
}

export function PracticeSection({ title, children }: { title: string; children: ReactNode }) {
  return <View style={consumerStyles.section}><PracticeText variant="title2">{title}</PracticeText>{children}</View>;
}

export function PracticeStatusBadge({ status }: { status: PracticeRequestStatus }) {
  const color = status === 'Requested' ? colors.amber : status === 'Confirmed' || status === 'Completed' ? colors.sage : colors.textSecondary;
  const backgroundColor = status === 'Requested' ? colors.amberTint : status === 'Confirmed' || status === 'Completed' ? colors.sageTint : colors.surfaceMuted;
  return <View style={[consumerStyles.badge, { backgroundColor }]}><PracticeText variant="footnote" color={color}>{status}</PracticeText></View>;
}

export function ConsumerPracticeProfile() {
  const { memberId } = useLocalSearchParams<{ memberId?: string }>();
  const { practice, activeAccountId } = useAppState();
  const { profile } = practice;
  const services = practice.services.filter((service) => service.active);
  const canRequest = isPracticeClient(activeAccountId) && profile.acceptingRequests;

  return <ScreenContainer bottomInset={36} contentStyle={consumerStyles.page}>
    <DetailHeader title="Practitioner" />
    <View style={[consumerStyles.card, consumerStyles.section]}>
      <View style={consumerStyles.row}>
        <Avatar name="Arvind Nair" size={72} />
        <View style={consumerStyles.flex}><PracticeText variant="title1">{profile.name}</PracticeText><PracticeText variant="headline" color={colors.blue}>{profile.title}</PracticeText><PracticeText variant="subhead" color={colors.textSecondary}>{launchMarket.regionLabel}</PracticeText></View>
      </View>
      <PracticeText>{profile.bio}</PracticeText>
      <View style={consumerStyles.notice}><Feather name={profile.acceptingRequests ? 'calendar' : 'pause-circle'} size={18} color={profile.acceptingRequests ? colors.sage : colors.amber} /><PracticeText variant="callout" style={consumerStyles.flex}>{profile.acceptingRequests ? 'Accepting appointment requests' : 'New requests are paused'}</PracticeText></View>
      <Button title={profile.acceptingRequests ? 'Request an appointment' : 'Requests paused'} disabled={!canRequest || services.length === 0} onPress={() => router.push({ pathname: '/request-care', params: { memberId } })} />
      {!isPracticeClient(activeAccountId) ? <PracticeText variant="footnote" color={colors.textSecondary}>Switch to a client profile to try requesting care.</PracticeText> : null}
    </View>
    <PracticeDemoNote />
    <PracticeSection title="Services">
      {services.length ? services.map((service) => <View key={service.id} style={[consumerStyles.card, consumerStyles.section]}>
        <PracticeText variant="title3">{service.name}</PracticeText>
        <PracticeText variant="callout" color={colors.textSecondary}>{service.description}</PracticeText>
        <View style={consumerStyles.wrap}><PracticeText variant="headline">{practicePrice(service.priceInr)}</PracticeText><PracticeText variant="subhead" color={colors.textSecondary}>{service.durationMinutes} minutes · {service.modes.join(' · ')}</PracticeText></View>
        <Button title={`Request ${service.name}`} variant="secondary" size="md" disabled={!canRequest} onPress={() => router.push({ pathname: '/request-care', params: { serviceId: service.id, memberId } })} />
      </View>) : <View style={consumerStyles.card}><PracticeText color={colors.textSecondary}>There are no services available to request right now.</PracticeText></View>}
    </PracticeSection>
    <PracticeSection title="About the practice">
      <View style={[consumerStyles.card, consumerStyles.section]}>
        <PracticeText variant="footnote" color={colors.textSecondary}>SAMPLE QUALIFICATION · NOT VERIFIED</PracticeText><PracticeText>{profile.qualification}</PracticeText>
        <View style={consumerStyles.divider} /><PracticeText variant="footnote" color={colors.textSecondary}>LANGUAGES</PracticeText><PracticeText>{profile.languages.join(', ')}</PracticeText>
        <View style={consumerStyles.divider} /><PracticeText variant="footnote" color={colors.textSecondary}>SAMPLE PRACTICE ADDRESS</PracticeText><PracticeText>{profile.address}</PracticeText>
        <PracticeText variant="footnote" color={colors.textSecondary}>All appointment times use {launchMarket.timeZoneLabel} (UTC{launchMarket.utcOffset}). The practitioner must accept a request before it becomes confirmed.</PracticeText>
      </View>
    </PracticeSection>
  </ScreenContainer>;
}

export const consumerStyles = StyleSheet.create({
  page: { paddingTop: 4, gap: 20 },
  section: { gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, minWidth: 0, gap: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  badge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 2 },
  pressed: { opacity: 0.7 },
});
