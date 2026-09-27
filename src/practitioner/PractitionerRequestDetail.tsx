import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, DetailHeader, ScreenContainer, Text } from '@/components';
import { practiceDateLabel, practicePrice, practiceRequestHasEnded, practiceTimeLabel } from '@/practitioner/model';
import type { PracticeRequest, PracticeResult } from '@/practitioner/types';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';

export function PractitionerRequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { practice } = useAppState();
  const request = practice.requests.find((item) => item.id === id);

  if (!request) return <ScreenContainer bottomInset={36} contentStyle={styles.page}>
    <DetailHeader title="Appointment request" />
    <View style={styles.card}><Text variant="title2">Request unavailable</Text><Text variant="callout" color={colors.textSecondary}>This request is no longer in the demo workspace.</Text><Button title="View requests" onPress={() => router.replace('/practice/requests')} style={styles.button} /></View>
  </ScreenContainer>;

  return <RequestDetailContent key={request.id} request={request} />;
}

function RequestDetailContent({ request }: { request: PracticeRequest }) {
  const { practice, confirmPracticeRequest, declinePracticeRequest, cancelPracticeRequest, completePracticeRequest } = useAppState();
  const [sessionDetails, setSessionDetails] = useState(request.sessionDetails || (request.mode === 'In person' ? practice.profile.address : ''));
  const [reason, setReason] = useState('');
  const [reasonAction, setReasonAction] = useState<'decline' | 'cancel' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const pending = request.status === 'Requested';
  const confirmed = request.status === 'Confirmed';
  const canComplete = confirmed && practiceRequestHasEnded(request);
  const statusColor = pending ? colors.amber : confirmed ? colors.blue : request.status === 'Completed' ? colors.sage : colors.textSecondary;
  const statusBackground = pending ? colors.amberTint : confirmed ? colors.blueTint : request.status === 'Completed' ? colors.sageTint : colors.surfaceMuted;

  function showResult(result: PracticeResult, message: string) {
    if (!result.ok) { setError(result.error); setNotice(''); return; }
    setError(''); setNotice(message); setReasonAction(null); setReason('');
  }

  function confirm() {
    Keyboard.dismiss();
    if (sessionDetails.trim().length < 5) { setError('Add the visit address or online session instructions before confirming.'); setNotice(''); return; }
    showResult(confirmPracticeRequest(request.id, sessionDetails), 'Appointment confirmed in this demo.');
  }

  function openReason(action: 'decline' | 'cancel') {
    Keyboard.dismiss();
    setReasonAction(action); setReason(''); setError(''); setNotice('');
  }

  function submitReason() {
    Keyboard.dismiss();
    if (!reason.trim()) { setError('Add a reason so the requester knows what changed.'); return; }
    if (reasonAction === 'decline') showResult(declinePracticeRequest(request.id, reason), 'Request declined in this demo.');
    else if (reasonAction === 'cancel') showResult(cancelPracticeRequest(request.id, reason), 'Appointment cancelled in this demo.');
  }

  return <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScreenContainer bottomInset={36} edges={['top', 'bottom']} contentStyle={styles.page}>
    <DetailHeader title="Appointment details" />
    <Text variant="footnote" color={colors.textSecondary}>Demo workspace · All times IST</Text>
    <View style={styles.heading}>
      <View style={[styles.status, { backgroundColor: statusBackground }]}><Text variant="subhead" color={statusColor}>{request.status}</Text></View>
      <Text variant="largeTitle" accessibilityRole="header">{request.recipientName}</Text>
      {request.requesterName !== request.recipientName ? <Text variant="callout" color={colors.textSecondary}>Requested by {request.requesterName}</Text> : null}
    </View>

    <View style={styles.card}>
      <Text variant="title3">{request.serviceName}</Text>
      <View style={styles.detailRow}><Feather name="calendar" size={22} color={colors.blue} /><Text variant="headline" style={styles.flex}>{practiceDateLabel(request.date)} · {practiceTimeLabel(request.time)}</Text></View>
      <View style={styles.detailRow}><Feather name={request.mode === 'Online' ? 'video' : 'map-pin'} size={22} color={colors.blue} /><Text variant="callout" style={styles.flex}>{request.mode} · {request.durationMinutes} minutes</Text></View>
      <View style={styles.feeRow}><Text variant="callout" color={colors.textSecondary}>Listed fee</Text><Text variant="headline">{practicePrice(request.priceInr)}</Text></View>
      <Text variant="footnote" color={colors.textSecondary}>No payment is processed in this demo.</Text>
    </View>

    {request.note ? <View style={styles.card}><Text variant="headline">Note shared with you</Text><Text variant="body">{request.note}</Text></View> : null}
    {notice ? <View accessibilityLiveRegion="polite" style={styles.success}><Feather name="check-circle" size={22} color={colors.sage} /><Text variant="callout" color={colors.sage} style={styles.flex}>{notice}</Text></View> : null}
    {error ? <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}><Feather name="alert-circle" size={22} color={colors.red} /><Text variant="callout" color={colors.red} style={styles.flex}>{error}</Text></View> : null}

    {pending && !reasonAction ? <View style={styles.card}>
      <Text variant="title3">Confirm this request</Text>
      <Text variant="headline">{request.mode === 'Online' ? 'Online session details' : 'Visit address & instructions'}</Text>
      <Text variant="callout" color={colors.textSecondary}>{request.mode === 'Online' ? 'Add sample joining instructions. Video calls are not connected in this demo.' : request.mode === 'Home visit' ? 'Confirm the Chandigarh home visit address and any arrival instructions.' : 'Check the Chandigarh clinic address and add any arrival instructions.'}</Text>
      <TextInput value={sessionDetails} onChangeText={(value) => { setSessionDetails(value); setError(''); }} multiline maxLength={500} textAlignVertical="top" placeholder={request.mode === 'Online' ? 'Sample online session instructions' : 'Address and arrival instructions'} placeholderTextColor={colors.textSecondary} accessibilityLabel={request.mode === 'Online' ? 'Required online session details' : 'Required visit address and instructions'} style={styles.textarea} />
      <Text variant="footnote" color={colors.textSecondary}>These details appear in the requester’s appointment.</Text>
      <Button title="Confirm appointment" onPress={confirm} style={styles.button} />
      <Pressable accessibilityRole="button" onPress={() => openReason('decline')} style={({ pressed }) => [styles.destructive, pressed && styles.pressed]}><Text variant="headline" color={colors.red}>Decline request</Text></Pressable>
    </View> : null}

    {request.sessionDetails && !pending ? <View style={styles.card}><Text variant="headline">{request.mode === 'Online' ? 'Online session details' : 'Visit address & instructions'}</Text><Text variant="body">{request.sessionDetails}</Text></View> : null}
    {request.reason ? <View style={styles.card}><Text variant="headline">{request.status === 'Declined' ? 'Reason for declining' : 'Reason for cancellation'}</Text><Text variant="body">{request.reason}</Text></View> : null}

    {confirmed && !reasonAction ? <View style={styles.card}>
      {canComplete ? <Button title="Mark visit completed" onPress={() => showResult(completePracticeRequest(request.id), 'Visit marked completed in this demo.')} style={styles.button} /> : <Text variant="callout" color={colors.textSecondary}>You can mark this visit completed after its scheduled end time. Demo clock: 25 Sep, 9:00 am IST.</Text>}
      <Pressable accessibilityRole="button" onPress={() => openReason('cancel')} style={({ pressed }) => [styles.destructive, pressed && styles.pressed]}><Text variant="headline" color={colors.red}>Cancel appointment</Text></Pressable>
    </View> : null}

    {reasonAction && (pending || confirmed) ? <View style={styles.card}>
      <Text variant="title3">{reasonAction === 'decline' ? 'Decline this request?' : 'Cancel this appointment?'}</Text>
      <Text variant="callout" color={colors.textSecondary}>The reason will appear in the requester’s appointment.</Text>
      <TextInput value={reason} onChangeText={(value) => { setReason(value); setError(''); }} multiline maxLength={500} textAlignVertical="top" placeholder="Add a reason" placeholderTextColor={colors.textSecondary} accessibilityLabel={reasonAction === 'decline' ? 'Required reason for declining' : 'Required reason for cancellation'} style={styles.textarea} />
      <Button title={reasonAction === 'decline' ? 'Decline request' : 'Cancel appointment'} onPress={submitReason} style={[styles.button, styles.dangerButton]} />
      <Button title={reasonAction === 'decline' ? 'Keep request' : 'Keep appointment'} variant="secondary" onPress={() => { setReasonAction(null); setError(''); }} style={styles.button} />
    </View> : null}

    <View style={styles.section}><Text variant="title2">Activity</Text><View style={styles.card}>{[...request.events].reverse().map((event, index) => <View key={`${event.at}-${event.status}-${index}`} style={[styles.event, index > 0 && styles.eventDivider]}><View style={styles.eventDot} /><View style={styles.flex}><Text variant="headline">{event.status}</Text><Text variant="callout" color={colors.textSecondary}>{event.actor}</Text>{event.note ? <Text variant="callout">{event.note}</Text> : null}</View></View>)}</View></View>
    <Button title="Back to requests" variant="secondary" onPress={() => router.replace('/practice/requests')} style={styles.button} />
  </ScreenContainer></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  page: { gap: spacing.lg, paddingTop: spacing.sm },
  heading: { gap: spacing.sm },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  section: { gap: spacing.md },
  status: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  card: { padding: spacing.lg, gap: spacing.md, borderRadius: 18, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  feeRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.md },
  textarea: { minHeight: 124, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 12, padding: spacing.md, color: colors.textPrimary, backgroundColor: colors.surface, fontSize: 18, lineHeight: 26 },
  button: { minHeight: 56 },
  destructive: { minHeight: 56, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: 12, backgroundColor: colors.redTint },
  dangerButton: { backgroundColor: colors.red },
  error: { padding: spacing.lg, borderRadius: 14, backgroundColor: colors.redTint, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  success: { padding: spacing.lg, borderRadius: 14, backgroundColor: colors.sageTint, flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  event: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue, marginTop: 7 },
  eventDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.md },
  pressed: { opacity: 0.7 },
});
