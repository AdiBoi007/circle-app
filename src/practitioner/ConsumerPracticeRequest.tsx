import { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, DetailHeader, ScreenContainer, Sheet } from '@/components';
import { launchMarket } from '@/config/launch';
import { family } from '@/data/family';
import { availablePracticeSlots, practiceDateLabel, practiceDemoDate, practicePrice, practiceTimeLabel } from '@/practitioner/model';
import type { PracticeRequest, PracticeRequestInput } from '@/practitioner/types';
import { useAppState } from '@/state';
import { colors } from '@/theme';
import type { CareMode } from '@/types';

import { consumerStyles, isPracticeClient, PracticeDemoNote, PracticeSection, PracticeStatusBadge, PracticeText } from './ConsumerPracticeProfile';

const requestDates = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(`${practiceDemoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + index);
  return date.toISOString().slice(0, 10);
});

function Choice({ label, selected, onPress, accessibilityLabel }: { label: string; selected: boolean; onPress: () => void; accessibilityLabel?: string }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ selected }} style={({ pressed }) => [styles.choice, selected && styles.selectedChoice, pressed && consumerStyles.pressed]}><PracticeText variant="callout" color={selected ? colors.blue : colors.textPrimary} style={{ flexShrink: 1 }}>{label}</PracticeText>{selected ? <Feather name="check" size={17} color={colors.blue} /> : null}</Pressable>;
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return <View style={{ gap: 3 }}><PracticeText variant="footnote" color={colors.textSecondary}>{label}</PracticeText><PracticeText>{value}</PracticeText></View>;
}

function RequestAccess() {
  return <ScreenContainer contentStyle={consumerStyles.page}><DetailHeader title="Care request" /><View style={[consumerStyles.card, consumerStyles.section]}><PracticeText variant="title2">Use a client profile</PracticeText><PracticeText color={colors.textSecondary}>Switch to Arjun, Savita or Riya to request care and see that profile’s requests.</PracticeText><Button title="Back to home" onPress={() => router.replace('/')} /></View></ScreenContainer>;
}

export function ConsumerPracticeRequestForm() {
  const params = useLocalSearchParams<{ serviceId?: string | string[]; memberId?: string }>();
  const { activeAccountId, practice, requestPracticeAppointment } = useAppState();
  const services = practice.services.filter((service) => service.active);
  const initialId = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId;
  const [serviceId, setServiceId] = useState(initialId ?? services[0]?.id ?? '');
  const [recipientId, setRecipientId] = useState<PracticeRequestInput['recipientId']>(activeAccountId === 'riya' ? 'riya' : activeAccountId === 'savita' ? 'savita' : family.find((person) => person.id === params.memberId)?.id ?? 'arjun');
  const [mode, setMode] = useState<CareMode>(services.find((service) => service.id === (initialId ?? services[0]?.id))?.modes[0] ?? 'Online');
  const [date, setDate] = useState(requestDates[0]!);
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const service = services.find((item) => item.id === serviceId);
  const recipients = activeAccountId === 'riya' ? [{ id: 'riya' as const, name: 'Riya Shah' }] : activeAccountId === 'savita' ? family.filter((member) => member.id === 'savita') : family;
  const recipient = recipients.find((item) => item.id === recipientId);
  const slots = service ? availablePracticeSlots(practice, service.id, date, mode) : [];
  const ready = practice.profile.acceptingRequests && !!service && !!recipient && !!time && slots.includes(time) && service.modes.includes(mode);

  if (!isPracticeClient(activeAccountId)) return <RequestAccess />;

  function changeService(id: string) {
    const next = services.find((item) => item.id === id);
    setServiceId(id);
    if (next && !next.modes.includes(mode)) setMode(next.modes[0]!);
    setTime('');
    setError('');
  }

  function submit() {
    if (submitting.current) return;
    if (!ready) { setError('This time is no longer available. Go back and choose another time.'); return; }
    submitting.current = true;
    const result = requestPracticeAppointment({ serviceId, recipientId, mode, date, time, note: note.trim() });
    if (!result.ok) { submitting.current = false; setError(result.error); return; }
    if (result.id) router.replace(`/care-request/${result.id}`);
    else { submitting.current = false; setError('The request could not be opened. Please return to your care requests.'); }
  }

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScreenContainer bottomInset={36} contentStyle={consumerStyles.page}>
      <DetailHeader title={reviewing ? 'Review request' : 'Request care'} />
      <View style={consumerStyles.section}><PracticeText variant="title1">{reviewing ? 'Check your request' : 'Find a time'}</PracticeText><PracticeText color={colors.textSecondary}>With {practice.profile.name} · {launchMarket.city}</PracticeText></View>
      <PracticeDemoNote />
      {!practice.profile.acceptingRequests ? <View style={consumerStyles.card}><PracticeText color={colors.amber}>New requests are paused. You can view the practice and any requests you already made.</PracticeText></View> : null}
      {reviewing && service && recipient ? <>
        <View style={[consumerStyles.card, consumerStyles.section]}>
          <DetailValue label="FOR" value={recipient.name} /><DetailValue label="SERVICE" value={`${service.name} · ${service.durationMinutes} minutes`} /><DetailValue label="WHEN" value={`${practiceDateLabel(date)} · ${practiceTimeLabel(time)} ${launchMarket.timeZoneLabel}`} /><DetailValue label="VISIT" value={mode} /><DetailValue label="EXAMPLE FEE" value={practicePrice(service.priceInr)} />
          {note.trim() ? <DetailValue label="YOUR NOTE" value={note.trim()} /> : null}
        </View>
        <View style={[consumerStyles.card, consumerStyles.section]}><PracticeText variant="headline">The practitioner will review your request</PracticeText><PracticeText variant="callout" color={colors.textSecondary}>This time is not confirmed yet. You can check the response here and cancel your request if your plans change. No payment is taken.</PracticeText></View>
        {error ? <PracticeText accessibilityRole="alert" color={colors.red}>{error}</PracticeText> : null}
        <Button title="Send appointment request" onPress={submit} disabled={!ready} />
        <Button title="Edit request" variant="secondary" onPress={() => { setReviewing(false); setError(''); }} />
      </> : <>
        <PracticeSection title="1. Choose a service">
          {services.length ? services.map((item) => <Pressable key={item.id} onPress={() => changeService(item.id)} accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.durationMinutes} minutes, ${practicePrice(item.priceInr)}`} accessibilityState={{ selected: serviceId === item.id }} style={({ pressed }) => [consumerStyles.card, styles.serviceChoice, serviceId === item.id && styles.selectedChoice, pressed && consumerStyles.pressed]}>
            <View style={consumerStyles.flex}><PracticeText variant="headline">{item.name}</PracticeText><PracticeText variant="subhead" color={colors.textSecondary}>{item.durationMinutes} minutes · {practicePrice(item.priceInr)}</PracticeText></View><Feather name={serviceId === item.id ? 'check-circle' : 'circle'} size={22} color={serviceId === item.id ? colors.blue : colors.textTertiary} />
          </Pressable>) : <PracticeText color={colors.textSecondary}>No services are available to request.</PracticeText>}
        </PracticeSection>
        <PracticeSection title="2. Who is this for?">
          <View style={consumerStyles.wrap}>{recipients.map((item) => <Choice key={item.id} label={item.name} accessibilityLabel={`Request care for ${item.name}`} selected={recipientId === item.id} onPress={() => setRecipientId(item.id)} />)}</View>
        </PracticeSection>
        {service ? <PracticeSection title="3. How would you like to meet?"><View style={consumerStyles.wrap}>{service.modes.map((item) => <Choice key={item} label={item} selected={mode === item} onPress={() => { setMode(item); setTime(''); setError(''); }} />)}</View><PracticeText variant="footnote" color={colors.textSecondary}>{mode === 'Home visit' ? `Home visits are within ${launchMarket.city}. Visit details are arranged when the practitioner accepts.` : mode === 'In person' ? practice.profile.address : `Online sessions are for clients in ${launchMarket.city}. Session details appear after acceptance.`}</PracticeText></PracticeSection> : null}
        <PracticeSection title="4. Choose a day">
          <PracticeText variant="footnote" color={colors.textSecondary}>Demo dates · all times {launchMarket.timeZoneLabel} (UTC{launchMarket.utcOffset})</PracticeText>
          <View style={consumerStyles.wrap}>{requestDates.map((item) => <Choice key={item} label={practiceDateLabel(item)} selected={date === item} onPress={() => { setDate(item); setTime(''); setError(''); }} />)}</View>
        </PracticeSection>
        <PracticeSection title="5. Choose a time">
          {slots.length ? <View style={consumerStyles.wrap}>{slots.map((item) => <Choice key={item} label={practiceTimeLabel(item)} accessibilityLabel={`Request ${practiceTimeLabel(item)} ${launchMarket.timeZoneLabel}`} selected={time === item} onPress={() => { setTime(item); setError(''); }} />)}</View> : <View style={consumerStyles.card}><PracticeText color={colors.textSecondary}>{service ? 'No times are available for this day and visit type. Try another day.' : 'Choose a service to see available times.'}</PracticeText></View>}
        </PracticeSection>
        <PracticeSection title="Anything to add?">
          <PracticeText variant="callout" color={colors.textSecondary}>Optional · a short reason for your visit. Use example information in this demo.</PracticeText>
          <TextInput value={note} onChangeText={setNote} multiline maxLength={1000} placeholder="What would you like help with?" placeholderTextColor={colors.textTertiary} accessibilityLabel="Optional note for the practitioner, 1000 characters maximum" style={styles.input} textAlignVertical="top" />
          <PracticeText variant="caption" color={colors.textSecondary}>{note.length}/1,000 characters</PracticeText>
        </PracticeSection>
        {error ? <PracticeText accessibilityRole="alert" color={colors.red}>{error}</PracticeText> : null}
        <Button title="Review request" disabled={!ready} onPress={() => setReviewing(true)} />
        {!ready && practice.profile.acceptingRequests ? <PracticeText variant="footnote" color={colors.textSecondary}>Choose a service, recipient and available time to continue.</PracticeText> : null}
      </>}
    </ScreenContainer>
  </KeyboardAvoidingView>;
}

const statusDescription: Record<PracticeRequest['status'], string> = {
  Requested: 'Waiting for the practitioner to review your request. Your appointment is not confirmed yet.',
  Confirmed: 'The practitioner accepted this appointment in the demo. See the session details below.',
  Declined: 'The practitioner could not accept this request. You can choose another service or time.',
  Cancelled: 'This request was cancelled. It will stay in your history.',
  Completed: 'The practitioner marked this appointment as completed in the demo.',
};

export function ConsumerPracticeRequestDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { activeAccountId, practice, cancelPracticeRequest } = useAppState();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const request = practice.requests.find((item) => item.id === id && item.clientAccountId === activeAccountId);
  if (!isPracticeClient(activeAccountId)) return <RequestAccess />;
  if (!request) return <ScreenContainer contentStyle={consumerStyles.page}><DetailHeader title="Care request" /><View style={[consumerStyles.card, consumerStyles.section]}><PracticeText variant="title2">Request not available</PracticeText><PracticeText color={colors.textSecondary}>This request is not available in your current profile.</PracticeText><Button title="Back to care" onPress={() => router.replace('/care')} /></View></ScreenContainer>;
  const canCancel = request.status === 'Requested' || request.status === 'Confirmed';

  function cancel() {
    if (!request || !reason.trim()) return;
    const result = cancelPracticeRequest(request.id, reason.trim());
    if (!result.ok) { setError(result.error); return; }
    setCancelling(false);
    setReason('');
    setError('');
  }

  return <ScreenContainer bottomInset={36} contentStyle={consumerStyles.page}>
    <DetailHeader title="Care request" />
    <View style={[consumerStyles.card, consumerStyles.section]}>
      <PracticeStatusBadge status={request.status} /><PracticeText variant="title1">{request.serviceName}</PracticeText><PracticeText color={colors.textSecondary}>{statusDescription[request.status]}</PracticeText>
    </View>
    <View style={[consumerStyles.card, consumerStyles.section]}>
      <DetailValue label="FOR" value={request.recipientName} /><DetailValue label="PRACTITIONER" value={practice.profile.name} /><DetailValue label="WHEN" value={`${practiceDateLabel(request.date)} · ${practiceTimeLabel(request.time)} ${launchMarket.timeZoneLabel}`} /><DetailValue label="VISIT" value={`${request.mode} · ${request.durationMinutes} minutes`} /><DetailValue label="EXAMPLE FEE AT REQUEST" value={practicePrice(request.priceInr)} />
      {request.note ? <DetailValue label="YOUR NOTE" value={request.note} /> : null}
    </View>
    {request.sessionDetails && (request.status === 'Confirmed' || request.status === 'Completed') ? <PracticeSection title="Session details"><View style={consumerStyles.card}><PracticeText>{request.sessionDetails}</PracticeText></View></PracticeSection> : null}
    {request.reason ? <PracticeSection title={request.status === 'Declined' ? 'Reason from the practitioner' : 'Cancellation reason'}><View style={consumerStyles.card}><PracticeText>{request.reason}</PracticeText></View></PracticeSection> : null}
    <PracticeSection title="Request history">
      <View style={[consumerStyles.card, consumerStyles.section]}>{request.events.map((event, index) => <View key={`${event.at}-${index}`} style={styles.event}>
        <View style={styles.eventDot} /><View style={consumerStyles.flex}><PracticeText variant="headline">{event.status}</PracticeText><PracticeText variant="footnote" color={colors.textSecondary}>{event.actor} · {new Date(event.at).toLocaleString('en-IN', { timeZone: launchMarket.timeZone, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} {launchMarket.timeZoneLabel}</PracticeText>{event.note ? <PracticeText variant="callout">{event.note}</PracticeText> : null}</View>
      </View>)}</View>
    </PracticeSection>
    <PracticeDemoNote />
    {canCancel ? <Button title={request.status === 'Requested' ? 'Cancel request' : 'Cancel appointment'} variant="secondary" onPress={() => { setCancelling(true); setError(''); }} /> : <Button title="View sample practice" variant="secondary" onPress={() => router.push('/practitioner-profile')} />}
    <Sheet visible={cancelling} onClose={() => setCancelling(false)} title={request.status === 'Requested' ? 'Cancel this request?' : 'Cancel this appointment?'} footer={<View style={consumerStyles.section}><Button title="Confirm cancellation" disabled={!reason.trim() || !canCancel} onPress={cancel} /><Button title="Keep appointment request" variant="tertiary" onPress={() => setCancelling(false)} /></View>}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={consumerStyles.section}>
        <PracticeText color={colors.textSecondary}>Add a brief reason. It will appear in this demo’s request history.</PracticeText>
        <TextInput value={reason} onChangeText={setReason} multiline maxLength={500} placeholder="Reason for cancelling" placeholderTextColor={colors.textTertiary} accessibilityLabel="Reason for cancelling, required, 500 characters maximum" style={styles.input} textAlignVertical="top" />
        <PracticeText variant="caption" color={colors.textSecondary}>{reason.length}/500 characters</PracticeText>
        {error ? <PracticeText accessibilityRole="alert" color={colors.red}>{error}</PracticeText> : null}
      </KeyboardAvoidingView>
    </Sheet>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  choice: { minHeight: 48, maxWidth: '100%', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 7 },
  selectedChoice: { borderColor: colors.blue, backgroundColor: colors.blueTint },
  serviceChoice: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border },
  input: { minHeight: 112, padding: 16, backgroundColor: colors.surface, color: colors.textPrimary, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 12, fontSize: 17, lineHeight: 24 },
  event: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eventDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.blue, marginTop: 7 },
});
