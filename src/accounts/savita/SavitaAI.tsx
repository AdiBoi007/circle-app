import { useCallback, useEffect, useRef, useState } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CircleAIIcon } from '@/components/icons/CircleAIIcon';
import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { useAppState } from '@/state';
import { colors, radius, screenPadding, spacing } from '@/theme';
import type { ChatMessage, HealthRecord } from '@/types';

const prompts = [
  'What do I need to do today?',
  'When is my next appointment?',
  'Explain my medicines.',
  'Explain my latest report.',
  'Help me tell Arjun something.',
];

type Response = Omit<ChatMessage, 'id' | 'role'>;

export function SavitaAI() {
  const { prompt, recordId } = useLocalSearchParams<{ prompt?: string; recordId?: string }>();
  const { records, addNotification, addFamilyLog, aiHistoryKey, personalPreferences } = useAppState();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [lastQuestion, setLastQuestion] = useState('A health question');
  const scrollRef = useRef<ScrollView>(null);
  const idRef = useRef(0);
  const activityIdRef = useRef(0);
  const promptRef = useRef<string | undefined>(undefined);
  const historyRef = useRef(aiHistoryKey);
  const nextId = useCallback(() => `savita-chat-${++idRef.current}`, []);

  const send = useCallback((value = draft) => {
    const clean = value.trim();
    if (!clean || typing) return;
    setLastQuestion(clean);
    setMessages((current) => [...current, { id: nextId(), role: 'user', text: clean }]);
    setDraft('');
    setTyping(true);
    setTimeout(() => {
      const response = savitaResponse(clean, records, recordId);
      setMessages((current) => [...current, { id: nextId(), role: 'assistant', ...response }]);
      if (personalPreferences.readAloud) {
        void Speech.stop().then(() => Speech.speak(response.text, { language: 'en-IN', rate: 0.88 }));
      }
      setTyping(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }, personalPreferences.reduceMotion ? 0 : 450);
  }, [draft, nextId, personalPreferences.readAloud, personalPreferences.reduceMotion, recordId, records, typing]);

  useEffect(() => () => {
    void Speech.stop();
  }, []);

  useEffect(() => {
    if (!prompt || promptRef.current === prompt) return;
    promptRef.current = prompt;
    const timer = setTimeout(() => send(prompt), 0);
    return () => clearTimeout(timer);
  }, [prompt, send]);

  useEffect(() => {
    if (historyRef.current === aiHistoryKey) return;
    historyRef.current = aiHistoryKey;
    setMessages([]);
  }, [aiHistoryKey]);

  const handleAction = (href: string) => {
    if (href === 'share-arjun') {
      const activityId = ++activityIdRef.current;
      addNotification({ id: `savita-share-${aiHistoryKey}-${activityId}`, title: 'Savita shared an update', body: `Savita asked Circle: “${lastQuestion}”`, memberId: 'savita', time: 'Just now', group: 'Today', read: false, href: '/member/savita' });
      addFamilyLog({ id: `savita-share-log-${aiHistoryKey}-${activityId}`, memberId: 'savita', category: 'Note', text: `Savita shared with Arjun: ${lastQuestion}`, time: 'Just now' });
      setMessages((current) => [...current, { id: nextId(), role: 'assistant', text: 'Shared with Arjun. He will see it in the family updates.' }]);
      return;
    }
    router.push(href as never);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <View style={styles.logo}><CircleAIIcon size={32} color={colors.blue} /></View>
          <View style={styles.headerCopy}><Text variant="title1">Ask Circle</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>Ask about your health in your own words.</Text></View>
        </View>
        <ScrollView ref={scrollRef} style={styles.conversation} contentContainerStyle={[styles.conversationContent, !messages.length && styles.empty]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!messages.length ? <View style={styles.prompts}>{prompts.map((item) => <Pressable key={item} onPress={() => send(item)} accessibilityRole="button" accessibilityLabel={item} style={({ pressed }) => [styles.prompt, pressed && styles.pressed]}><Feather name="message-circle" size={22} color={colors.blue} /><Text variant="headline" style={styles.flex}>{item}</Text><Feather name="chevron-right" size={22} color={colors.textSecondary} /></Pressable>)}</View> : null}
          {messages.map((message) => (
            <View key={message.id} style={[styles.messageGroup, message.role === 'user' ? styles.userGroup : styles.circleGroup]}>
              {message.role === 'assistant' ? <Text variant="subhead" color={colors.textSecondary}>CIRCLE</Text> : null}
              <View style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.circleBubble]}><Text variant="body" color={message.role === 'user' ? colors.white : colors.textPrimary} style={styles.body}>{message.text}</Text></View>
              {message.citations?.map((citation) => <Pressable key={citation.title} onPress={() => citation.recordId ? router.push(`/record/${citation.recordId}`) : undefined} accessibilityRole="button" accessibilityLabel={`Open ${citation.title}`} style={({ pressed }) => [styles.citation, pressed && styles.pressed]}><Feather name="file-text" size={20} color={colors.blue} /><Text variant="body" color={colors.blue} style={[styles.body, styles.flex]}>{citation.title}</Text><Feather name="chevron-right" size={21} color={colors.blue} /></Pressable>)}
              {message.actions?.slice(0, 3).map((action) => <Pressable key={action.label} onPress={() => handleAction(action.href)} accessibilityRole="button" accessibilityLabel={action.label} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text variant="headline" style={styles.flex}>{action.label}</Text><Feather name="arrow-right" size={21} color={colors.blue} /></Pressable>)}
            </View>
          ))}
          {typing ? <View style={styles.typing} accessibilityLabel="Circle is writing"><View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} /></View> : null}
        </ScrollView>
        <View style={styles.composerArea}>
          <View style={styles.composer}>
            <Pressable onPress={() => router.push('/savita-upload')} accessibilityRole="button" accessibilityLabel="Upload a report" style={({ pressed }) => [styles.composerButton, pressed && styles.pressed]}><Feather name="camera" size={23} color={colors.blue} /></Pressable>
            <TextInput value={draft} onChangeText={setDraft} placeholder="Type your question" placeholderTextColor={colors.textSecondary} multiline maxLength={400} accessibilityLabel="Type your question for Circle" style={styles.input} onSubmitEditing={() => send()} />
            <Pressable onPress={() => send('What do I need to do today?')} accessibilityRole="button" accessibilityLabel="Ask using microphone" accessibilityHint="Uses a seeded voice question" style={({ pressed }) => [styles.composerButton, pressed && styles.pressed]}><Feather name="mic" size={23} color={colors.blue} /></Pressable>
            <Pressable onPress={() => send()} disabled={!draft.trim() || typing} accessibilityRole="button" accessibilityLabel="Send question" accessibilityState={{ disabled: !draft.trim() || typing }} style={({ pressed }) => [styles.send, (!draft.trim() || typing) && styles.disabled, pressed && styles.pressed]}><Ionicons name="arrow-up" size={23} color={colors.white} /></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function savitaResponse(input: string, records: HealthRecord[], linkedRecordId?: string): Response {
  const q = input.toLowerCase();
  if (/emergency|chest pain|cannot breathe|can.t breathe|unconscious/.test(q)) return { text: 'Call emergency services now. Use 112 in India. Stay with someone you trust. Circle cannot assess an emergency.', actions: [{ label: 'Emergency information', href: '/emergency' }, { label: 'Share with Arjun', href: 'share-arjun' }] };
  if (q.includes('today')) return { text: 'You have two things to do today:\n\n• Do your mobility exercises for 10 minutes.\n• Take your evening medicine after dinner.\n\nYour physiotherapy visit is tomorrow at 10:00 AM.', actions: [{ label: 'Open My Health', href: '/' }, { label: 'Share with Arjun', href: 'share-arjun' }] };
  if (q.includes('appointment') || q.includes('physio') || q.includes('prepare')) return { text: 'Your next appointment is physiotherapy with Vikram Nair. It is on 14 July at 10:00 AM at home.', actions: [{ label: 'Get ready', href: '/appointment-prep/physio-savita' }, { label: 'View details', href: '/booking/physio-savita' }, { label: 'Share with Arjun', href: 'share-arjun' }] };
  if (q.includes('medicine')) return { text: 'Your current list includes calcium with vitamin D, knee gel, and pain medicine only when directed. Follow the label or your clinician’s instructions. Ask a pharmacist or clinician if anything is unclear.', actions: [{ label: 'Open medicines', href: '/medications' }, { label: 'Share with Arjun', href: 'share-arjun' }] };
  if (q.includes('report') || q.includes('explain')) {
    const record = records.find((item) => item.id === linkedRecordId) ?? records.find((item) => item.memberId === 'savita');
    return { text: record ? 'Your report is about your knee and movement. It records knee pain and recommends continuing the mobility plan. It does not change your treatment. Ask your physiotherapist if an exercise feels uncomfortable.' : 'I could not find a report yet. Add a photo or file and I can explain it in simple language.', citations: record ? [{ title: record.title, recordId: record.id }] : undefined, actions: [{ label: 'Add a report', href: '/savita-upload' }, { label: 'Share with Arjun', href: 'share-arjun' }] };
  }
  if (q.includes('arjun') || q.includes('share') || q.includes('tell')) return { text: 'I can share this with Arjun. He will see a new update in his family account.', actions: [{ label: 'Share with Arjun', href: 'share-arjun' }] };
  if (q.includes('pain') || q.includes('worse')) return { text: 'Your last knee pain entry was 6 out of 10, about the same as before. If pain suddenly becomes severe, you cannot put weight on the leg, or you feel unwell, contact a qualified health professional.', actions: [{ label: 'View knee pain', href: '/metric/savita/knee-pain' }, { label: 'Share with Arjun', href: 'share-arjun' }] };
  return { text: 'I can help with today’s tasks, medicines, reports and appointments. Ask one short question at a time. I will explain any medical words.', actions: [{ label: 'Share with Arjun', href: 'share-arjun' }] };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  body: { fontSize: 18, lineHeight: 26 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: screenPadding, paddingVertical: spacing.md },
  logo: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueTint },
  headerCopy: { flex: 1, gap: spacing.xxs },
  conversation: { flex: 1 },
  conversationContent: { flexGrow: 1, gap: spacing.xl, paddingHorizontal: screenPadding, paddingVertical: spacing.lg },
  empty: { justifyContent: 'center' },
  prompts: { gap: spacing.md },
  prompt: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  flex: { flex: 1, minWidth: 0 },
  messageGroup: { gap: spacing.sm },
  userGroup: { alignItems: 'flex-end' },
  circleGroup: { alignItems: 'flex-start' },
  bubble: { maxWidth: '90%', padding: spacing.lg, borderRadius: radius.card },
  userBubble: { backgroundColor: colors.blue, borderBottomRightRadius: spacing.xs },
  circleBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: spacing.xs },
  citation: { width: '90%', minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.input, backgroundColor: colors.blueTint },
  action: { width: '90%', minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.button, backgroundColor: colors.surfaceMuted },
  typing: { width: 72, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderRadius: radius.card, backgroundColor: colors.surface },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textSecondary },
  composerArea: { paddingHorizontal: screenPadding, paddingVertical: spacing.sm, backgroundColor: colors.background },
  composer: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radius.cardLarge, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  composerButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueTint },
  input: { flex: 1, minHeight: 48, maxHeight: 110, paddingHorizontal: spacing.sm, color: colors.textPrimary, fontSize: 18, lineHeight: 24 },
  send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
