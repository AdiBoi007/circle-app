import { useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components';
import { launchMarket } from '@/config/launch';
import { individualHabits, individualProviders, nextPersonalBooking, personalDate, personalTime, type IndividualBooking } from '@/data/individual';
import { ExperienceHeader } from '@/experience/ExperienceHeader';
import { useAppState } from '@/state';
import { colors, screenPadding } from '@/theme';
import { ui } from './PersonalUI';

type PreviewAnswer = { text: string; action?: string; href?: '/care' | '/personal/bookings' | '/health' };
type Message = { id: string; question: string; answer: PreviewAnswer };

export function personalPreviewAnswer(question: string, bookings: IndividualBooking[], completedHabitIds: string[]): PreviewAnswer {
  const q = question.toLowerCase();
  if (/\b(emergency|suicid\w*|self.harm|hurt myself|kill myself|want to die)\b/.test(q)) return { text: `If you are in immediate danger in ${launchMarket.country}, call 112. For mental health support, call Tele MANAS on 14416. This preview cannot provide emergency support.` };
  if (/\b(pain|diagnos|symptom|medicine|medication|dose|treatment)\b/.test(q)) return { text: 'This preview can help you organise care, but cannot assess symptoms, diagnose a condition or recommend treatment. For a personal medical question, speak with a qualified clinician. You can use Find care to explore the sample practitioner journey.', action: 'Explore care', href: '/care' };
  if (/\b(prepare|first session|before a|should i ask|questions)\b/.test(q)) return { text: 'Here are a few questions you could bring to a first conversation:\n\n• What is your approach, and what can I expect?\n• What experience do you have with my goals?\n• What are your qualifications and professional registration, if applicable?\n• What does a session cost, and what is the cancellation policy?\n• How do you protect my privacy?\n\nStart with what you want help with. You don’t need to have everything figured out.', action: 'View my appointments', href: '/personal/bookings' };
  if (/\b(appointment|booking|diary|schedule|next session)\b/.test(q)) {
    const next = nextPersonalBooking(bookings);
    const provider = individualProviders.find((item) => item.id === next?.providerId);
    return next ? { text: `Your next demo appointment is with ${provider?.name ?? 'your practitioner'} for ${next.service.toLowerCase()}.\n\n${personalDate(next.date)} at ${personalTime(next.time)}, ${launchMarket.city} time (${launchMarket.timeZoneLabel}, UTC${launchMarket.utcOffset}).\n${next.mode === 'Online' ? 'Online session.' : `In person: ${provider?.location}.`}\n\nThis is a preview booking. No practitioner has been contacted.`, action: 'View my appointments', href: '/personal/bookings' } : { text: 'You have no confirmed demo appointments. When you book a sample session in Find care, it will appear here and in your diary.', action: 'Find care', href: '/care' };
  }
  if (/\b(therapy|therapist|counsellor|psychologist|trainer|fitness|dietitian|nutrition|physio|physiotherapy|yoga|care|practitioner)\b/.test(q)) return { text: `Find care brings five kinds of support into one place: therapy, fitness, nutrition, physiotherapy and yoga.\n\nChoose a category, then Online or In person. This first preview serves ${launchMarket.city} only, including online sessions for local clients. Each sample profile shows an example qualification, languages, session length and price in ${launchMarket.currency}.\n\nA useful first step is choosing the kind of support you want and comparing the approach of two practitioners. The sample profiles are not verified recommendations.`, action: 'Explore practitioners', href: '/care' };
  if (/\b(sleep|tired|rest)\b/.test(q)) return { text: 'Your sample health snapshot shows 7 hr 20 min of sleep for 24 September. It is example data, not a reading from a connected device.\n\nIf you want to understand a pattern, you could note your sleep times, how rested you feel, and any questions to discuss with a qualified clinician. Circle’s preview doesn’t assess sleep health.', action: 'See my health', href: '/health' };
  if (/\b(today|week|plan|focus|habit|gentle|win)\b/.test(q)) {
    const remaining = individualHabits.filter((habit) => !completedHabitIds.includes(habit.id));
    return { text: remaining.length ? `Keep it manageable. You have ${remaining.length} personal ${remaining.length === 1 ? 'habit' : 'habits'} left in your demo today:\n\n${remaining.map((habit) => `• ${habit.title}`).join('\n')}\n\nPick whichever feels realistic. Your check-ins are yours to change, and a missed day is simply a chance to begin again.` : 'You’ve checked off all three personal habits in your demo today. You can leave it there. If you want to reflect, think about which one felt useful and what you would like to keep tomorrow.', action: 'My health', href: '/health' };
  }
  return { text: 'I can demonstrate three things with Riya’s sample data: help you plan a gentle day, show your next demo appointment, or prepare questions for a practitioner.\n\nTry “What’s my next appointment?” or “Help me plan a gentle week.” These are scripted preview answers, not a live AI consultation.' };
}

export function IndividualAI() {
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const { individualBookings, completedHabitIds } = useAppState();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const lastPrompt = useRef<string | undefined>(undefined);
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => { if (prompt && prompt !== lastPrompt.current) { lastPrompt.current = prompt; setMessages((current) => [...current, { id: `prompt-${Date.now()}`, question: prompt, answer: personalPreviewAnswer(prompt, individualBookings, completedHabitIds) }]); } }, [prompt, individualBookings, completedHabitIds]);
  const ask = (question: string) => { if (!question.trim()) return; setMessages((current) => [...current, { id: String(Date.now()), question: question.trim(), answer: personalPreviewAnswer(question.trim(), individualBookings, completedHabitIds) }]); setDraft(''); };
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
      <ScrollView ref={scrollRef} style={styles.conversation} contentContainerStyle={styles.conversationContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} onContentSizeChange={() => { if (messages.length) scrollRef.current?.scrollToEnd({ animated: false }); }}>
    <ExperienceHeader title="Ask Circle" />
    <View style={styles.label}><Feather name="info" size={16} color={colors.textSecondary} /><Text variant="subhead" color={colors.textSecondary}>Preview answers</Text></View><Text variant="footnote" color={colors.textSecondary}>Uses Riya’s demo habits and appointments. Not live AI or medical advice.</Text>
    {messages.length === 0 ? <><View style={styles.intro}><View style={styles.orb}><Feather name="message-circle" size={27} color={colors.blue} /></View><Text variant="title2" align="center">How can I help?</Text><Text variant="callout" align="center" color={colors.textSecondary}>Ask a question, or choose one below.</Text></View><View style={{ gap: 10 }}>{['Help me plan a gentle week', 'How do I find the right practitioner?', 'What’s my next appointment?'].map((question) => <Pressable key={question} onPress={() => ask(question)} accessibilityRole="button" style={[ui.card, ui.between]}><Text variant="callout" style={ui.flex}>{question}</Text><Feather name="arrow-up-right" size={20} color={colors.blue} /></Pressable>)}</View></> : <View style={{ gap: 22 }}>{messages.map((message) => <View key={message.id} style={{ gap: 14 }}><View style={styles.question}><Text variant="callout">{message.question}</Text></View><View style={[ui.card, { gap: 16 }]}><Text variant="overline" color={colors.blue}>CIRCLE · PREVIEW</Text><Text variant="body">{message.answer.text}</Text>{message.answer.action && message.answer.href ? <Pressable onPress={() => router.push(message.answer.href!)} accessibilityRole="button" style={ui.textAction}><Text variant="headline" color={colors.blue} style={{ flexShrink: 1 }}>{message.answer.action}</Text><Feather name="arrow-right" size={18} color={colors.blue} /></Pressable> : null}</View></View>)}<Pressable onPress={() => setMessages([])} accessibilityRole="button" style={ui.textAction}><Feather name="refresh-cw" size={16} color={colors.textSecondary} /><Text variant="subhead" color={colors.textSecondary} style={{ flexShrink: 1 }}>Start a new conversation</Text></Pressable></View>}
      </ScrollView>
      <View style={styles.composerArea}>
    <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Ask about your wellbeing…" placeholderTextColor={colors.textSecondary} accessibilityLabel="Your question for Circle" style={styles.input} multiline /><Pressable onPress={() => ask(draft)} disabled={!draft.trim()} accessibilityRole="button" accessibilityLabel="Send question" accessibilityState={{ disabled: !draft.trim() }} style={[styles.send, !draft.trim() && { opacity: 0.4 }]}><Feather name="arrow-up" size={23} color={colors.white} /></Pressable></View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, screen: { flex: 1, minHeight: 0, width: '100%', maxWidth: 760, alignSelf: 'center' }, conversation: { flex: 1, minHeight: 0 }, conversationContent: { flexGrow: 1, gap: 18, paddingHorizontal: screenPadding, paddingTop: 8, paddingBottom: 24 }, composerArea: { paddingHorizontal: screenPadding, paddingVertical: 12, backgroundColor: colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }, label: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: -10 }, intro: { alignItems: 'center', gap: 10, paddingVertical: 12 }, orb: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }, question: { alignSelf: 'flex-end', maxWidth: '90%', padding: 16, borderRadius: 22, borderBottomRightRadius: 6, backgroundColor: colors.blueTint }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 26, backgroundColor: colors.surface }, input: { flex: 1, minWidth: 0, minHeight: 48, maxHeight: 140, padding: 13, fontSize: 17, color: colors.textPrimary }, send: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.blue } });
