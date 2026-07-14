import { useState } from "react";
import { Feather as FeatherBase } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

import {
  Button,
  Card,
  DetailHeader,
  ScreenContainer,
  Sheet,
  StatusPill,
  Text as CircleText,
} from "@/components";
import { PersonalText } from '@/accounts/savita/PersonalText';
import type { TextProps } from '@/components/Text';
import { CircleAIIcon } from '@/components/icons/CircleAIIcon';
import { family } from "@/data";
import { useAppState } from "@/state";
import { colors, spacing } from "@/theme";

function Feather({
  name,
  size,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const resolved = (
    name === "sparkles" ? "star" : name
  ) as keyof typeof FeatherBase.glyphMap;
  return <FeatherBase name={resolved} size={size} color={color} />;
}

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeAccountId, records, deleteRecord } = useAppState();
  const [share, setShare] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const personal = activeAccountId === 'savita';
  const record = records.find((item) => item.id === id && (!personal || item.memberId === 'savita'));
  if (!record)
    return (
      <ScreenContainer>
        <DetailHeader title="Record" />
        <Card>
          <Text variant="headline">{personal ? 'This record is not available.' : 'Record removed'}</Text>
          <Button
            title="Back to vault"
            onPress={() => router.replace("/records")}
            style={styles.gap}
          />
        </Card>
      </ScreenContainer>
    );
  const member = family.find((item) => item.id === record.memberId)!;
  const related = records.find((item) => item.id === record.relatedId);
  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <DetailHeader
        title="Record detail"
        actionLabel="Share"
        onAction={() => setShare(true)}
      />
      <View style={styles.hero}>
        <Feather name="file-text" size={34} color={colors.blue} />
        <Text variant="title1" align="center">
          {record.title}
        </Text>
        <Text variant="subhead" color={colors.textSecondary}>
          {member.name} · {record.date}
        </Text>
        <StatusPill label={record.status} accent="sage" />
      </View>
      <Card>
        <Text variant="overline" color={colors.textSecondary}>
          EXTRACTED VALUES
        </Text>
        {record.values.map((value) => (
          <View key={value.label} style={styles.value}>
            <Text variant="callout">{value.label}</Text>
            <View style={styles.valueRight}>
              <Text variant="headline">{value.value}</Text>
              {value.flag ? (
                <StatusPill
                  label={value.flag}
                  accent={value.flag === "Normal" ? "sage" : "amber"}
                />
              ) : null}
            </View>
          </View>
        ))}
      </Card>
      <Card background={colors.blueTint} style={styles.section}>
        <View style={styles.aiTitle}>
          {personal ? <CircleAIIcon size={22} color={colors.blue} /> : <Feather name="sparkles" size={20} color={colors.blue} />}
          <Text variant="title3">Circle explanation</Text>
        </View>
        <Text variant="callout" color={colors.textSecondary}>
          {record.explanation}
        </Text>
      </Card>
      {related ? (
        <Card
          onPress={() => router.push(`/record/${related.id}`)}
          style={styles.section}
        >
          <Text variant="overline" color={colors.textSecondary}>
            RELATED PREVIOUS REPORT
          </Text>
          <Text variant="headline" style={styles.gap}>
            {related.title}
          </Text>
          <Text variant="footnote" color={colors.textSecondary}>
            {related.date}
          </Text>
        </Card>
      ) : null}
      <Card style={styles.section}>
        <Text variant="overline" color={colors.textSecondary}>
          SOURCES & CITATIONS
        </Text>
        <Text variant="callout" style={styles.gap}>
          Original uploaded document · {record.title}
        </Text>
        <Text variant="footnote" color={colors.textSecondary}>
          Explanation is grounded only in values extracted from this record and
          its linked comparison. Always verify against the original document.
        </Text>
      </Card>
      <Button
        title="Ask Circle about this"
        onPress={() =>
          router.push(
            `/(tabs)/ai?prompt=${encodeURIComponent(`Explain my report: ${record.title}`)}&recordId=${record.id}`,
          )
        }
      />
      <Button
        title="Delete record"
        variant="secondary"
        onPress={() => setConfirmDelete(true)}
        style={styles.gap}
      />
      <Sheet
        visible={share}
        onClose={() => setShare(false)}
        title="Share record"
        footer={<Button title="Done" onPress={() => setShare(false)} />}
      >
        <Text variant="callout" color={colors.textSecondary}>
          Choose a secure local share preview. The UI-only demo does not send
          the record.
        </Text>
        <View style={styles.shareOptions}>
          {[
            "Copy private link",
            "Share with care professional",
            "Export PDF preview",
          ].map((item) => (
            <Button
              key={item}
              title={item}
              variant="secondary"
              onPress={() => setShare(false)}
            />
          ))}
        </View>
      </Sheet>
      <Sheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this record?"
        footer={
          <View style={styles.shareOptions}>
            <Button
              title="Keep record"
              variant="secondary"
              onPress={() => setConfirmDelete(false)}
            />
            <Button
              title="Delete locally"
              onPress={() => {
                deleteRecord(record.id);
                setConfirmDelete(false);
                router.replace("/records");
              }}
            />
          </View>
        }
      >
        <Text variant="callout" color={colors.textSecondary}>
          {personal ? 'This removes the report from your Circle records.' : 'This removes the local demo record from the family vault.'}
        </Text>
      </Sheet>
    </ScreenContainer>
  );
}

function Text(props: TextProps) {
  const { activeAccountId } = useAppState();
  return activeAccountId === 'savita' ? <PersonalText {...props} /> : <CircleText {...props} />;
}
const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: spacing.sm, marginVertical: spacing.xxxl },
  value: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.lg,
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  valueRight: { alignItems: "flex-end", gap: spacing.xs },
  section: { marginTop: spacing.lg, gap: spacing.md },
  aiTitle: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  gap: { marginTop: spacing.md },
  shareOptions: { gap: spacing.sm, marginTop: spacing.lg },
});
