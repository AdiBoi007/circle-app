import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';
import type { DemoAccountId } from '@/types';

export const demoAccounts = [
  { id: 'arjun', name: 'Arjun Mehra', shortName: 'Arjun', role: 'Family organiser', description: 'One clear view of everyone you care for.', accent: 'blue' },
  { id: 'savita', name: 'Savita Mehra', shortName: 'Savita', role: 'Simple view', description: 'Your day, your medicines, and a little help.', accent: 'plum' },
  { id: 'riya', name: 'Riya Shah', shortName: 'Riya', role: 'Personal health', description: 'Your habits, health and people who can help.', accent: 'sage' },
  { id: 'practitioner', name: 'Arvind Nair', shortName: 'Arvind', role: 'Practitioner', description: 'Your practice, availability and appointment requests.', accent: 'blue' },
] as const;

export function AccountSection({ compact = false }: { compact?: boolean }) {
  const { activeAccountId, setActiveAccountId, practice } = useAppState();
  const [open, setOpen] = useState(false);
  const accounts = demoAccounts.map((account) => account.id === 'practitioner' ? { ...account, name: practice.profile.name, shortName: practice.profile.name.split(' ')[0] } : account);
  const active = accounts.find((account) => account.id === activeAccountId)!;
  const navigate = (href: '/settings' | '/onboarding') => { setOpen(false); router.push(activeAccountId === 'practitioner' && href === '/settings' ? '/practice/profile' : href); };
  const switchAccount = (id: DemoAccountId) => {
    setOpen(false);
    setActiveAccountId(id);
    router.replace(id === 'practitioner' ? '/practice' : '/');
  };
  return <>
    <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={`${active.name}, ${active.role}. Switch profile or open settings`} style={({ pressed }) => [styles.current, compact && styles.compact, pressed && styles.pressed]}>
      {active.id === 'riya' ? <View style={styles.initials}><Text variant="headline" color={colors.sage}>RS</Text></View> : <Avatar name={active.name} accent={active.accent} size={compact ? 32 : 48} />}
      <View style={[styles.copy, compact && styles.compactCopy]}><Text variant={compact ? 'footnote' : 'title3'} color={compact ? colors.blue : colors.textPrimary}>{compact ? active.shortName : active.name}</Text>{!compact && <Text color={colors.textSecondary} variant="callout">{active.role}</Text>}</View>
      <Feather name="chevron-down" size={compact ? 12 : 18} color={compact ? colors.blue : colors.textSecondary} />
    </Pressable>
    <Sheet visible={open} onClose={() => setOpen(false)} title="Your Circle">
      <Text color={colors.textSecondary} style={styles.intro}>Choose a client or practitioner demo.</Text>
      <View style={styles.options}>
        {accounts.map((account) => <Pressable key={account.id} accessibilityRole="button" accessibilityState={{ selected: account.id === activeAccountId }} accessibilityLabel={`${account.name}, ${account.role}`} onPress={() => switchAccount(account.id)} style={[styles.option, account.id === activeAccountId && styles.selected]}>
          {account.id === 'riya' ? <View style={styles.initials}><Text variant="headline" color={colors.sage}>RS</Text></View> : <Avatar name={account.name} accent={account.accent} size={42} />}
          <View style={styles.copy}><Text variant="headline">{account.name}</Text><Text variant="subhead" color={colors.textSecondary}>{account.role}</Text><Text variant="footnote" color={colors.textSecondary}>{account.description}</Text></View>
          <Feather name={account.id === activeAccountId ? 'check-circle' : 'chevron-right'} size={20} color={colors.blue} />
        </Pressable>)}
      </View>
      <Pressable onPress={() => navigate('/settings')} accessibilityRole="button" style={styles.link}><Feather name="settings" size={21} color={colors.textPrimary} /><Text variant="headline">Settings & preferences</Text></Pressable>
      <Pressable onPress={() => navigate('/onboarding')} accessibilityRole="button" style={styles.link}><Feather name="compass" size={21} color={colors.textPrimary} /><Text variant="headline">Explore the two paths</Text></Pressable>
      <Text variant="footnote" color={colors.textSecondary}>Interactive demo · sample profiles · changes reset when you reload.</Text>
    </Sheet>
  </>;
}

const styles = StyleSheet.create({
  current: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border },
  compact: { minHeight: 48, flexShrink: 0, paddingVertical: 0, paddingHorizontal: 0, borderWidth: 0, backgroundColor: 'transparent', gap: 3, borderRadius: radius.pill, alignSelf: 'center' },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  compactCopy: { flex: undefined, flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  initials: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
  intro: { marginBottom: spacing.lg }, options: { gap: spacing.sm },
  option: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border },
  selected: { backgroundColor: colors.blueTint, borderColor: colors.blue },
  link: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  pressed: { opacity: 0.7 },
});
