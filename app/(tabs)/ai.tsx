import { useEffect, useRef, useState } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, CircleMark, Sheet, Text } from "@/components";
import { suggestedPrompts } from "@/data";
import { useAppState } from "@/state";
import { colors, radius, screenPadding, shadows, spacing } from "@/theme";
import type { ChatMessage, MemberId, TodayItem } from "@/types";
import { loggingResponseFor, responseFor, type ClassifiedFamilyLog } from "@/utils/aiResponse";
import { SavitaAI } from '@/accounts/savita/SavitaAI';

const contexts = ["Family", "Arjun", "Rajiv", "Neha", "Savita"] as const;

export default function CircleAiScreen() {
  const { activeAccountId } = useAppState();
  return activeAccountId === 'savita' ? <SavitaAI /> : <ArjunCircleAiScreen />;
}

function ArjunCircleAiScreen() {
  const { prompt, mode } = useLocalSearchParams<{ prompt?: string; mode?: string }>();
  const logging = mode === "logging";
  const { addTask, aiHistoryKey, addFamilyLog, tasks, toggleTask, takenMedicationIds, toggleMedication } = useAppState();
  const [draft, setDraft] = useState("");
  const [context, setContext] = useState<(typeof contexts)[number]>("Family");
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    prompt
      ? [
          { id: "linked-user", role: "user", text: prompt },
          { id: "linked-circle", role: "assistant", ...responseFor(prompt) },
        ]
      : logging
        ? [{
            id: "logging-intro",
            role: "assistant",
            text: "Tell Circle what happened in your own words. I’ll identify the family member and classify it as a medication, symptom, metric, task completion or note. You’ll confirm before anything is saved.\n\nTry:\n• Dad took his evening medication\n• Mum felt tired today\n• Grandma completed her exercises\n• Add Rajiv’s blood-pressure reading",
          }]
        : [],
  );
  const [typing, setTyping] = useState(false);
  const [attachments, setAttachments] = useState(false);
  const [pendingLog, setPendingLog] = useState<ClassifiedFamilyLog>();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const idRef = useRef(0);
  const historyKeyRef = useRef(aiHistoryKey);
  const promptRef = useRef(prompt);
  const nextId = (prefix: string) => `${prefix}-${++idRef.current}`;

  useEffect(() => {
    if (historyKeyRef.current === aiHistoryKey) return;
    historyKeyRef.current = aiHistoryKey;
    const timer = setTimeout(() => setMessages([]), 0);
    return () => clearTimeout(timer);
  }, [aiHistoryKey]);

  useEffect(() => {
    if (!prompt || promptRef.current === prompt) return;
    promptRef.current = prompt;
    const timer = setTimeout(() => {
      setDraft("");
      setMessages([
        { id: nextId("linked-user"), role: "user", text: prompt },
        {
          id: nextId("linked-circle"),
          role: "assistant",
          ...responseFor(prompt),
        },
      ]);
    }, 0);
    return () => clearTimeout(timer);
  }, [prompt]);

  const scrollToLatest = () =>
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true }),
    );

  const send = (value = draft) => {
    const clean = value.trim();
    if (!clean || typing) return;
    const assistantIndex = messages.length + 1;
    setMessages((current) => [
      ...current,
      { id: nextId("user"), role: "user", text: clean },
    ]);
    setDraft("");
    setTyping(true);
    scrollToLatest();
    setTimeout(() => {
      const result = logging ? loggingResponseFor(clean) : undefined;
      if (result) setPendingLog(result.log);
      setMessages((current) => [
        ...current,
        { id: nextId("circle"), role: "assistant", ...(result?.response ?? responseFor(clean)) },
      ]);
      setTyping(false);
      setTimeout(
        () =>
          listRef.current?.scrollToIndex({
            index: assistantIndex,
            viewPosition: 0,
            animated: true,
          }),
        50,
      );
    }, 650);
  };

  const handleAction = (href: string) => {
    if (href === "confirm-family-log" && pendingLog) {
      addFamilyLog({
        id: nextId("family-log"),
        memberId: pendingLog.memberId,
        category: pendingLog.category,
        text: pendingLog.input,
        time: "Just now",
      });
      if (pendingLog.category === "Task completion" && pendingLog.memberId === "savita") {
        const mobility = tasks.find((task) => task.id === "mobility");
        if (mobility && !mobility.completed) toggleTask(mobility.id);
      }
      if (pendingLog.category === "Medication") {
        const medicationId = pendingLog.memberId === "rajiv"
          ? "rajiv-metformin"
          : pendingLog.memberId === "neha"
            ? "neha-levothyroxine"
            : undefined;
        if (medicationId && !takenMedicationIds.includes(medicationId)) toggleMedication(medicationId);
      }
      setMessages((current) => [
        ...current,
        {
          id: nextId("circle"),
          role: "assistant",
          text: `Saved as ${pendingLog.category.toLowerCase()} for ${({ arjun: "Arjun", rajiv: "Rajiv", neha: "Neha", savita: "Savita" })[pendingLog.memberId]}. It is now in the family timeline.`,
          actions: [{ label: "View Home updates", href: "/" }],
        },
      ]);
      setPendingLog(undefined);
      scrollToLatest();
      return;
    }
    if (href === "confirm-reminder") {
      const task: TodayItem = {
        id: nextId("ai-reminder"),
        title: "Log evening blood pressure",
        memberId: "rajiv" as MemberId,
        who: "Rajiv",
        time: "7:30 pm",
        date: "Today",
        icon: "activity",
        accent: "amber",
        completed: false,
      };
      addTask(task);
      setMessages((current) => [
        ...current,
        {
          id: nextId("circle"),
          role: "assistant",
          text: "Done — Rajiv’s 7:30 pm blood pressure reminder is now in family tasks.",
          actions: [{ label: "View task", href: "/tasks" }],
        },
      ]);
      scrollToLatest();
      return;
    }
    if (href.startsWith("prompt:")) {
      send(href.slice(7));
      return;
    }
    router.push(href as never);
  };

  const renderMessage: ListRenderItem<ChatMessage> = ({ item }) => (
    <View
      style={[
        styles.messageGroup,
        item.role === "user"
          ? styles.messageGroupUser
          : styles.messageGroupCircle,
      ]}
    >
      {item.role === "assistant" ? (
        <Text
          variant="caption"
          color={colors.textSecondary}
          style={styles.speaker}
        >
          CIRCLE
        </Text>
      ) : null}
      <View
        style={[
          styles.bubble,
          item.role === "user" ? styles.userBubble : styles.circleBubble,
        ]}
      >
        <Text
          variant="callout"
          color={item.role === "user" ? colors.white : colors.textPrimary}
        >
          {item.text}
        </Text>
      </View>
      {item.citations?.length ? (
        <View style={styles.sources}>
          <Text variant="caption" color={colors.textSecondary}>
            SOURCES
          </Text>
          {item.citations.map((citation) => (
            <Pressable
              key={citation.title}
              onPress={() =>
                citation.recordId
                  ? router.push(`/record/${citation.recordId}`)
                  : router.push("/records")
              }
              accessibilityRole="button"
              accessibilityLabel={`Open source ${citation.title}`}
              style={styles.sourceCard}
            >
              <Feather name="file-text" size={15} color={colors.blue} />
              <Text
                variant="footnote"
                color={colors.blue}
                style={styles.sourceText}
              >
                {citation.title}
              </Text>
              <Feather name="chevron-right" size={15} color={colors.blue} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {item.actions?.length ? (
        <View style={styles.actions}>
          {item.actions.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => handleAction(action.href)}
              style={({ pressed }) => [
                styles.actionChip,
                pressed && styles.pressed,
              ]}
            >
              <Text
                variant="subhead"
                color={colors.textPrimary}
                numberOfLines={1}
              >
                {action.label}
              </Text>
              <Feather name="arrow-up-right" size={15} color={colors.blue} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text variant="title1">Circle AI</Text>
            <Text variant="footnote" color={colors.textSecondary}>
              {logging ? "Tell it naturally. Confirm before saving." : "Your family, understood."}
            </Text>
          </View>
          <Pressable
            onPress={() => setMessages([])}
            accessibilityRole="button"
            accessibilityLabel="New conversation"
            style={({ pressed }) => [styles.newChat, pressed && styles.pressed]}
          >
            <Feather name="edit-3" size={19} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.contextScroller}
          contentContainerStyle={styles.contextRow}
          keyboardShouldPersistTaps="handled"
        >
          {contexts.map((item) => {
            const selected = item === context;
            return (
              <Pressable
                key={item}
                onPress={() => setContext(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item} context`}
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.contextChip,
                  selected && styles.contextChipSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  variant="subhead"
                  color={selected ? colors.white : colors.textSecondary}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.conversation}
          contentContainerStyle={[
            styles.conversationContent,
            messages.length === 0 && styles.emptyConversation,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScrollToIndexFailed={({ index }) =>
            setTimeout(
              () =>
                listRef.current?.scrollToIndex({
                  index,
                  viewPosition: 0,
                  animated: true,
                }),
              100,
            )
          }
          ListEmptyComponent={<EmptyConversation onPrompt={send} />}
          ListFooterComponent={
            typing ? <TypingBubble /> : <View style={styles.listEndSpace} />
          }
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.composerArea}>
          <View style={styles.composer}>
            <Pressable
              onPress={() => setAttachments(true)}
              accessibilityRole="button"
              accessibilityLabel="Attach context"
              style={({ pressed }) => [
                styles.attach,
                pressed && styles.pressed,
              ]}
            >
              <Feather name="plus" size={20} color={colors.onInk} />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={logging ? "Tell Circle what happened…" : `Ask about ${context.toLowerCase()}…`}
              placeholderTextColor={colors.onInkMuted}
              multiline
              maxLength={500}
              accessibilityLabel={logging ? "Describe what happened" : "Message Circle AI"}
              style={styles.input}
              textAlignVertical="center"
              onFocus={scrollToLatest}
              onSubmitEditing={() => send()}
            />
            <Pressable
              onPress={() => send()}
              disabled={!draft.trim() || typing}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !draft.trim() || typing }}
              style={({ pressed }) => [
                styles.send,
                (!draft.trim() || typing) && styles.sendDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="arrow-up" size={21} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        <Sheet
          visible={attachments}
          onClose={() => setAttachments(false)}
          title="Add family context"
          footer={
            <Button
              title="Close"
              variant="secondary"
              onPress={() => setAttachments(false)}
            />
          }
        >
          <View style={styles.sheetActions}>
            <Button
              title="Choose a family record"
              variant="secondary"
              onPress={() => {
                setAttachments(false);
                router.push("/records");
              }}
            />
            <Button
              title="Add a health reading"
              variant="secondary"
              onPress={() => {
                setAttachments(false);
                router.push("/quick-add/reading");
              }}
            />
          </View>
        </Sheet>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EmptyConversation({
  onPrompt,
}: {
  onPrompt: (prompt: string) => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.markWrap}>
        <CircleMark size={52} color={colors.textSecondary} strokeWidth={1.8} />
      </View>
      <View style={styles.emptyCopy}>
        <Text variant="title2" align="center">
          Ask about your family’s health
        </Text>
        <Text variant="callout" color={colors.textSecondary} align="center">
          Understand records, routines and care in clear, supportive language.
        </Text>
      </View>
      <View style={styles.promptGrid}>
        {suggestedPrompts.slice(0, 4).map((prompt) => (
          <Pressable
            key={prompt.id}
            onPress={() => onPrompt(prompt.text)}
            style={({ pressed }) => [
              styles.promptChip,
              pressed && styles.pressed,
            ]}
          >
            <Feather name={prompt.icon} size={15} color={colors.blue} />
            <Text
              variant="footnote"
              numberOfLines={2}
              style={styles.promptText}
            >
              {prompt.text}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TypingBubble() {
  return (
    <View style={[styles.messageGroup, styles.messageGroupCircle]}>
      <Text
        variant="caption"
        color={colors.textSecondary}
        style={styles.speaker}
      >
        CIRCLE
      </Text>
      <View style={[styles.bubble, styles.circleBubble, styles.typingBubble]}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, minHeight: 0, minWidth: 0, width: "100%" },
  header: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerCopy: { gap: spacing.xxs },
  newChat: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  contextScroller: { width: "100%", minWidth: 0, flexGrow: 0, flexShrink: 0 },
  contextRow: {
    height: 48,
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: screenPadding,
  },
  contextChip: {
    alignSelf: "center",
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  contextChipSelected: { backgroundColor: colors.textPrimary },
  conversation: { width: "100%", minWidth: 0, flex: 1, minHeight: 0 },
  conversationContent: {
    flexGrow: 1,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  emptyConversation: { justifyContent: "center" },
  emptyState: {
    alignItems: "center",
    gap: spacing.xl,
    paddingVertical: spacing.xl,
  },
  markWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  emptyCopy: { maxWidth: 330, gap: spacing.sm },
  promptGrid: {
    alignSelf: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  promptChip: {
    flexGrow: 1,
    flexBasis: "46%",
    minHeight: 48,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  promptText: { flexShrink: 1 },
  messageGroup: { alignSelf: "stretch", minWidth: 0, gap: spacing.xs },
  messageGroupUser: { alignItems: "flex-end" },
  messageGroupCircle: { alignItems: "flex-start" },
  speaker: { marginLeft: spacing.sm, letterSpacing: 0.7 },
  bubble: {
    minWidth: 0,
    maxWidth: "82%",
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userBubble: {
    backgroundColor: colors.blue,
    borderBottomRightRadius: spacing.xs,
  },
  circleBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: spacing.xs,
    ...shadows.sm,
  },
  sources: { width: "82%", gap: spacing.xs, marginTop: spacing.xs },
  sourceCard: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.blueTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sourceText: { flexShrink: 1, flexGrow: 1 },
  actions: {
    width: "82%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionChip: {
    flexGrow: 1,
    flexBasis: "46%",
    height: 46,
    borderRadius: radius.input,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  typingBubble: {
    minWidth: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textTertiary,
  },
  listEndSpace: { height: spacing.xs },
  composerArea: {
    width: "100%",
    minWidth: 0,
    flexShrink: 0,
    paddingHorizontal: screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  composer: {
    minHeight: 64,
    maxHeight: 120,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.cardLarge,
    backgroundColor: colors.ink,
    padding: spacing.sm,
    ...shadows.md,
  },
  attach: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.inkMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 102,
    color: colors.onInk,
    fontSize: 16,
    lineHeight: 21,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  send: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
  sheetActions: { gap: spacing.sm },
});
