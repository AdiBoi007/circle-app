import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Avatar, Button, CircleMark, ScreenContainer, Text } from '@/components';
import { useAppState } from '@/state';
import { colors } from '@/theme';
import type { DemoAccountId } from '@/types';

export default function OnboardingScreen() {
  const { setActiveAccountId, hasStarted } = useAppState();
  const [path, setPath] = useState<'myself' | 'family' | null>(null);
  const [step, setStep] = useState(0);
  const enter = (id: DemoAccountId) => { setActiveAccountId(id); router.replace(id === 'practitioner' ? '/practice' : '/'); };
  return <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.page} bottomInset={32}>
    <View style={styles.top}><View style={styles.brand}><CircleMark size={25} color={colors.blue} /><Text variant="headline">Circle</Text></View><Text variant="footnote" color={colors.textSecondary}>by Swasth</Text></View>
    {step === 0 ? <>
      <View style={styles.hero}><View style={styles.appIcon}><CircleMark size={54} color={colors.blue} strokeWidth={1.6} /></View><Text style={styles.headline}>Health, a little{ '\n' }more together.</Text><Text variant="body" color={colors.textSecondary} style={{ maxWidth: 420 }}>Your health and the people you care about.{ '\n' }All in one Circle.</Text></View>
      <Text variant="title2" accessibilityRole="header">Who are you managing health for?</Text>
      <View style={styles.options}>
        <Choice selected={path === 'myself'} icon="user" title="Myself" detail="My health, habits and personal care." onPress={() => setPath('myself')} />
        <Choice selected={path === 'family'} icon="users" title="My family & me" detail="Shared care for the people you love." onPress={() => setPath('family')} />
      </View>
      <Text variant="footnote" color={colors.textSecondary}>You can explore both. Choose where to start.</Text>
      <Button title="Sign in to the live beta" variant="secondary" onPress={() => router.push('/beta')} />
      <Button title="Continue" disabled={!path} onPress={() => setStep(1)} />
      <Button title="I’m a practitioner" variant="secondary" onPress={() => enter('practitioner')} />
      {hasStarted && <Button title="Back to my Circle" variant="tertiary" onPress={() => router.replace('/')} />}
    </> : <>
      <Pressable onPress={() => setStep(0)} accessibilityRole="button" style={styles.back}><Feather name="arrow-left" size={20} color={colors.textPrimary} /><Text variant="headline">Back</Text></Pressable>
      <Text style={styles.headline}>{path === 'myself' ? 'A space for you.' : 'Care, together.'}</Text>
      <Text color={colors.textSecondary}>{path === 'myself' ? 'Meet Riya, 29, in Chandigarh. Explore her health, daily habits and local care.' : 'The Mehras live in Chandigarh. Choose a view to explore.'}</Text>
      {path === 'myself' ? <View style={styles.preview}><View style={styles.initials}><Text variant="title2" color={colors.sage}>RS</Text></View><Text variant="title2">Riya Shah</Text><Text color={colors.textSecondary}>Personal health · Chandigarh</Text><View style={styles.featureRow}>{['Daily habits', 'My health', 'Find care'].map((label) => <Text key={label} variant="subhead" style={styles.feature}>{label}</Text>)}</View><Button title="Explore as Riya" onPress={() => enter('riya')} /></View> : <View style={styles.options}>
        <View style={styles.preview}><View style={styles.person}><Avatar name="Arjun Mehra" size={56} /><View style={{ flex: 1 }}><Text variant="title2">Arjun</Text><Text color={colors.textSecondary}>Family organiser · Chandigarh</Text></View></View><Text color={colors.textSecondary}>See what needs attention, share the care, and keep everyone’s essentials close.</Text><Button title="Explore family management" onPress={() => enter('arjun')} /></View>
        <View style={styles.preview}><View style={styles.person}><Avatar name="Savita Mehra" size={56} accent="plum" /><View style={{ flex: 1 }}><Text variant="title2">Savita</Text><Text color={colors.textSecondary}>Simple view · Chandigarh</Text></View></View><Text color={colors.textSecondary}>A few clear actions, larger text, and an easy way to ask for help.</Text><Button title="Try the simple view" variant="secondary" onPress={() => enter('savita')} /></View>
      </View>}
      <Text variant="footnote" color={colors.textSecondary}>This is an interactive preview with sample data. Your choices and bookings stay in this session.</Text>
    </>}
  </ScreenContainer>;
}

function Choice({ selected, icon, title, detail, onPress }: { selected: boolean; icon: 'user' | 'users'; title: string; detail: string; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${title}. ${detail}`} style={({ pressed }) => [styles.choice, selected && styles.chosen, pressed && { opacity: 0.8 }]}><View style={styles.choiceIcon}><Feather name={icon} size={24} color={colors.blue} /></View><View style={{ flex: 1, gap: 5 }}><Text variant="headline">{title}</Text><Text variant="subhead" color={colors.textSecondary}>{detail}</Text></View><Feather name={selected ? 'check-circle' : 'circle'} size={23} color={selected ? colors.blue : colors.textTertiary} /></Pressable>;
}
const styles = StyleSheet.create({
  page: { gap: 20 }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 }, brand: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  hero: { gap: 16, paddingTop: 6, paddingBottom: 16 }, headline: { fontSize: 38, lineHeight: 42, fontWeight: '700', letterSpacing: -1.1 },
  appIcon: { width: 80, height: 80, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  options: { gap: 12 }, choice: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.surface, borderRadius: 20, padding: 18, minHeight: 100 }, chosen: { borderColor: colors.blue, backgroundColor: colors.surface }, choiceIcon: { width: 40, height: 44, borderRadius: 13, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48 }, preview: { borderRadius: 26, padding: 23, backgroundColor: colors.surface, gap: 17, borderWidth: 1, borderColor: colors.border }, person: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  initials: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' }, featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, feature: { backgroundColor: colors.blueTint, padding: 10, borderRadius: 12 },
});
