import { useCallback, useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { providerById } from '@/data';
import { ExperienceHeader } from '@/experience/ExperienceHeader';
import { useAppState } from '@/state';
import { bookingTimeValue, fixtureDateValue } from '@/utils/bookingTime';
import { colors, radius, screenPadding, spacing } from '@/theme';
import type { Booking, ChatMessage, HealthRecord, Medication, TodayItem } from '@/types';

const prompts = ['What do I need to do today?', 'When is my next appointment?', 'Explain my latest report.'];
type SavitaMessage = ChatMessage & { shareText?: string };
type Response = Omit<SavitaMessage, 'id' | 'role'>;
type Context = { records: HealthRecord[]; tasks: TodayItem[]; medications: Medication[]; bookings: Booking[]; takenMedicationIds: string[] };

export function SavitaAI() {
  const { prompt, recordId } = useLocalSearchParams<{ prompt?: string; recordId?: string }>();
  const { records, tasks, medications, bookings, takenMedicationIds, addNotification, addFamilyLog, aiHistoryKey, personalPreferences } = useAppState();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<SavitaMessage[]>([]);
  const [waitingForNote, setWaitingForNote] = useState(false);
  const [sharedIds, setSharedIds] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const idRef = useRef(0);
  const promptRef = useRef<string | undefined>(undefined);
  const historyRef = useRef(aiHistoryKey);
  const nextId = useCallback(() => `savita-chat-${Date.now()}-${++idRef.current}`, []);

  const send = useCallback((value = draft) => {
    const clean = value.trim();
    if (!clean) return;
    const wantsNote = /arjun|family|share|tell/.test(clean.toLowerCase()) && /help|write|ask|arrange/.test(clean.toLowerCase());
    const response: Response = waitingForNote
      ? { text: `Your note for Arjun:\n\n“${clean}”\n\nSave this to the family updates in this demo?`, shareText: clean, actions: [{ label: 'Save note for Arjun', href: 'share-arjun' }] }
      : wantsNote
        ? { text: 'What would you like Arjun to know? Type your note below. You can review it before saving it to this demo’s family updates.' }
        : savitaResponse(clean, { records, tasks, medications, bookings, takenMedicationIds }, recordId);
    setWaitingForNote(!waitingForNote && wantsNote);
    setMessages((current) => [...current, { id: nextId(), role: 'user', text: clean }, { id: nextId(), role: 'assistant', ...response }]);
    setDraft('');
    if (personalPreferences.readAloud) void Speech.stop().then(() => Speech.speak(response.text, { language: 'en-IN', rate: 0.88 }));
  }, [draft, waitingForNote, records, tasks, medications, bookings, takenMedicationIds, recordId, nextId, personalPreferences.readAloud]);

  useEffect(() => () => { void Speech.stop(); }, []);
  useEffect(() => {
    if (!prompt || promptRef.current === `${prompt}-${recordId ?? ''}`) return;
    promptRef.current = `${prompt}-${recordId ?? ''}`;
    send(prompt);
  }, [prompt, recordId, send]);
  useEffect(() => {
    if (historyRef.current === aiHistoryKey) return;
    historyRef.current = aiHistoryKey;
    setMessages([]);
    setSharedIds([]);
    setWaitingForNote(false);
  }, [aiHistoryKey]);

  const handleAction = (message: SavitaMessage, href: string) => {
    if (href !== 'share-arjun') { router.push(href as never); return; }
    if (!message.shareText || sharedIds.includes(message.id)) return;
    const activityId = nextId();
    addNotification({ id: `share-${activityId}`, title: 'A note from Savita', body: message.shareText, memberId: 'savita', time: 'Just now', group: 'Today', read: false, href: '/member/savita' });
    addFamilyLog({ id: `log-${activityId}`, memberId: 'savita', category: 'Note', text: message.shareText, time: 'Just now' });
    setSharedIds((current) => [...current, message.id]);
    setMessages((current) => [...current, { id: nextId(), role: 'assistant', text: 'Your note is saved in this demo’s family updates. You can see it by switching to Arjun’s profile.' }]);
  };

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}><ExperienceHeader title="Ask Circle" /></View>
      <ScrollView ref={scrollRef} style={styles.conversation} contentContainerStyle={styles.conversationContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onContentSizeChange={() => { if (messages.length) scrollRef.current?.scrollToEnd({ animated: !personalPreferences.reduceMotion }); }}>
        {!messages.length ? <View style={styles.welcome}>
          <Text variant="body" color={colors.textSecondary} style={styles.body}>Choose a question, or type below.</Text>
          <View style={styles.prompts}>{prompts.map((item, index) => <Pressable key={item} onPress={() => send(item)} accessibilityRole="button" style={({ pressed }) => [styles.prompt, index > 0 && styles.promptDivider, pressed && styles.pressed]}><Text variant="headline" style={styles.flex}>{item}</Text><Feather name="arrow-right" size={22} color={colors.blue} /></Pressable>)}</View>
        </View> : null}
        {messages.map((message) => <View key={message.id} style={[styles.messageGroup, message.role === 'user' ? styles.userGroup : styles.circleGroup]}>
          <Text variant="headline" color={colors.textSecondary}>{message.role === 'user' ? 'You' : 'Circle'}</Text>
          <View style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.circleBubble]}><Text variant="body" style={styles.body}>{message.text}</Text></View>
          {message.citations?.map((citation) => <Pressable key={citation.title} onPress={() => citation.recordId ? router.push(`/record/${citation.recordId}`) : undefined} accessibilityRole="button" accessibilityLabel={`Open source: ${citation.title}`} style={({ pressed }) => [styles.citation, pressed && styles.pressed]}><Feather name="file-text" size={23} color={colors.blue} /><Text variant="body" style={[styles.body, styles.flex]}>{citation.title}</Text><Feather name="chevron-right" size={22} color={colors.blue} /></Pressable>)}
          {message.actions?.slice(0, 2).map((action) => <Pressable key={action.label} onPress={() => handleAction(message, action.href)} disabled={action.href === 'share-arjun' && sharedIds.includes(message.id)} accessibilityRole="button" accessibilityState={{ disabled: action.href === 'share-arjun' && sharedIds.includes(message.id) }} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text variant="headline" style={styles.flex}>{action.href === 'share-arjun' && sharedIds.includes(message.id) ? 'Note saved' : action.label}</Text><Feather name={sharedIds.includes(message.id) ? 'check' : 'arrow-right'} size={22} color={colors.blue} /></Pressable>)}
          {message.role === 'assistant' && personalPreferences.readAloud ? <Pressable onPress={() => { void Speech.stop(); }} accessibilityRole="button" style={styles.stop}><Feather name="volume-x" size={22} color={colors.blue} /><Text variant="headline">Stop reading aloud</Text></Pressable> : null}
        </View>)}
      </ScrollView>
      <View style={styles.composerArea}>
        <Text variant="body" color={colors.textSecondary} style={styles.demo}>Demo answers use your saved information.</Text>
        <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder={waitingForNote ? 'Your note to Arjun' : 'Type a question…'} placeholderTextColor={colors.textSecondary} multiline maxLength={600} accessibilityLabel={waitingForNote ? 'Your note to Arjun' : 'Type your question for Circle'} style={styles.input} />
          <Pressable onPress={() => send()} disabled={!draft.trim()} accessibilityRole="button" accessibilityLabel={waitingForNote ? 'Review note' : 'Send question'} accessibilityState={{ disabled: !draft.trim() }} style={({ pressed }) => [styles.send, !draft.trim() && styles.disabled, pressed && styles.pressed]}><Text variant="headline" color={colors.white}>{waitingForNote ? 'Review' : 'Send'}</Text></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function savitaResponse(input: string, context: Context, linkedRecordId?: string): Response {
  const q = input.toLowerCase();
  const { records, tasks, medications, bookings, takenMedicationIds } = context;
  const medicines = medications.filter((item) => item.memberId === 'savita' && !item.archived);
  if (/emergency|chest pain|cannot breathe|can.t breathe|unconscious/.test(q)) return { text: 'Call emergency services now. Use 112 in India. Circle cannot assess an emergency.', actions: [{ label: 'Emergency information', href: '/emergency' }] };
  if (linkedRecordId && (q.includes('report') || q.includes('explain'))) {
    const record = records.find((item) => item.id === linkedRecordId && item.memberId === 'savita');
    return record ? explainRecord(record) : { text: 'That report is not available in your records. You can choose one of your own reports below.', actions: [{ label: 'Open my reports', href: '/records' }] };
  }
  if (q.includes('today')) {
    const mobility = tasks.find((item) => item.id === 'mobility' && item.memberId === 'savita');
    const gel = medicines.find((item) => item.id === 'savita-diclofenac');
    const remaining = [mobility && !mobility.completed ? 'Do your mobility exercises for 10 minutes, following your care plan.' : null, gel && !takenMedicationIds.includes(gel.id) ? `Apply your ${gel.name.toLowerCase()} as directed. Your saved schedule is ${gel.schedule.toLowerCase()}.` : null].filter(Boolean);
    return { text: remaining.length ? `You have ${remaining.length === 1 ? 'one thing' : 'two things'} left on your Today list:\n\n${remaining.map((item) => `• ${item}`).join('\n\n')}` : 'Both items on your Today list are done. You can undo an entry on Today if you marked it by mistake.', actions: [{ label: 'Open Today', href: '/' }] };
  }
  if (q.includes('appointment') || q.includes('physio') || q.includes('prepare')) {
    const appointment = bookings.filter((item) => item.memberId === 'savita' && item.status === 'Confirmed').sort((a, b) => bookingTimeValue(a) - bookingTimeValue(b))[0];
    const provider = appointment ? providerById(appointment.providerId) : undefined;
    return appointment ? { text: `Your next saved appointment is ${appointment.service.toLowerCase()}${provider ? ` with ${provider.name}` : ''}.\n\n${appointment.date} at ${appointment.time} India time (IST).\n${appointment.mode === 'In person' ? 'Clinic visit' : appointment.mode}.`, actions: [{ label: 'Help me get ready', href: `/appointment-prep/${appointment.id}` }, { label: 'View appointment', href: `/booking/${appointment.id}` }] } : { text: 'You do not have a confirmed appointment in Circle. You can find care or ask Arjun to help.', actions: [{ label: 'Open My care', href: '/care' }] };
  }
  if (/medicine|medication|gel/.test(q)) return { text: medicines.length ? `Your saved medicine and care list:\n\n${medicines.map((item) => `• ${item.name}: ${item.dose}. ${item.schedule}.`).join('\n\n')}\n\nFollow your current prescription or clinician’s directions.` : 'There are no active medicines in your saved list.', actions: [{ label: 'Open my medicines', href: '/medications' }] };
  if (/report|explain|vaccin/.test(q)) {
    const ownRecords = records.filter((item) => item.memberId === 'savita').sort((a, b) => fixtureDateValue(b.date) - fixtureDateValue(a.date));
    const record = q.includes('vaccin') ? ownRecords.find((item) => item.category === 'Vaccination') : ownRecords[0];
    return record ? explainRecord(record) : { text: 'I could not find that report in your records. Choose a report or add one to your records.', actions: [{ label: 'Open my reports', href: '/records' }] };
  }
  return { text: 'In this demo I can show your Today list, saved medicines, report explanations and appointments. Try “Explain my latest report” or “When is my next appointment?”', actions: [{ label: 'Open my reports', href: '/records' }, { label: 'Open My care', href: '/care' }] };
}

function explainRecord(record: HealthRecord): Response {
  return { text: record.status === 'Processing' ? 'This report is still processing. Its explanation is not ready yet.' : `${record.explanation}\n\nFrom your saved record, dated ${record.date}.`, citations: [{ title: record.title, recordId: record.id }], actions: [{ label: 'Open this report', href: `/record/${record.id}` }] };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  body: { fontSize: 19, lineHeight: 28 },
  header: { paddingHorizontal: screenPadding, paddingTop: spacing.sm },
  conversation: { flex: 1 },
  conversationContent: { flexGrow: 1, gap: spacing.xl, paddingHorizontal: screenPadding, paddingVertical: spacing.xl },
  welcome: { gap: spacing.lg },
  prompts: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 18, overflow: 'hidden' },
  prompt: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  promptDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  flex: { flex: 1, minWidth: 0 },
  messageGroup: { gap: spacing.sm },
  userGroup: { alignItems: 'flex-end' },
  circleGroup: { alignItems: 'flex-start' },
  bubble: { maxWidth: '95%', padding: spacing.lg, borderRadius: radius.card },
  userBubble: { backgroundColor: colors.blueTint, borderBottomRightRadius: spacing.xs },
  circleBubble: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderBottomLeftRadius: spacing.xs },
  citation: { width: '95%', minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.input, backgroundColor: colors.blueTint },
  action: { width: '95%', minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: 14, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  stop: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  composerArea: { paddingHorizontal: screenPadding, paddingVertical: spacing.md, backgroundColor: colors.background, gap: spacing.sm },
  demo: { fontSize: 18, lineHeight: 25 },
  composer: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: 18, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
  input: { flex: 1, minHeight: 56, maxHeight: 130, paddingHorizontal: spacing.sm, paddingVertical: spacing.md, color: colors.textPrimary, fontSize: 19, lineHeight: 26 },
  send: { minWidth: 74, minHeight: 56, paddingHorizontal: spacing.md, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
