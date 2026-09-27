import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text as CircleText } from '@/components/Text';
import { PersonalText } from '@/accounts/savita/PersonalText';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';

export function DetailHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  const { activeAccountId } = useAppState();
  const Text = activeAccountId === 'savita' ? PersonalText : CircleText;
  return (
    <View style={styles.row}>
      <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
        <Feather name="chevron-left" size={25} color={colors.blue} />
      </Pressable>
      <Text variant="headline" style={styles.title}>{title}</Text>
      {actionLabel && onAction ? <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel} style={styles.action}><Text variant="subhead" color={colors.blue}>{actionLabel}</Text></Pressable> : <View style={styles.end} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  back: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center' }, action: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: spacing.sm }, end: { width: 44 },
});
