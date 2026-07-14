import { Pressable, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Text } from '@/components/Text';
import { colors, spacing } from '@/theme';
import type { FamilyMember } from '@/types';

type Props = {
  members: FamilyMember[];
  selectedId: string;
  onSelect: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

/**
 * Horizontal family-member selector. The active member gets a strong ring and
 * a bolder label; tapping switches the member the Home dashboard reflects.
 */
export function FamilySelector({ members, selectedId, onSelect, style }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={style}
    >
      {members.map((member) => {
        const selected = member.id === selectedId;
        return (
          <Pressable
            key={member.id}
            onPress={() => onSelect(member.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${member.name}, ${member.relation}`}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <Avatar name={member.name} accent={member.accent} selected={selected} size={58} />
            <Text
              variant="subhead"
              color={selected ? colors.textPrimary : colors.textSecondary}
              numberOfLines={1}
            >
              {firstName(member.name)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  item: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 72,
  },
  pressed: {
    opacity: 0.7,
  },
});
