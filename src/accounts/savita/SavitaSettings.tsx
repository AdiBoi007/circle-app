import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AccountSection, Button, Card, ListRow, ScreenContainer, ScreenHeader, Sheet } from '@/components';
import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';

export function SavitaSettings() {
  const { personalPreferences, updatePersonalPreference, addNotification, addFamilyLog, resetDemo } = useAppState();
  const [sharing, setSharing] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  const askArjun = () => {
    addNotification({ id: `savita-help-${Date.now()}`, title: 'Savita asked for help', body: 'Savita would like help managing her care.', memberId: 'savita', time: 'Just now', group: 'Today', read: false, href: '/member/savita' });
    addFamilyLog({ id: `savita-help-log-${Date.now()}`, memberId: 'savita', category: 'Note', text: 'Savita asked Arjun for help managing her care.', time: 'Just now' });
    setConfirmation('Arjun has been asked to help.');
  };

  return (
    <ScreenContainer bottomInset={132} contentStyle={styles.content}>
      <ScreenHeader title="Settings" titleVariant="title1" />
      <AccountSection />
      {confirmation ? <View style={styles.confirmation} accessibilityLiveRegion="polite"><Feather name="check-circle" size={22} color={colors.sage} /><Text variant="body" style={styles.flex}>{confirmation}</Text></View> : null}

      <SettingsSection title="Accessibility">
        <Toggle label="Larger text" value={personalPreferences.largerText} onChange={(value) => updatePersonalPreference('largerText', value)} />
        <Line />
        <Toggle label="Read answers aloud" value={personalPreferences.readAloud} onChange={(value) => { updatePersonalPreference('readAloud', value); if (!value) void Speech.stop(); setConfirmation(value ? 'Circle answers can now be read aloud.' : 'Read aloud is off.'); }} />
        <Line />
        <Toggle label="Reduce motion" value={personalPreferences.reduceMotion} onChange={(value) => updatePersonalPreference('reduceMotion', value)} />
        <Line />
        <Toggle label="High contrast" value={personalPreferences.highContrast} onChange={(value) => updatePersonalPreference('highContrast', value)} />
      </SettingsSection>

      <SettingsSection title="Help from family">
        <View style={styles.helpCopy}><Feather name="users" size={24} color={colors.plum} /><View style={styles.flex}><Text variant="headline">Arjun can help manage my care</Text><Text variant="body" color={colors.textSecondary}>He can see the health information you choose to share.</Text></View></View>
        <Line />
        <ListRow title="View what is shared" onPress={() => setSharing(true)} />
        <Line />
        <Pressable onPress={askArjun} accessibilityRole="button" accessibilityLabel="Ask Arjun for help" style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}><Feather name="message-circle" size={22} color={colors.blue} /><Text variant="headline" color={colors.blue}>Ask Arjun for help</Text></Pressable>
      </SettingsSection>

      <SettingsSection title="Notifications">
        <Toggle label="Medicines" value={personalPreferences.medicineNotifications} onChange={(value) => updatePersonalPreference('medicineNotifications', value)} />
        <Line />
        <Toggle label="Appointments" value={personalPreferences.appointmentNotifications} onChange={(value) => updatePersonalPreference('appointmentNotifications', value)} />
        <Line />
        <Toggle label="Care reminders" value={personalPreferences.careNotifications} onChange={(value) => updatePersonalPreference('careNotifications', value)} />
      </SettingsSection>

      <SettingsSection title="Safety and privacy">
        <ListRow title="Privacy" subtitle="Control your information" onPress={() => router.push('/settings/privacy')} />
        <Line />
        <ListRow title="Emergency information" subtitle="Medicines, contacts and important details" onPress={() => router.push('/emergency')} />
      </SettingsSection>

      <View style={styles.actions}>
        <Button title="Sign out" variant="secondary" onPress={() => router.replace('/onboarding')} />
        <Button title="Reset demo" variant="tertiary" onPress={() => { resetDemo(); requestAnimationFrame(() => router.replace('/')); }} />
      </View>

      <Sheet visible={sharing} onClose={() => setSharing(false)} title="What Arjun can see" footer={<Button title="Done" onPress={() => setSharing(false)} />}>
        <Text variant="body" color={colors.textSecondary}>Only Savita’s selected health information is shared.</Text>
        <View style={styles.sharedList}>{['Appointments and care plans', 'Medicines and reminders', 'Reports Savita adds', 'Updates Savita sends'].map((item) => <View key={item} style={styles.sharedRow}><Feather name="check-circle" size={22} color={colors.sage} /><Text variant="body" style={styles.flex}>{item}</Text></View>)}</View>
      </Sheet>
    </ScreenContainer>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text variant="title2">{title}</Text><Card padding={spacing.md} elevation="none" bordered>{children}</Card></View>;
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={styles.toggle}><Text variant="body" style={styles.flex}>{label}</Text><Switch value={value} onValueChange={onChange} accessibilityLabel={label} accessibilityRole="switch" accessibilityState={{ checked: value }} trackColor={{ false: colors.borderStrong, true: colors.blue }} /></View>;
}
function Line() { return <View style={styles.line} />; }

const styles = StyleSheet.create({
  content: { gap: spacing.xxl },
  flex: { flex: 1, minWidth: 0 },
  confirmation: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.sageTint, borderRadius: 16 },
  section: { gap: spacing.md },
  toggle: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.sm },
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginHorizontal: spacing.sm },
  helpCopy: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm },
  helpButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  actions: { gap: spacing.md },
  sharedList: { gap: spacing.sm, marginTop: spacing.lg },
  sharedRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pressed: { opacity: 0.7 },
});
