import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import { ScreenContainer, Text } from "@/components";
import { colors } from "@/theme";

export function LivePage({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <ScreenContainer
      edges={["bottom"]}
      contentStyle={liveStyles.page}
      bottomInset={32}
    >
      {title ? (
        <View style={liveStyles.pageHeading}>
          <View style={{ flex: 1, gap: 7 }}>
            <Text variant="largeTitle" accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? (
              <Text color={colors.textSecondary}>{subtitle}</Text>
            ) : null}
          </View>
          {action}
        </View>
      ) : null}
      {children}
    </ScreenContainer>
  );
}
export function LiveCard({ children }: { children: ReactNode }) {
  return <View style={liveStyles.card}>{children}</View>;
}
export function LiveField({
  label,
  value,
  onChangeText,
  multiline = false,
  secureTextEntry = false,
  placeholder,
  keyboardType,
  maxLength = 2000,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  secureTextEntry?: boolean;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="headline">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={
          secureTextEntry || keyboardType === "email-address"
            ? "none"
            : "sentences"
        }
        autoCorrect={!secureTextEntry && keyboardType !== "email-address"}
        style={[
          liveStyles.input,
          multiline && { minHeight: 104, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}
export function LiveNotice({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <View
      style={[liveStyles.notice, error && { backgroundColor: colors.redTint }]}
    >
      <Text
        accessibilityRole={error ? "alert" : undefined}
        color={error ? colors.red : colors.textSecondary}
      >
        {message}
      </Text>
    </View>
  );
}
export function LiveChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[liveStyles.chip, selected && { backgroundColor: colors.blue }]}
    >
      <Text
        variant="subhead"
        color={selected ? colors.white : colors.textPrimary}
        style={{ fontWeight: "600", flexShrink: 1 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export const price = (value: number) => `₹${value.toLocaleString("en-IN")}`;
export const dateLabel = (value: string) =>
  new Date(`${value.slice(0, 10)}T12:00:00+05:30`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
export const timeLabel = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "am" : "pm"}`;
};
export const liveStyles = StyleSheet.create({
  page: { gap: 18, paddingTop: 18 },
  pageHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  spread: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stack: { gap: 14 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    fontSize: 17,
    color: colors.textPrimary,
  },
  notice: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    padding: 16,
  },
  chip: {
    maxWidth: "100%",
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
  muted: { color: colors.textSecondary },
  flex: { flex: 1 },
  section: { gap: 12 },
});
