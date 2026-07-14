import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Sheet } from '@/components/Sheet';
import { Text as CircleText, type TextProps } from '@/components/Text';
import { PersonalText } from '@/accounts/savita/PersonalText';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';
import type { DemoAccountId } from '@/types';

const accounts = [
  {
    id: 'arjun' as const,
    name: 'Arjun Mehra',
    role: 'Family Organiser',
    description: 'Manage health and care for your family.',
    accent: 'blue' as const,
  },
  {
    id: 'savita' as const,
    name: 'Savita Mehra',
    role: 'Personal Account',
    description: 'View and manage your own health.',
    accent: 'plum' as const,
  },
];

export function AccountSection() {
  const { activeAccountId, setActiveAccountId } = useAppState();
  const [open, setOpen] = useState(false);
  const active = accounts.find((account) => account.id === activeAccountId)!;

  const switchAccount = (id: DemoAccountId) => {
    setOpen(false);
    setActiveAccountId(id);
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  };

  return (
    <View style={styles.section}>
      <Text variant="overline" color={colors.textSecondary}>ACCOUNT</Text>
      <Card padding={spacing.lg} elevation="sm" bordered>
        <View style={styles.currentRow}>
          <Avatar name={active.name} accent={active.accent} size={56} />
          <View style={styles.copy}>
            <Text variant="title3">{active.name}</Text>
            <Text variant="callout" color={colors.textSecondary}>{active.role}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Switch account"
          accessibilityHint="Choose between Arjun and Savita"
          style={({ pressed }) => [styles.switchRow, pressed && styles.pressed]}
        >
          <Feather name="repeat" size={21} color={colors.blue} />
          <Text variant="headline" style={styles.copy}>Switch account</Text>
          <Feather name="chevron-right" size={21} color={colors.textSecondary} />
        </Pressable>
      </Card>

      <Sheet visible={open} onClose={() => setOpen(false)} title="Switch account">
        <Text variant="body" color={colors.textSecondary} style={styles.supporting}>Choose how you want to use Circle.</Text>
        <View style={styles.accounts}>
          {accounts.map((account) => {
            const selected = account.id === activeAccountId;
            return (
              <Pressable
                key={account.id}
                onPress={() => switchAccount(account.id)}
                accessibilityRole="button"
                accessibilityLabel={`${account.name}, ${account.role}`}
                accessibilityHint={account.description}
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.accountCard, selected && styles.accountSelected, pressed && styles.pressed]}
              >
                <Avatar name={account.name} accent={account.accent} size={58} />
                <View style={styles.copy}>
                  <Text variant="title3">{account.name}</Text>
                  <Text variant="headline" color={colors.textSecondary}>{account.role}</Text>
                  <Text variant="callout" color={colors.textSecondary}>{account.description}</Text>
                </View>
                <Feather name={selected ? 'check-circle' : 'circle'} size={24} color={selected ? colors.blue : colors.textSecondary} />
              </Pressable>
            );
          })}
        </View>
        <Text variant="footnote" color={colors.textSecondary} align="center" style={styles.note}>Demo account switching. Secure verification will be added before launch.</Text>
      </Sheet>
    </View>
  );
}

function Text(props: TextProps) {
  const { activeAccountId } = useAppState();
  return activeAccountId === 'savita' ? <PersonalText {...props} /> : <CircleText {...props} />;
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  currentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  copy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  switchRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  supporting: { marginBottom: spacing.lg },
  accounts: { gap: spacing.md },
  accountCard: { minHeight: 116, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.card, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface },
  accountSelected: { borderWidth: 2, borderColor: colors.blue, backgroundColor: colors.blueTint },
  note: { marginTop: spacing.xl, lineHeight: 19 },
  pressed: { opacity: 0.72 },
});
