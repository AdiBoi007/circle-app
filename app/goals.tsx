import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import {
  Button,
  Card,
  DetailHeader,
  ProgressBar,
  ScreenContainer,
  Sheet,
  StatusPill,
  Text,
} from "@/components";
import { family } from "@/data";
import { useAppState } from "@/state";
import { accents, colors, spacing } from "@/theme";
import type { Goal } from "@/types";

export default function GoalsScreen() {
  const { goals, updateGoal, replaceGoal } = useAppState();
  const [selected, setSelected] = useState<Goal>();
  const [history, setHistory] = useState(false);
  return (
    <ScreenContainer edges={["top", "bottom"]}>
      <DetailHeader
        title="July goals"
        actionLabel="History"
        onAction={() => setHistory(true)}
      />
      <Text variant="callout" color={colors.textSecondary} style={styles.intro}>
        Small, supportive goals for each person—progress is information, not a
        judgement.
      </Text>
      <View style={styles.list}>
        {goals
          .filter((goal) => goal.active)
          .map((goal) => {
            const member = family.find((item) => item.id === goal.memberId);
            return (
              <Card key={goal.id} onPress={() => setSelected(goal)}>
                <View style={styles.top}>
                  <View
                    style={[
                      styles.icon,
                      { backgroundColor: accents[goal.accent].tint },
                    ]}
                  >
                    <Feather
                      name={goal.memberId ? "user" : "users"}
                      size={20}
                      color={accents[goal.accent].solid}
                    />
                  </View>
                  <View style={styles.copy}>
                    <Text variant="caption" color={colors.textSecondary}>
                      {member?.name ?? "Mehra family"}
                    </Text>
                    <Text variant="headline">{goal.title}</Text>
                  </View>
                  <StatusPill label="Active" accent={goal.accent} />
                </View>
                <Text
                  variant="footnote"
                  color={colors.textSecondary}
                  style={styles.progressText}
                >
                  {goal.caption}
                </Text>
                <ProgressBar
                  progress={goal.current / goal.target}
                  accent={goal.accent}
                  accessibilityLabel={goal.caption}
                />
              </Card>
            );
          })}
      </View>
      <Sheet
        visible={Boolean(selected)}
        onClose={() => setSelected(undefined)}
        title={selected?.title}
      >
        <View style={styles.sheet}>
          <Text variant="title1">{selected?.caption}</Text>
          <Text variant="callout" color={colors.textSecondary}>
            Update progress one step at a time. You can also replace this goal;
            the previous goal will move to history.
          </Text>
          <View style={styles.actions}>
            <Button
              title="Add one to progress"
              onPress={() => {
                if (selected) {
                  updateGoal(selected.id, selected.current + 1);
                  setSelected({
                    ...selected,
                    current: Math.min(selected.target, selected.current + 1),
                  });
                }
              }}
            />
            <Button
              title="Reduce by one"
              variant="secondary"
              onPress={() => {
                if (selected) {
                  updateGoal(selected.id, selected.current - 1);
                  setSelected({
                    ...selected,
                    current: Math.max(0, selected.current - 1),
                  });
                }
              }}
            />
            <Button
              title="Replace with a fresh July goal"
              variant="tertiary"
              onPress={() => {
                if (selected) replaceGoal(selected.id, `Build a steady ${selected.unit} routine`);
                setSelected(undefined);
              }}
            />
          </View>
        </View>
      </Sheet>
      <Sheet
        visible={history}
        onClose={() => setHistory(false)}
        title="June goal history"
        footer={<Button title="Close" onPress={() => setHistory(false)} />}
      >
        <View style={styles.sheet}>
          <Text variant="headline">A steadier June</Text>
          <Text variant="callout" color={colors.textSecondary}>
            Arjun improved his sleep routine, Rajiv logged readings more
            consistently, Neha built a walking habit, and Savita began her
            mobility plan.
          </Text>
          <StatusPill label="Archived" accent="neutral" />
        </View>
      </Sheet>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  intro: { marginVertical: spacing.xl },
  list: { gap: spacing.lg },
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: spacing.xs },
  progressText: { marginTop: spacing.lg, marginBottom: spacing.sm },
  sheet: { gap: spacing.lg },
  actions: { gap: spacing.sm },
});
