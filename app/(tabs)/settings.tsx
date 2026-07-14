import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AccountSection, Card, CircleMark, IconChip, ListRow, ScreenContainer, ScreenHeader, Text } from '@/components';
import { SavitaSettings } from '@/accounts/savita/SavitaSettings';
import { useAppState } from '@/state';
import { accents, colors, spacing } from '@/theme';
import type { AccentName } from '@/theme';
import type { FeatherIconName } from '@/types';

type Item = { id: string; title: string; value?: string; icon: FeatherIconName; accent: AccentName; href?: string };
const groups: { title: string; items: Item[] }[] = [
  { title: 'Family & health', items: [
    { id: 'family', title: 'Family management', value: '4 members', icon: 'users', accent: 'blue' }, { id: 'permissions', title: 'Roles & permissions', value: 'Care Captain', icon: 'shield', accent: 'sage' },
    { id: 'sources', title: 'Connected health sources', value: '2 connected', icon: 'heart', accent: 'plum' }, { id: 'medications', title: 'Medications', value: '9 active', icon: 'plus-circle', accent: 'amber', href: '/medications' },
    { id: 'records', title: 'Family record vault', value: '14 records', icon: 'folder', accent: 'blue', href: '/records' }, { id: 'goals', title: 'Goals', value: '5 active', icon: 'award', accent: 'sage', href: '/goals' },
  ] },
  { title: 'Preferences', items: [
    { id: 'notifications', title: 'Notification preferences', value: 'On', icon: 'bell', accent: 'plum' }, { id: 'subscription', title: 'Subscription', value: 'Family plan', icon: 'star', accent: 'amber' },
    { id: 'payments', title: 'Payment methods', value: '•••• 4242', icon: 'credit-card', accent: 'blue' }, { id: 'language', title: 'Language', value: 'English', icon: 'globe', accent: 'sage' }, { id: 'accessibility', title: 'Accessibility', icon: 'eye', accent: 'plum' },
  ] },
  { title: 'Privacy & support', items: [
    { id: 'privacy', title: 'Privacy & security', icon: 'lock', accent: 'blue' }, { id: 'data', title: 'Export or delete data', icon: 'download', accent: 'amber' }, { id: 'help', title: 'Help', icon: 'help-circle', accent: 'sage' }, { id: 'legal', title: 'Legal', icon: 'file-text', accent: 'plum' },
  ] },
  { title: 'Demo controls', items: [
    { id: 'reset', title: 'Reset demo data', icon: 'refresh-cw', accent: 'amber' }, { id: 'ai-history', title: 'Clear AI history', icon: 'message-circle', accent: 'blue' }, { id: 'onboarding', title: 'Replay onboarding', icon: 'play-circle', accent: 'sage', href: '/onboarding' }, { id: 'sign-out', title: 'Sign out simulation', icon: 'log-out', accent: 'plum' },
  ] },
];

export default function SettingsScreen() {
  const { activeAccountId } = useAppState();
  return activeAccountId === 'savita' ? <SavitaSettings /> : <ArjunSettingsScreen />;
}

function ArjunSettingsScreen() {
  return (
    <ScreenContainer bottomInset={120}>
      <ScreenHeader title="Settings" titleVariant="title1" style={styles.header} />
      <View style={styles.account}><AccountSection /></View>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text variant="overline" color={colors.textSecondary}>{group.title.toUpperCase()}</Text>
          <Card padding={spacing.sm}>
            {group.items.map((item, index) => (
              <View key={item.id}>
                {index ? <View style={styles.divider} /> : null}
                <ListRow title={item.title} value={item.value} onPress={() => router.push((item.href ?? `/settings/${item.id}`) as never)} leading={<IconChip size={40} background={accents[item.accent].tint}><Feather name={item.icon} size={18} color={accents[item.accent].solid} /></IconChip>} style={styles.row} />
              </View>
            ))}
          </Card>
        </View>
      ))}
      <View style={styles.footer}><CircleMark size={30} color={colors.textTertiary} strokeWidth={1.8} /><Text variant="footnote" color={colors.textTertiary}>Circle by Swasth · Version 1.0.0</Text></View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.sm },
  account: { marginTop: spacing.xl },
  group: { marginTop: spacing.xxl, gap: spacing.sm },
  row: { paddingHorizontal: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.md + 40 + spacing.lg },
  footer: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.giant },
});
