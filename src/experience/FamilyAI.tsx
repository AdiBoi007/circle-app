import { useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Sheet, Text } from '@/components';
import { family, providerById } from '@/data';
import { ExperienceHeader } from '@/experience/ExperienceHeader';
import { useAppState } from '@/state';
import { colors } from '@/theme';
import type { MemberId } from '@/types';
import { bookingTimeValue } from '@/utils/bookingTime';

type Answer = { text: string; link?: { title: string; href: Href } };
type Message = { id: number; question: string; answer: Answer; context: string };
export function FamilyAI() {
  const state = useAppState();
  const { prompt, mode, recordId } = useLocalSearchParams<{ prompt?: string; mode?: string; recordId?: string }>();
  const [context, setContext] = useState<MemberId | 'family'>('family');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [noteOpen, setNoteOpen] = useState(mode === 'logging');
  const [note, setNote] = useState('');
  const [noteMember, setNoteMember] = useState<MemberId>('arjun');
  const [saved, setSaved] = useState('');
  const lastPrompt = useRef('');
  const sequence = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const contextLabel = context === 'family' ? 'Your family' : family.find((person) => person.id === context)!.name;

  const answer = (question: string): Answer => {
    const q = question.toLowerCase();
    const matches = (id: MemberId) => context === 'family' || id === context;
    const record = recordId ? state.records.find((item) => item.id === recordId && matches(item.memberId)) : state.records.find((item) => matches(item.memberId) && q.includes(item.title.toLowerCase()));
    if (record) return { text: record.status === 'Ready' ? `About ${record.title}:\n\n${record.explanation}\n\nThis is a prepared explanation of a sample record. Check the original with your clinician.` : 'This report is still processing. There isn’t an explanation to show yet.', link: { title: 'Open the source record', href: `/record/${record.id}` } };
    if (/appointment|booking|visit|physio/.test(q)) {
      const next = [...state.bookings].filter((item) => matches(item.memberId) && item.status === 'Confirmed').sort((a, b) => bookingTimeValue(a) - bookingTimeValue(b))[0];
      return next ? { text: `Next in the July demo schedule:\n\n${next.service} for ${family.find((person) => person.id === next.memberId)?.name}.\n${next.date} at ${next.time}, IST.\nWith ${providerById(next.providerId)?.name ?? 'your practitioner'}.\n\nThis is a sample booking.`, link: { title: 'View appointment', href: `/booking/${next.id}` } } : { text: 'No confirmed appointments in this view.', link: { title: 'Find care', href: '/care' } };
    }
    if (/medicine|medication/.test(q)) {
      const medicines = state.medications.filter((item) => matches(item.memberId) && !item.archived);
      return { text: `There are ${medicines.length} active medicines in this view.\n\n${medicines.map((item) => `${item.name} · ${item.schedule} · ${state.takenMedicationIds.includes(item.id) ? 'logged today' : 'not yet logged'}`).join('\n')}\n\nOpen Medicines to review instructions or record a dose.`, link: { title: 'Open medicines', href: '/medications' } };
    }
    if (/record|report|result/.test(q)) return { text: 'Choose a report from Health records, then select its explanation. That keeps the explanation connected to the right person and source.', link: { title: 'Choose a report', href: '/records' } };
    if (/today|attention|task|summary|week|help/.test(q)) {
      const remaining = state.tasks.filter((item) => matches(item.memberId) && !item.completed);
      return { text: remaining.length ? `${remaining.length} open tasks in the sample care plan:\n\n${remaining.map((item) => `• ${item.title} — ${family.find((person) => person.id === item.memberId)?.name.split(' ')[0]}`).join('\n')}\n\nChoose a task to see its details or mark it done.` : 'All tasks in this view are marked done. You can review or undo them from the task list.', link: { title: 'View tasks', href: '/tasks' } };
    }
    return { text: 'This preview can show current tasks, medicines, appointments and explanations of sample records. Try “What needs attention today?”\n\nFor a symptom or treatment question, speak with a qualified clinician. Circle’s preview cannot assess your health.', link: { title: 'Browse health tools', href: '/health' } };
  };
  const ask = (question: string) => { if (!question.trim()) return; setMessages((items) => [...items, { id: ++sequence.current, question: question.trim(), answer: answer(question), context: contextLabel }]); setDraft(''); };
  useEffect(() => { if (prompt && lastPrompt.current !== prompt) { lastPrompt.current = prompt; ask(prompt); } });
  const saveNote = () => {
    const text = note.trim(); if (!text) return;
    state.addFamilyLog({ id: `family-note-${Date.now()}`, memberId: noteMember, category: 'Note', text, time: 'Just now' });
    setSaved(`Saved to ${family.find((person) => person.id === noteMember)!.name.split(' ')[0]}’s demo updates.`);
    setNote(''); setNoteOpen(false);
  };
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.screen}><ScrollView ref={scrollRef} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" onContentSizeChange={() => { if (messages.length) scrollRef.current?.scrollToEnd({ animated: false }); }}>
    <ExperienceHeader eyebrow="A LITTLE CLARITY" title="Ask Circle" subtitle="Questions about your family’s health." />
    <Text variant="footnote" color={colors.textSecondary}>Preview answers · sample family data · not live AI</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contexts}>{[{ id: 'family' as const, name: 'Everyone' }, ...family].map((person) => <Pressable key={person.id} accessibilityRole="button" accessibilityState={{ selected: context === person.id }} onPress={() => setContext(person.id)} style={[styles.pill, context === person.id && styles.selected]}><Text variant="subhead" color={context === person.id ? colors.blue : colors.textSecondary}>{person.name.split(' ')[0]}</Text></Pressable>)}</ScrollView>
    {!messages.length && <View style={styles.welcome}><View style={styles.orb}><Feather name="message-circle" size={32} color={colors.blue} /></View><Text variant="title1">What would help today?</Text><Text color={colors.textSecondary}>Choose a question to get started.</Text>{['What needs attention today?', 'What’s the next appointment?', 'Help me find a report'].map((question) => <Pressable key={question} onPress={() => ask(question)} accessibilityRole="button" style={styles.suggestion}><Text variant="callout" style={{ flex: 1 }}>{question}</Text><Feather name="arrow-up-right" size={20} color={colors.blue} /></Pressable>)}</View>}
    {messages.map((message) => <View key={message.id} style={styles.exchange}><View style={styles.question}><Text>{message.question}</Text></View><View style={styles.answer}><Text variant="overline" color={colors.blue}>CIRCLE · {message.context.toUpperCase()}</Text><Text>{message.answer.text}</Text>{message.answer.link && <Button title={message.answer.link.title} variant="secondary" onPress={() => router.push(message.answer.link!.href)} />}</View></View>)}
    {saved && <Text accessibilityLiveRegion="polite" color={colors.blue}>{saved}</Text>}
    </ScrollView><View style={styles.footer}>
    <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Ask about your family’s care…" placeholderTextColor={colors.textSecondary} multiline accessibilityLabel="Your question" style={styles.input} /><Pressable onPress={() => ask(draft)} disabled={!draft.trim()} accessibilityRole="button" accessibilityLabel="Send question" accessibilityState={{ disabled: !draft.trim() }} style={[styles.send, !draft.trim() && { opacity: 0.4 }]}><Feather name="arrow-up" size={23} color={colors.white} /></Pressable></View>
    <View style={styles.actions}><Pressable accessibilityRole="button" onPress={() => setNoteOpen(true)} style={styles.action}><Feather name="edit-3" size={18} color={colors.blue} /><Text variant="subhead" color={colors.blue}>Save a family update</Text></Pressable>{messages.length > 0 && <Pressable accessibilityRole="button" onPress={() => setMessages([])} style={styles.action}><Text variant="subhead" color={colors.textSecondary}>New chat</Text></Pressable>}</View>
    </View>
    <Sheet visible={noteOpen} onClose={() => setNoteOpen(false)} title="Save a family update" footer={<Button title="Save update" disabled={!note.trim()} onPress={saveNote} />}>
      <Text color={colors.textSecondary}>Who is this about?</Text><View style={styles.contexts}>{family.map((person) => <Pressable key={person.id} onPress={() => setNoteMember(person.id)} accessibilityRole="button" accessibilityState={{ selected: noteMember === person.id }} style={[styles.pill, noteMember === person.id && styles.selected]}><Text variant="subhead">{person.name.split(' ')[0]}</Text></Pressable>)}</View>
      <TextInput accessibilityLabel="Family update to save" value={note} onChangeText={setNote} placeholder="Write what you want the family to know…" placeholderTextColor={colors.textSecondary} multiline style={[styles.input, styles.note]} />
      <Text variant="footnote" color={colors.textSecondary}>Saved as a note in this demo. Medicine and task completion are recorded separately from their own screens.</Text>
    </Sheet>
  </KeyboardAvoidingView></SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' }, footer: { paddingHorizontal: 20, paddingTop: 8, backgroundColor: colors.background },
  page: { gap: 18, padding: 20 }, contexts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 6 }, pill: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 25, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, selected: { backgroundColor: colors.blueTint, borderColor: colors.blue },
  welcome: { gap: 17, paddingVertical: 13 }, orb: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' }, suggestion: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, borderRadius: 16, backgroundColor: colors.surface },
  exchange: { gap: 14 }, question: { alignSelf: 'flex-end', maxWidth: '92%', padding: 17, borderRadius: 22, backgroundColor: colors.blueTint }, answer: { padding: 22, borderRadius: 20, backgroundColor: colors.surface, gap: 17 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 28, backgroundColor: colors.surface }, input: { flex: 1, minWidth: 0, minHeight: 48, maxHeight: 140, padding: 13, fontSize: 17, color: colors.textPrimary }, send: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }, action: { minHeight: 48, flexDirection: 'row', gap: 7, alignItems: 'center' }, note: { minHeight: 125, backgroundColor: colors.surfaceMuted, borderRadius: 15, marginVertical: 16 },
});
